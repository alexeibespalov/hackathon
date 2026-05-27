import type { ProductSummary, ScheduleInput, ScheduleSummary, SlotGenerationPlan } from '../../types';

type GenerateRequest = {
	productId?: string;
	scheduleId?: string;
	fromDate: string;
	toDate: string;
	replaceExisting?: boolean;
	preview?: boolean;
};

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
	const response = await fetch(input, init);
	const payload: unknown = response.status === 204 ? null : await response.json();

	if (!response.ok) {
		const errorPayload = payload as { error?: string; message?: string };

		throw new Error(errorPayload.error ?? errorPayload.message ?? 'Request failed.');
	}

	return payload as T;
}

export function getProducts() {
	return request<ProductSummary[]>('/api/products');
}

export function getSchedules(productId: string) {
	return request<ScheduleSummary[]>(`/api/products/${productId}/schedules`);
}

export function createSchedule(productId: string, payload: ScheduleInput) {
	return request<ScheduleSummary>(`/api/products/${productId}/schedules`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
}

export function updateSchedule(scheduleId: string, payload: ScheduleInput) {
	return request<ScheduleSummary>(`/api/schedules/${scheduleId}`, {
		method: 'PUT',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
}

export async function deleteSchedule(scheduleId: string) {
	await request<null>(`/api/schedules/${scheduleId}`, {
		method: 'DELETE',
	});
}

export function previewSlots(payload: GenerateRequest) {
	return request<SlotGenerationPlan>('/api/slots/generate', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify({ ...payload, preview: true }),
	});
}

export function generateSlots(payload: GenerateRequest) {
	return request<SlotGenerationPlan>('/api/slots/generate', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify({ ...payload, preview: false }),
	});
}