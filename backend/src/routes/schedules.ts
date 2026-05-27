import { Hono } from 'hono';
import { z } from 'zod';

import { createSchedule, deleteSchedule, listSchedulesByProduct, updateSchedule } from '../services/schedule-service';
import type { AppEnv } from '../types';

export const schedulesRoute = new Hono<AppEnv>();

const scheduleSchema = z.object({
	startTime: z.string().min(1),
	endTime: z.string().min(1),
	daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
	validFrom: z.string().min(1),
	validUntil: z.string().min(1).nullable().optional(),
	slotIntervalMins: z.number().int().positive(),
});

schedulesRoute.get('/products/:productId/schedules', async (c) => {
	return c.json(await listSchedulesByProduct(c.env.DB, c.req.param('productId')));
});

schedulesRoute.post('/products/:productId/schedules', async (c) => {
	const payload = scheduleSchema.parse(await c.req.json());

	return c.json(await createSchedule(c.env.DB, c.req.param('productId'), payload), 201);
});

schedulesRoute.put('/schedules/:id', async (c) => {
	const payload = scheduleSchema.parse(await c.req.json());

	return c.json(await updateSchedule(c.env.DB, c.req.param('id'), payload));
});

schedulesRoute.delete('/schedules/:id', async (c) => {
	await deleteSchedule(c.env.DB, c.req.param('id'));

	return c.body(null, 204);
});