import { Hono } from 'hono';

import type { ApiPlaceholderResponse, AppEnv } from '../types';

const pending = (message: string): ApiPlaceholderResponse => ({
	message,
	status: 'pending',
});

export const slotsRoute = new Hono<AppEnv>();

slotsRoute.get('/products/:productId/slots', (c) => {
	return c.json([]);
});

slotsRoute.get('/slots/:id', (c) => {
	return c.json(
		{
			error: 'Not Found',
			message: `Slot ${c.req.param('id')} has not been generated yet.`,
		},
		404,
	);
});

slotsRoute.post('/slots/generate', (c) => {
	return c.json(pending('Slot generation is part of CAP-13.'), 501);
});