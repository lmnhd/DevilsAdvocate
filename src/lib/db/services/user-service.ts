import { eq } from 'drizzle-orm';
import type { DbClient } from '../client';
import { users } from '../schema';
import { nanoid } from 'nanoid';

export interface User {
  id: string;
  email: string | null;
  username: string;
  preferences: Record<string, unknown> | null;
  created_at: Date;
}

export class UserService {
  constructor(private db: DbClient) {}

  async createUser(data: {
    email?: string;
    username: string;
    preferences?: Record<string, unknown>;
  }): Promise<User> {
    const id = nanoid();
    const now = new Date();

    await this.db.insert(users).values({
      id,
      email: data.email || null,
      username: data.username,
      preferences: data.preferences ? JSON.stringify(data.preferences) : null,
      created_at: now,
    });

    return this.getUserById(id) as Promise<User>;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      ...row,
      preferences: row.preferences ? JSON.parse(row.preferences) : null,
      created_at: new Date(row.created_at),
    };
  }

  async updateUser(
    id: string,
    data: { username?: string; preferences?: Record<string, unknown> }
  ): Promise<void> {
    const updates: Record<string, string | null> = {};

    if (data.username) updates.username = data.username;
    if (data.preferences) updates.preferences = JSON.stringify(data.preferences);

    await this.db.update(users).set(updates).where(eq(users.id, id));
  }
}
