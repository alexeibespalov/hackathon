import { Hono } from 'hono';

import type { AppEnv, ProductSummary } from '../types';

export const productsRoute = new Hono<AppEnv>();

productsRoute.get('/', (c) => {
	const products: ProductSummary[] = [];

	return c.json(products);
});

productsRoute.get('/:id', (c) => {
	return c.json(
		{
			error: 'Not Found',
			message: `Product ${c.req.param('id')} has not been created yet.`,
		},
		404,
	);
});

productsRoute.post('/', (c) => {
	return c.json(
		{
			message: 'Product creation is part of CAP-12.',
			status: 'pending',
		},
		501,
	);
});

productsRoute.put('/:id', (c) => {
	return c.json(
		{
			message: `Product update for ${c.req.param('id')} is part of CAP-12.`,
			status: 'pending',
		},
		501,
	);
});