import { Hono } from 'hono';

import type { ApiPlaceholderResponse, AppEnv } from '../types';

const pending = (message: string): ApiPlaceholderResponse => ({
	message,
	status: 'pending',
});

export const schedulesRoute = new Hono<AppEnv>();

schedulesRoute.get('/products/:productId/schedules', (c) => {
	return c.json([]);
});

schedulesRoute.post('/products/:productId/schedules', (c) => {
	return c.json(pending(`Schedule creation for product ${c.req.param('productId')} is part of CAP-12.`), 501);
});

schedulesRoute.put('/schedules/:id', (c) => {
	return c.json(pending(`Schedule update for ${c.req.param('id')} is part of CAP-12.`), 501);
});

schedulesRoute.delete('/schedules/:id', (c) => {
	return c.json(pending(`Schedule deletion for ${c.req.param('id')} is part of CAP-12.`), 501);
});