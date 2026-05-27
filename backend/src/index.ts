import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { ApiError } from './lib/api-error';
import { bookingsRoute } from './routes/bookings';
import { healthRoute } from './routes/health';
import { productsRoute } from './routes/products';
import { schedulesRoute } from './routes/schedules';
import { slotsRoute } from './routes/slots';
import type { AppEnv } from './types';
import { waitlistRoute } from './routes/waitlist';

const app = new Hono<AppEnv>();

app.use('/api/*', cors());

app.route('/api/health', healthRoute);
app.route('/api/products', productsRoute);
app.route('/api', schedulesRoute);
app.route('/api', slotsRoute);
app.route('/api/bookings', bookingsRoute);
app.route('/api/waitlist', waitlistRoute);

app.onError((error, c) => {
	console.error(error);

	if (error instanceof ApiError) {
		return new Response(
			JSON.stringify({
				error: error.message,
				details: error.details,
			}),
			{
				status: error.status,
				headers: {
					'content-type': 'application/json',
				},
			},
		);
	}

	return c.json(
		{
			error: 'Internal server error',
			message: error.message,
		},
		500,
	);
});

app.notFound((c) => {
	return c.json({ error: 'Not Found' }, 404);
});

export default app;
