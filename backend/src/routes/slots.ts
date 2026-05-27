import { Hono } from 'hono';
import { z } from 'zod';

import { generateSlots, getSlotById, listSlotsByProductDate, planSlotGeneration } from '../services/slot-service';
import type { AppEnv } from '../types';

export const slotsRoute = new Hono<AppEnv>();

const generateSchema = z.object({
	productId: z.string().min(1).optional(),
	scheduleId: z.string().min(1).optional(),
	fromDate: z.string().min(1),
	toDate: z.string().min(1),
	replaceExisting: z.boolean().optional(),
	preview: z.boolean().optional(),
});

slotsRoute.get('/products/:productId/slots', async (c) => {
	const date = c.req.query('date');

	if (!date) {
		return c.json({ error: 'date query parameter is required.' }, 400);
	}

	return c.json(await listSlotsByProductDate(c.env.DB, c.req.param('productId'), date));
});

slotsRoute.get('/slots/:id', async (c) => {
	return c.json(await getSlotById(c.env.DB, c.req.param('id')));
});

slotsRoute.post('/slots/generate', async (c) => {
	const payload = generateSchema.parse(await c.req.json());

	if (payload.preview) {
		const { plan } = await planSlotGeneration(c.env.DB, payload);

		return c.json(plan);
	}

	return c.json(await generateSlots(c.env.DB, payload), 201);
});