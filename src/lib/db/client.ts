import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleLibSQL } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Singleton instance
let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return dbInstance;
}

/**
 * Initialize database client
 * For Vercel: Uses libsql with D1_TOKEN and D1_URL env vars
 * For Cloudflare: Uses D1 binding directly
 * For local dev: Uses local SQLite file
 */
export function initDb(d1DatabaseBinding?: any) {
  if (dbInstance) {
    return dbInstance;
  }

  // Priority 1: Cloudflare D1 binding (wrangler dev / Cloudflare Pages)
  if (d1DatabaseBinding) {
    dbInstance = drizzleD1(d1DatabaseBinding, { schema });
    return dbInstance;
  }

  // Priority 2: Vercel with libsql (D1 HTTP API)
  const d1Token = process.env.D1_TOKEN;
  const d1Url = process.env.D1_URL;
  
  if (d1Token && d1Url) {
    const client = createClient({
      url: d1Url,
      authToken: d1Token,
    });
    dbInstance = drizzleLibSQL(client, { schema });
    return dbInstance;
  }

  // Priority 3: Local development with SQLite file
  const client = createClient({
    url: 'file:./dev.db',
  });
  dbInstance = drizzleLibSQL(client, { schema });
  return dbInstance;
}

export type DbClient = ReturnType<typeof getDb>;
