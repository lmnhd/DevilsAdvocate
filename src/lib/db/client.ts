import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Type for D1 Database binding
type D1Database = any;

interface CloudflareEnv {
  DB: D1Database;
}

// Singleton instance
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDb(env.DB) first.');
  }
  return dbInstance;
}

export function initDb(d1Database: D1Database) {
  dbInstance = drizzle(d1Database, { schema });
  return dbInstance;
}

export type DbClient = ReturnType<typeof getDb>;
