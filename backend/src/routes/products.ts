import { Hono } from 'hono';
import { z } from 'zod';

import { createProduct, getProductById, listProducts, updateProduct } from '../services/product-service';
import type { AppEnv } from '../types';

export const productsRoute = new Hono<AppEnv>();

const productSchema = z.object({
	name: z.string().min(1),
	type: z.enum(['PARKING', 'FAST_TRACK', 'LOUNGE']),
	description: z.string().min(1),
	location: z.string().min(1),
	capacity: z.number().int().nonnegative(),
	slotDurationMins: z.number().int().positive(),
	timezone: z.string().min(1),
	isActive: z.boolean().optional(),
});

productsRoute.get('/', async (c) => {
	return c.json(await listProducts(c.env.DB));
});

productsRoute.get('/:id', async (c) => {
	return c.json(await getProductById(c.env.DB, c.req.param('id')));
});

productsRoute.post('/', async (c) => {
	const payload = productSchema.parse(await c.req.json());

	return c.json(await createProduct(c.env.DB, payload), 201);
});

productsRoute.put('/:id', async (c) => {
	const payload = productSchema.parse(await c.req.json());

	return c.json(await updateProduct(c.env.DB, c.req.param('id'), payload));
});