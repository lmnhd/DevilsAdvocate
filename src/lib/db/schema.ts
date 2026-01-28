import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const debates = sqliteTable('debates', {
  id: text('id').primaryKey(),
  claim: text('claim').notNull(),
  believer_argument: text('believer_argument').notNull(),
  skeptic_argument: text('skeptic_argument').notNull(),
  judge_verdict: text('judge_verdict').notNull(),
  confidence_score: integer('confidence_score').notNull(), // 0-100
  evidence_sources: text('evidence_sources').notNull(), // JSON stringified array
  status: text('status').notNull(), // 'pending' | 'in_progress' | 'completed' | 'failed'
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  username: text('username').notNull(),
  preferences: text('preferences'), // JSON stringified object
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const evidence_cache = sqliteTable('evidence_cache', {
  id: text('id').primaryKey(),
  cache_key: text('cache_key').unique().notNull(),
  tool_type: text('tool_type').notNull(), // 'brave_search' | 'fact_check' | 'archive' | 'whois'
  query: text('query').notNull(),
  result_data: text('result_data').notNull(), // JSON stringified MCPResult
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(), // created_at + 7 days
});
