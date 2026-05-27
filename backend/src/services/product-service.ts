import type { D1Database } from '@cloudflare/workers-types';

import { ApiError } from '../lib/api-error';
import { assertTimezone, nowIso } from '../lib/time';
import type { ProductSummary, ProductType } from '../types';

type ProductRow = Omit<ProductSummary, 'isActive'> & { isActive: number };

export type ProductInput = {
	name: string;
	type: ProductType;
	description: string;
	location: string;
	capacity: number;
	slotDurationMins: number;
	timezone: string;
	isActive?: boolean;
};

const baseSelect = `
	SELECT id, name, type, description, location, capacity, slotDurationMins, timezone, isActive, createdAt, updatedAt
	FROM products
`;

function mapProduct(row: ProductRow): ProductSummary {
	return {
		...row,
		isActive: Boolean(row.isActive),
	};
}

export async function listProducts(db: D1Database): Promise<ProductSummary[]> {
	const result = await db.prepare(`${baseSelect} ORDER BY name ASC`).all<ProductRow>();

	return (result.results ?? []).map(mapProduct);
}

export async function getProductById(db: D1Database, id: string): Promise<ProductSummary> {
	const result = await db.prepare(`${baseSelect} WHERE id = ?`).bind(id).first<ProductRow>();

	if (!result) {
		throw new ApiError(404, `Product ${id} was not found.`);
	}

	return mapProduct(result);
}

export async function createProduct(db: D1Database, input: ProductInput): Promise<ProductSummary> {
	validateProductInput(input);

	const id = crypto.randomUUID();
	const timestamp = nowIso();

	await db.prepare(`
		INSERT INTO products (id, name, type, description, location, capacity, slotDurationMins, timezone, isActive, createdAt, updatedAt)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).bind(
		id,
		input.name,
		input.type,
		input.description,
		input.location,
		input.capacity,
		input.slotDurationMins,
		input.timezone,
		input.isActive === false ? 0 : 1,
		timestamp,
		timestamp,
	).run();

	return getProductById(db, id);
}

export async function updateProduct(db: D1Database, id: string, input: ProductInput): Promise<ProductSummary> {
	validateProductInput(input);
	await getProductById(db, id);

	const timestamp = nowIso();

	await db.prepare(`
		UPDATE products
		SET name = ?, type = ?, description = ?, location = ?, capacity = ?, slotDurationMins = ?, timezone = ?, isActive = ?, updatedAt = ?
		WHERE id = ?
	`).bind(
		input.name,
		input.type,
		input.description,
		input.location,
		input.capacity,
		input.slotDurationMins,
		input.timezone,
		input.isActive === false ? 0 : 1,
		timestamp,
		id,
	).run();

	return getProductById(db, id);
}

function validateProductInput(input: ProductInput) {
	if (!input.name.trim()) {
		throw new ApiError(400, 'Product name is required.');
	}

	if (!input.description.trim()) {
		throw new ApiError(400, 'Product description is required.');
	}

	if (!input.location.trim()) {
		throw new ApiError(400, 'Product location is required.');
	}

	if (!Number.isInteger(input.capacity) || input.capacity < 0) {
		throw new ApiError(400, 'capacity must be an integer greater than or equal to 0.');
	}

	if (!Number.isInteger(input.slotDurationMins) || input.slotDurationMins <= 0) {
		throw new ApiError(400, 'slotDurationMins must be a positive integer.');
	}

	assertTimezone(input.timezone);
}