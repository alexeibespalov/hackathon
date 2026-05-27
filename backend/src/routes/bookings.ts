import { Hono } from 'hono';

import type { ApiPlaceholderResponse, AppEnv } from '../types';

const pending = (message: string): ApiPlaceholderResponse => ({
	message,
	status: 'pending',
});

export const bookingsRoute = new Hono<AppEnv>();

bookingsRoute.get('/', (c) => {
	return c.json([]);
});

bookingsRoute.get('/reference/:ref', (c) => {
	return c.json(
		{
			error: 'Not Found',
			message: `Booking ${c.req.param('ref')} was not found.`,
		},
		404,
	);
});

bookingsRoute.post('/', (c) => {
	return c.json(pending('Booking creation is part of CAP-15.'), 501);
});

bookingsRoute.post('/:id/cancel', (c) => {
	return c.json(pending(`Booking cancellation for ${c.req.param('id')} is part of CAP-16.`), 501);
});

bookingsRoute.post('/:id/reschedule', (c) => {
	return c.json(pending(`Booking reschedule for ${c.req.param('id')} is part of CAP-16.`), 501);
});