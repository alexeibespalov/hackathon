import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { bookingsRoute } from './routes/bookings';
import { healthRoute } from './routes/health';
import { productsRoute } from './routes/products';
import { schedulesRoute } from './routes/schedules';
import { slotsRoute } from './routes/slots';
import type { AppEnv } from './types';
import { waitlistRoute } from './routes/waitlist';

const app = new Hono<AppEnv>();
const api = new Hono<AppEnv>();

api.use('*', cors());

api.route('/health', healthRoute);
api.route('/products', productsRoute);
api.route('/products', schedulesRoute);
api.route('/slots', slotsRoute);
api.route('/bookings', bookingsRoute);
api.route('/waitlist', waitlistRoute);

app.route('/api', api);

app.onError((error, c) => {
	console.error(error);

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
