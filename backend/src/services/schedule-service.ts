import { ApiError } from '../lib/api-error';
import { assertDate, assertTime, nowIso, parseTimeToMinutes } from '../lib/time';
import { getProductById } from './product-service';
import type { ScheduleSummary } from '../types';

type ScheduleRow = Omit<ScheduleSummary, 'daysOfWeek'> & { daysOfWeek: string };

export type ScheduleInput = {
	startTime: string;
	endTime: string;
	daysOfWeek: number[];
	validFrom: string;
	validUntil?: string | null;
	slotIntervalMins: number;
};

const baseSelect = `
	SELECT id, productId, startTime, endTime, daysOfWeek, validFrom, validUntil, slotIntervalMins, createdAt, updatedAt
	FROM schedules
`;

function mapSchedule(row: ScheduleRow): ScheduleSummary {
	return {
		...row,
		daysOfWeek: JSON.parse(row.daysOfWeek) as number[],
	};
}

export async function listSchedulesByProduct(db: D1Database, productId: string): Promise<ScheduleSummary[]> {
	await getProductById(db, productId);
	const result = await db.prepare(`${baseSelect} WHERE productId = ? ORDER BY startTime ASC`).bind(productId).all<ScheduleRow>();

	return (result.results ?? []).map(mapSchedule);
}

export async function createSchedule(db: D1Database, productId: string, input: ScheduleInput): Promise<ScheduleSummary> {
	const product = await getProductById(db, productId);
	validateScheduleInput(input, product.slotDurationMins);

	const id = crypto.randomUUID();
	const timestamp = nowIso();

	await db.prepare(`
		INSERT INTO schedules (id, productId, startTime, endTime, daysOfWeek, validFrom, validUntil, slotIntervalMins, createdAt, updatedAt)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).bind(
		id,
		productId,
		input.startTime,
		input.endTime,
		JSON.stringify(input.daysOfWeek),
		input.validFrom,
		input.validUntil ?? null,
		input.slotIntervalMins,
		timestamp,
		timestamp,
	).run();

	return getScheduleById(db, id);
}

export async function updateSchedule(db: D1Database, id: string, input: ScheduleInput): Promise<ScheduleSummary> {
	const existing = await getScheduleById(db, id);
	const product = await getProductById(db, existing.productId);
	validateScheduleInput(input, product.slotDurationMins);

	await db.prepare(`
		UPDATE schedules
		SET startTime = ?, endTime = ?, daysOfWeek = ?, validFrom = ?, validUntil = ?, slotIntervalMins = ?, updatedAt = ?
		WHERE id = ?
	`).bind(
		input.startTime,
		input.endTime,
		JSON.stringify(input.daysOfWeek),
		input.validFrom,
		input.validUntil ?? null,
		input.slotIntervalMins,
		nowIso(),
		id,
	).run();

	return getScheduleById(db, id);
}

export async function deleteSchedule(db: D1Database, id: string): Promise<void> {
	await getScheduleById(db, id);
	const protectedSlots = await db.prepare(`
		SELECT COUNT(*) as count
		FROM slots
		WHERE scheduleId = ?
		AND (
			EXISTS (SELECT 1 FROM bookings WHERE bookings.slotId = slots.id)
			OR EXISTS (SELECT 1 FROM waitlist WHERE waitlist.slotId = slots.id AND waitlist.status IN ('WAITING', 'PROMOTED'))
		)
	`).bind(id).first<{ count: number }>();

	if ((protectedSlots?.count ?? 0) > 0) {
		throw new ApiError(409, 'Schedule cannot be deleted because generated slots are protected by bookings or waitlist entries.');
	}

	await db.prepare('DELETE FROM schedules WHERE id = ?').bind(id).run();
}

export async function getScheduleById(db: D1Database, id: string): Promise<ScheduleSummary> {
	const result = await db.prepare(`${baseSelect} WHERE id = ?`).bind(id).first<ScheduleRow>();

	if (!result) {
		throw new ApiError(404, `Schedule ${id} was not found.`);
	}

	return mapSchedule(result);
}

function validateScheduleInput(input: ScheduleInput, slotDurationMins: number) {
	assertTime(input.startTime, 'startTime');
	assertTime(input.endTime, 'endTime');
	assertDate(input.validFrom, 'validFrom');

	if (input.validUntil) {
		assertDate(input.validUntil, 'validUntil');
		if (input.validFrom > input.validUntil) {
			throw new ApiError(400, 'validUntil must be on or after validFrom.');
		}
	}

	if (parseTimeToMinutes(input.endTime) <= parseTimeToMinutes(input.startTime)) {
		throw new ApiError(400, 'endTime must be later than startTime.');
	}

	if (!Number.isInteger(input.slotIntervalMins) || input.slotIntervalMins <= 0) {
		throw new ApiError(400, 'slotIntervalMins must be a positive integer.');
	}

	if (input.slotIntervalMins < slotDurationMins) {
		throw new ApiError(400, 'slotIntervalMins must be greater than or equal to the product slotDurationMins.');
	}

	if (!Array.isArray(input.daysOfWeek) || input.daysOfWeek.length === 0) {
		throw new ApiError(400, 'daysOfWeek must contain at least one day.');
	}

	const deduped = new Set(input.daysOfWeek);
	if (deduped.size !== input.daysOfWeek.length || input.daysOfWeek.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
		throw new ApiError(400, 'daysOfWeek must be unique integers from 0 to 6.');
	}
}