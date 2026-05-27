import { ApiError } from './api-error';

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function assertTimezone(timezone: string) {
	try {
		Intl.DateTimeFormat('en-GB', { timeZone: timezone }).format(new Date());
	} catch {
		throw new ApiError(400, `Invalid timezone: ${timezone}`);
	}
}

export function assertDate(date: string, fieldName: string) {
	if (!datePattern.test(date)) {
		throw new ApiError(400, `${fieldName} must use YYYY-MM-DD format.`);
	}
}

export function assertTime(time: string, fieldName: string) {
	if (!timePattern.test(time)) {
		throw new ApiError(400, `${fieldName} must use HH:MM format.`);
	}
}

export function parseTimeToMinutes(time: string): number {
	assertTime(time, 'time');
	const [hours, minutes] = time.split(':').map(Number);

	return (hours * 60) + minutes;
}

export function minutesToTime(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function generateDateRange(fromDate: string, toDate: string): string[] {
	assertDate(fromDate, 'fromDate');
	assertDate(toDate, 'toDate');

	if (fromDate > toDate) {
		throw new ApiError(400, 'fromDate must be on or before toDate.');
	}

	const dates: string[] = [];
	const current = new Date(`${fromDate}T12:00:00Z`);
	const end = new Date(`${toDate}T12:00:00Z`);

	while (current <= end) {
		dates.push(current.toISOString().slice(0, 10));
		current.setUTCDate(current.getUTCDate() + 1);
	}

	return dates;
}

export function getDayOfWeek(date: string): number {
	assertDate(date, 'date');

	return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function nowIso(): string {
	return new Date().toISOString();
}