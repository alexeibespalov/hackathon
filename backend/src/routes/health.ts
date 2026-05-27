import { Hono } from 'hono';

import type { AppEnv } from '../types';

export const healthRoute = new Hono<AppEnv>();

healthRoute.get('/', (c) => {
	return c.json({
		service: 'airport-booking-backend',
		status: 'ok',
		timestamp: new Date().toISOString(),
	});
});