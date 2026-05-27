import type { D1Database } from '@cloudflare/workers-types';

import { ApiError } from '../lib/api-error';
import { assertDate, generateDateRange, getDayOfWeek, minutesToTime, nowIso, parseTimeToMinutes } from '../lib/time';
import { getProductById } from './product-service';
import { getScheduleById, listSchedulesByProduct } from './schedule-service';
import type { ScheduleSummary, SlotGenerationPlan, SlotSummary } from '../types';

type ProtectedSlotRow = {
	id: string;
	date: string;
	startTime: string;
	bookings: number;
	waitlist: number;
};

type GenerationRequest = {
	productId?: string;
	scheduleId?: string;
	fromDate: string;
	toDate: string;
	replaceExisting?: boolean;
	preview?: boolean;
};

export async function listSlotsByProductDate(db: D1Database, productId: string, date: string): Promise<SlotSummary[]> {
	await getProductById(db, productId);
	assertDate(date, 'date');
	const result = await db.prepare(`
		SELECT id, scheduleId, productId, date, startTime, endTime, totalCapacity, bookedCount, status, createdAt
		FROM slots
		WHERE productId = ? AND date = ?
		ORDER BY startTime ASC
	`).bind(productId, date).all<SlotSummary>();

	return result.results ?? [];
}

export async function getSlotById(db: D1Database, id: string): Promise<SlotSummary> {
	const slot = await db.prepare(`
		SELECT id, scheduleId, productId, date, startTime, endTime, totalCapacity, bookedCount, status, createdAt
		FROM slots WHERE id = ?
	`).bind(id).first<SlotSummary>();

	if (!slot) {
		throw new ApiError(404, `Slot ${id} was not found.`);
	}

	return slot;
}

export async function planSlotGeneration(db: D1Database, request: GenerationRequest): Promise<{ plan: SlotGenerationPlan; inserts: SlotSummary[] }> {
	assertDate(request.fromDate, 'fromDate');
	assertDate(request.toDate, 'toDate');

	let productId = request.productId;
	let schedules: ScheduleSummary[] = [];

	if (request.scheduleId) {
		const schedule = await getScheduleById(db, request.scheduleId);
		productId = schedule.productId;
		schedules = [schedule];
	} else if (productId) {
		schedules = await listSchedulesByProduct(db, productId);
	} else {
		throw new ApiError(400, 'productId or scheduleId is required.');
	}

	if (schedules.length === 0) {
		throw new ApiError(404, 'No schedules were found for slot generation.');
	}

	const product = await getProductById(db, productId);
	const dates = generateDateRange(request.fromDate, request.toDate);
	const candidateSlots = buildCandidateSlots({ dates, product, schedules });
	const existingResult = await db.prepare(`
		SELECT id, scheduleId, productId, date, startTime, endTime, totalCapacity, bookedCount, status, createdAt
		FROM slots
		WHERE productId = ? AND date BETWEEN ? AND ?
	`).bind(product.id, request.fromDate, request.toDate).all<SlotSummary>();
	const existing = existingResult.results ?? [];
	const existingKeys = new Set(existing.map((slot) => `${slot.date}:${slot.startTime}`));
	const inserts = request.replaceExisting
		? candidateSlots
		: candidateSlots.filter((slot) => !existingKeys.has(`${slot.date}:${slot.startTime}`));

	const protectedResult = await db.prepare(`
		SELECT
			slots.id,
			slots.date,
			slots.startTime,
			COUNT(DISTINCT bookings.id) as bookings,
			COUNT(DISTINCT waitlist.id) as waitlist
		FROM slots
		LEFT JOIN bookings ON bookings.slotId = slots.id AND bookings.status = 'CONFIRMED'
		LEFT JOIN waitlist ON waitlist.slotId = slots.id AND waitlist.status IN ('WAITING', 'PROMOTED')
		WHERE slots.productId = ? AND slots.date BETWEEN ? AND ?
		GROUP BY slots.id, slots.date, slots.startTime
		HAVING bookings > 0 OR waitlist > 0
		ORDER BY slots.date ASC, slots.startTime ASC
	`).bind(product.id, request.fromDate, request.toDate).all<ProtectedSlotRow>();

	const protectedSlots = protectedResult.results ?? [];

	return {
		plan: {
			productId: product.id,
			fromDate: request.fromDate,
			toDate: request.toDate,
			replaceExisting: Boolean(request.replaceExisting),
			timezone: product.timezone,
			scheduleIds: schedules.map((schedule) => schedule.id),
			candidateSlots: candidateSlots.length,
			existingSlots: existing.length,
			slotsToCreate: inserts.length,
			slotsToDelete: request.replaceExisting ? existing.length : 0,
			protectedSlots,
		},
		inserts,
	};
}

export async function generateSlots(db: D1Database, request: GenerationRequest): Promise<SlotGenerationPlan> {
	const { plan, inserts } = await planSlotGeneration(db, request);

	if (!request.replaceExisting && inserts.length === 0) {
		return plan;
	}

	await acquireGenerationLock(db, plan.productId, plan.fromDate, plan.toDate, request.preview ? 'preview' : 'replace');

	try {
		if (plan.replaceExisting && plan.protectedSlots.length > 0) {
			throw new ApiError(409, 'Cannot replace slots in this window because some slots are protected by bookings or waitlist entries.', {
				protectedSlots: plan.protectedSlots,
			});
		}

		if (plan.replaceExisting) {
			await db.prepare('DELETE FROM slots WHERE productId = ? AND date BETWEEN ? AND ?').bind(plan.productId, plan.fromDate, plan.toDate).run();
		}

		if (inserts.length > 0) {
			const statements = inserts.map((slot) => db.prepare(`
				INSERT INTO slots (id, scheduleId, productId, date, startTime, endTime, totalCapacity, bookedCount, status, createdAt)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				slot.id,
				slot.scheduleId,
				slot.productId,
				slot.date,
				slot.startTime,
				slot.endTime,
				slot.totalCapacity,
				slot.bookedCount,
				slot.status,
				slot.createdAt,
			));

			await db.batch(statements);
		}

		return plan;
	} finally {
		await releaseGenerationLock(db, plan.productId);
	}
}

async function acquireGenerationLock(db: D1Database, productId: string, fromDate: string, toDate: string, mode: 'preview' | 'replace') {
	const now = nowIso();
	const expiresAt = new Date(Date.now() + (5 * 60 * 1000)).toISOString();

	await db.prepare('DELETE FROM slotGenerationLocks WHERE productId = ? AND expiresAt <= ?').bind(productId, now).run();

	try {
		await db.prepare(`
			INSERT INTO slotGenerationLocks (productId, fromDate, toDate, mode, createdAt, expiresAt)
			VALUES (?, ?, ?, ?, ?, ?)
		`).bind(productId, fromDate, toDate, mode, now, expiresAt).run();
	} catch (error) {
		throw new ApiError(409, `Slot generation is already running for product ${productId}.`, { cause: error instanceof Error ? error.message : error });
	}
}

async function releaseGenerationLock(db: D1Database, productId: string) {
	await db.prepare('DELETE FROM slotGenerationLocks WHERE productId = ?').bind(productId).run();
}

function buildCandidateSlots({ dates, product, schedules }: { dates: string[]; product: Awaited<ReturnType<typeof getProductById>>; schedules: ScheduleSummary[] }): SlotSummary[] {
	const createdAt = nowIso();
    const candidates: SlotSummary[] = [];

	for (const schedule of schedules) {
		const scheduleDays = new Set(schedule.daysOfWeek);
		const startMinutes = parseTimeToMinutes(schedule.startTime);
		const endMinutes = parseTimeToMinutes(schedule.endTime);

		for (const date of dates) {
			if (date < schedule.validFrom || (schedule.validUntil && date > schedule.validUntil)) {
				continue;
			}

			if (!scheduleDays.has(getDayOfWeek(date))) {
				continue;
			}

			for (let slotStart = startMinutes; slotStart + product.slotDurationMins <= endMinutes; slotStart += schedule.slotIntervalMins) {
				const slotEnd = slotStart + product.slotDurationMins;
				candidates.push({
					id: crypto.randomUUID(),
					scheduleId: schedule.id,
					productId: product.id,
					date,
					startTime: minutesToTime(slotStart),
					endTime: minutesToTime(slotEnd),
					totalCapacity: product.capacity,
					bookedCount: 0,
					status: 'AVAILABLE',
					createdAt,
				});
			}
		}
	}

	return candidates;
}