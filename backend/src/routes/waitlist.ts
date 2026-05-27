import { Hono } from 'hono';

import type { ApiPlaceholderResponse, AppEnv } from '../types';

const pending = (message: string): ApiPlaceholderResponse => ({
	message,
	status: 'pending',
});

export const waitlistRoute = new Hono<AppEnv>();

waitlistRoute.get('/', (c) => {
	return c.json([]);
});

waitlistRoute.post('/', (c) => {
	return c.json(pending('Waitlist join is part of CAP-17.'), 501);
});

waitlistRoute.delete('/:id', (c) => {
	return c.json(pending(`Waitlist removal for ${c.req.param('id')} is part of CAP-17.`), 501);
});

waitlistRoute.post('/:id/promote', (c) => {
	return c.json(pending(`Waitlist promotion for ${c.req.param('id')} is part of CAP-18.`), 501);
});