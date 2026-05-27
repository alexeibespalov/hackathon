export type DatabaseEnv = {
	DB: D1Database;
};

export const getDb = (env: DatabaseEnv): D1Database => env.DB;