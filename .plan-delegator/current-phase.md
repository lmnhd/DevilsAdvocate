# Phase 2 of 7: Database Layer

## Objective
Create Drizzle ORM schema for D1 database with debates, users, and evidence_cache tables, implement data access services, and build interactive test page for CRUD operations.

---

## Files to Create/Modify

### 1. Drizzle Schema (NEW FILE)
**File**: `src/lib/db/schema.ts`
- Define `debates` table with all columns matching PDR.md
- Define `users` table
- Define `evidence_cache` table with 7-day expiry
- Use Drizzle ORM SQLite dialect for D1 compatibility

### 2. Database Client (NEW FILE)
**File**: `src/lib/db/client.ts`
- Create D1 connection handling
- Export drizzle client instance
- Handle connection errors gracefully

### 3. Data Access Services (NEW FILES)
**Directory**: `src/lib/db/services/`

**File**: `src/lib/db/services/debate-service.ts`
- `createDebate()` - Insert new debate
- `getDebateById()` - Query debate by ID
- `listDebates()` - List all debates with pagination
- `updateDebateScore()` - Update confidence score
- `deleteDebate()` - Delete debate by ID

**File**: `src/lib/db/services/evidence-cache-service.ts`
- `cacheEvidence()` - Store evidence with 7-day TTL
- `getCachedEvidence()` - Retrieve cached evidence by key
- `clearExpiredCache()` - Remove entries older than 7 days

**File**: `src/lib/db/services/user-service.ts`
- `createUser()` - Insert new user
- `getUserById()` - Query user by ID
- `updateUser()` - Update user preferences

### 4. Database Configuration (NEW FILE)
**File**: `drizzle.config.ts`
- Configure Drizzle Kit for D1
- Set schema path
- Configure migrations directory

### 5. Migration Files (NEW DIRECTORY)
**Directory**: `drizzle/`
- Create initial migration for all tables

### 6. Test Page (NEW FILE)
**File**: `app/tests/db/page.tsx`
- Interactive CRUD demo
- Create debate form
- Query debate by ID input
- List all debates table
- Update score slider
- Delete debate button
- Display results and errors

---

## Exact Changes Required

### Step 1: Create Drizzle Schema

#### File: `src/lib/db/schema.ts`
```typescript
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
```

---

### Step 2: Create Database Client

#### File: `src/lib/db/client.ts`
```typescript
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// This will be bound to Cloudflare D1 in production
// For local development, use wrangler dev with --local
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    // In Next.js Edge Runtime, D1 binding will be available via env
    // For now, we'll handle this in the API routes
    throw new Error('Database not initialized. Call initDb(env.DB) first.');
  }
  return dbInstance;
}

export function initDb(d1Database: D1Database) {
  dbInstance = drizzle(d1Database, { schema });
  return dbInstance;
}

export type DbClient = ReturnType<typeof getDb>;
```

---

### Step 3: Create Data Access Services

#### File: `src/lib/db/services/debate-service.ts`
```typescript
import { eq, desc } from 'drizzle-orm';
import type { DbClient } from '../client';
import { debates } from '../schema';
import { nanoid } from 'nanoid';
import type { Debate, DebateStatus } from '@/lib/types/debate';
import type { EvidenceSource } from '@/lib/types/evidence';

export class DebateService {
  constructor(private db: DbClient) {}

  async createDebate(data: {
    claim: string;
    believer_argument: string;
    skeptic_argument: string;
    judge_verdict: string;
    confidence_score: number;
    evidence_sources: EvidenceSource[];
    status: DebateStatus;
  }): Promise<Debate> {
    const id = nanoid();
    const now = new Date();

    await this.db.insert(debates).values({
      id,
      claim: data.claim,
      believer_argument: data.believer_argument,
      skeptic_argument: data.skeptic_argument,
      judge_verdict: data.judge_verdict,
      confidence_score: data.confidence_score,
      evidence_sources: JSON.stringify(data.evidence_sources),
      status: data.status,
      created_at: now,
      updated_at: now,
    });

    return this.getDebateById(id) as Promise<Debate>;
  }

  async getDebateById(id: string): Promise<Debate | null> {
    const result = await this.db.select().from(debates).where(eq(debates.id, id)).limit(1);
    
    if (result.length === 0) return null;

    const row = result[0];
    return {
      ...row,
      evidence_sources: JSON.parse(row.evidence_sources),
      status: row.status as DebateStatus,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  async listDebates(limit: number = 10, offset: number = 0): Promise<Debate[]> {
    const results = await this.db
      .select()
      .from(debates)
      .orderBy(desc(debates.created_at))
      .limit(limit)
      .offset(offset);

    return results.map(row => ({
      ...row,
      evidence_sources: JSON.parse(row.evidence_sources),
      status: row.status as DebateStatus,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }));
  }

  async updateDebateScore(id: string, confidence_score: number): Promise<void> {
    await this.db
      .update(debates)
      .set({ 
        confidence_score,
        updated_at: new Date(),
      })
      .where(eq(debates.id, id));
  }

  async deleteDebate(id: string): Promise<void> {
    await this.db.delete(debates).where(eq(debates.id, id));
  }
}
```

#### File: `src/lib/db/services/evidence-cache-service.ts`
```typescript
import { eq, lt } from 'drizzle-orm';
import type { DbClient } from '../client';
import { evidence_cache } from '../schema';
import { nanoid } from 'nanoid';
import type { MCPResult, MCPToolType } from '@/lib/types/mcp';

export class EvidenceCacheService {
  private CACHE_TTL_DAYS = 7;

  constructor(private db: DbClient) {}

  async cacheEvidence(
    toolType: MCPToolType,
    query: string,
    result: MCPResult
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(toolType, query);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.db.insert(evidence_cache).values({
      id: nanoid(),
      cache_key: cacheKey,
      tool_type: toolType,
      query,
      result_data: JSON.stringify(result),
      created_at: now,
      expires_at: expiresAt,
    });
  }

  async getCachedEvidence(
    toolType: MCPToolType,
    query: string
  ): Promise<MCPResult | null> {
    const cacheKey = this.generateCacheKey(toolType, query);
    const now = new Date();

    const results = await this.db
      .select()
      .from(evidence_cache)
      .where(eq(evidence_cache.cache_key, cacheKey))
      .limit(1);

    if (results.length === 0) return null;

    const cached = results[0];
    
    // Check if expired
    if (new Date(cached.expires_at) < now) {
      await this.db.delete(evidence_cache).where(eq(evidence_cache.id, cached.id));
      return null;
    }

    return JSON.parse(cached.result_data);
  }

  async clearExpiredCache(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(evidence_cache)
      .where(lt(evidence_cache.expires_at, now));
    
    return result.rowsAffected || 0;
  }

  private generateCacheKey(toolType: MCPToolType, query: string): string {
    return `${toolType}:${query.toLowerCase().trim()}`;
  }
}
```

#### File: `src/lib/db/services/user-service.ts`
```typescript
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
```

---

### Step 4: Create Drizzle Configuration

#### File: `drizzle.config.ts`
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.toml',
    dbName: 'devilsadvocate-db',
  },
} satisfies Config;
```

---

### Step 5: Generate Migration

**Command**:
```powershell
npx drizzle-kit generate:sqlite
```

This will create a migration file in `drizzle/` directory with SQL statements to create all tables.

---

### Step 6: Create Test Page

#### File: `app/tests/db/page.tsx`
```typescript
'use client';

import { useState } from 'react';

export default function DatabaseTestPage() {
  const [claim, setClaim] = useState('');
  const [queryId, setQueryId] = useState('');
  const [scoreId, setScoreId] = useState('');
  const [newScore, setNewScore] = useState(50);
  const [deleteId, setDeleteId] = useState('');
  const [result, setResult] = useState<string>('');
  const [debates, setDebates] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateDebate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/db/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim,
          believer_argument: 'Test believer argument supporting the claim.',
          skeptic_argument: 'Test skeptic argument challenging the claim.',
          judge_verdict: 'Test verdict analyzing both sides.',
          confidence_score: 50,
          evidence_sources: [],
          status: 'completed',
        }),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryById = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/db/query?id=${queryId}`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListAll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/db/list');
      const data = await response.json();
      setDebates(data.debates || []);
      setResult(`Found ${data.debates?.length || 0} debates`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/db/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scoreId, confidence_score: newScore }),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/db/delete?id=${deleteId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Database Layer Test</h1>

      {/* Create Debate */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create Debate</h2>
        <input
          type="text"
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="Enter claim..."
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleCreateDebate}
          disabled={loading || !claim}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Create Debate
        </button>
      </div>

      {/* Query by ID */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Query Debate by ID</h2>
        <input
          type="text"
          value={queryId}
          onChange={(e) => setQueryId(e.target.value)}
          placeholder="Enter debate ID..."
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleQueryById}
          disabled={loading || !queryId}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Query
        </button>
      </div>

      {/* List All */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">List All Debates</h2>
        <button
          onClick={handleListAll}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          List All
        </button>
        {debates.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debates.map((debate: any) => (
                  <tr key={debate.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{debate.id}</td>
                    <td className="px-6 py-4 text-sm">{debate.claim}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{debate.confidence_score}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{debate.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Score */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Update Confidence Score</h2>
        <input
          type="text"
          value={scoreId}
          onChange={(e) => setScoreId(e.target.value)}
          placeholder="Enter debate ID..."
          className="w-full p-2 border rounded mb-4"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={newScore}
          onChange={(e) => setNewScore(Number(e.target.value))}
          className="w-full mb-2"
        />
        <p className="mb-4">New Score: {newScore}</p>
        <button
          onClick={handleUpdateScore}
          disabled={loading || !scoreId}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
        >
          Update Score
        </button>
      </div>

      {/* Delete */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Delete Debate</h2>
        <input
          type="text"
          value={deleteId}
          onChange={(e) => setDeleteId(e.target.value)}
          placeholder="Enter debate ID..."
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleDelete}
          disabled={loading || !deleteId}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          Delete
        </button>
      </div>

      {/* Result Display */}
      <div className="p-6 bg-gray-800 text-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Result</h2>
        <pre className="whitespace-pre-wrap break-all">{result || 'No results yet'}</pre>
      </div>
    </div>
  );
}
```

---

### Step 7: Create Test API Routes

**Note**: Test API routes will also need to be created to support the test page:
- `app/api/test/db/create/route.ts` - Handle debate creation
- `app/api/test/db/query/route.ts` - Handle debate query by ID
- `app/api/test/db/list/route.ts` - Handle listing all debates
- `app/api/test/db/update/route.ts` - Handle score updates
- `app/api/test/db/delete/route.ts` - Handle debate deletion

Each route should initialize the D1 database connection and use the appropriate service.

---

## Verification Criteria

- [ ] Drizzle schema created with all 3 tables
- [ ] Database client properly exports drizzle instance
- [ ] 3 data access services created with all CRUD methods
- [ ] drizzle.config.ts configured for D1
- [ ] Migration files generated in `drizzle/` directory
- [ ] Test page renders without errors at `/tests/db`
- [ ] Test API routes handle all CRUD operations
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No `any` types used in services
- [ ] All files under 500 lines

---

## STOP CONDITIONS

⛔ **DO NOT proceed to Phase 3** (Core MCP Tools)
⛔ **DO NOT create** MCP tool wrappers
⛔ **DO NOT implement** rate limiting
⛔ **If blocked**, write "BLOCKED: [reason]" to `.plan-delegator/phase-result.md` and STOP

---

## Output Format

Write results to `.plan-delegator/phase-result.md` with this structure:

```markdown
# Phase 2 Execution Result

## Status
✅ SUCCESS | ❌ FAILED | ⚠️ BLOCKED

## Summary
[Brief description of what was completed]

## Files Created
- src/lib/db/schema.ts
- src/lib/db/client.ts
- src/lib/db/services/debate-service.ts
- src/lib/db/services/evidence-cache-service.ts
- src/lib/db/services/user-service.ts
- drizzle.config.ts
- app/tests/db/page.tsx
- app/api/test/db/create/route.ts
- app/api/test/db/query/route.ts
- app/api/test/db/list/route.ts
- app/api/test/db/update/route.ts
- app/api/test/db/delete/route.ts

## Migration Files
- drizzle/[timestamp]_initial_schema.sql

## Verification
- [x] All CRUD operations tested
- [x] Test page functional at /tests/db
- [x] TypeScript compiles without errors
- [x] Services follow project standards

## Issues
[Any problems encountered]

## Next Steps
Ready for Phase 3: Core MCP Tools
```

---

## Files to Create/Modify

### 1. Package Dependencies
**File**: `package.json`
- Add dependencies: `drizzle-orm`, `drizzle-kit`, `@libsql/client`, `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `zod`

### 2. Type Definitions (NEW FILES)
**Directory**: `src/lib/types/`

**File**: `src/lib/types/debate.ts`
- Define interfaces: `Debate`, `DebateRequest`, `DebateResponse`, `DebateStatus`
- Include fields: id, claim, believer_argument, skeptic_argument, judge_verdict, confidence_score, evidence_sources, created_at

**File**: `src/lib/types/agent.ts`
- Define interfaces: `Agent`, `AgentRole`, `AgentResponse`, `AgentConfig`
- Include role types: `believer`, `skeptic`, `judge`
- Include provider types: `openai`, `anthropic`, `gemini`

**File**: `src/lib/types/evidence.ts`
- Define interfaces: `Evidence`, `EvidenceSource`, `CredibilityScore`
- Include fields: source_url, domain, credibility_score, timestamp, snippet

**File**: `src/lib/types/mcp.ts`
- Define interfaces: `MCPTool`, `MCPResult`, `VerificationTools`
- Include tool types: `brave_search`, `fact_check`, `archive`, `whois`

### 3. AI Provider Rotation Service (NEW FILE)
**File**: `src/lib/utils/ai-provider.ts`
- Implement `AIProviderManager` class
- Fallback chain: OpenAI → Anthropic → Gemini
- Exponential backoff: 1s, 2s, 4s, 8s delays
- 3 retry attempts per provider
- Methods: `executeWithFallback()`, `retryWithBackoff()`, `getNextProvider()`

### 4. Environment Variables
**File**: `.env.local` (VERIFY ONLY - do not create if missing)
- Required keys:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_API_KEY`
  - `BRAVE_SEARCH_API_KEY`
  - `DATABASE_URL` (Cloudflare D1)

### 5. Cloudflare D1 Database
**Command**: Run `npx wrangler d1 create devilsadvocate-db`
- Capture database ID from output
- Document in phase-result.md

---

## Exact Changes Required

### Step 1: Install Dependencies
**Command**:
```powershell
npm install drizzle-orm drizzle-kit @libsql/client openai @anthropic-ai/sdk @google/generative-ai zod
```

**Expected Output**: All packages installed successfully

---

### Step 2: Create Type Definitions

#### File: `src/lib/types/debate.ts`
```typescript
export interface Debate {
  id: string;
  claim: string;
  believer_argument: string;
  skeptic_argument: string;
  judge_verdict: string;
  confidence_score: number; // 0-100
  evidence_sources: EvidenceSource[];
  status: DebateStatus;
  created_at: Date;
  updated_at: Date;
}

export interface DebateRequest {
  claim: string;
  debateLength: 'short' | 'medium' | 'long';
  aiProviders?: {
    believer?: 'openai' | 'anthropic' | 'gemini';
    skeptic?: 'openai' | 'anthropic' | 'gemini';
    judge?: 'openai' | 'anthropic' | 'gemini';
  };
}

export interface DebateResponse {
  debateId: string;
  status: DebateStatus;
  believer_argument: string;
  skeptic_argument: string;
  judge_verdict: string;
  confidence_score: number;
  evidence_sources: EvidenceSource[];
}

export type DebateStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface EvidenceSource {
  url: string;
  domain: string;
  credibility_score: number;
  mentioned_by: 'believer' | 'skeptic' | 'both';
}
```

#### File: `src/lib/types/agent.ts`
```typescript
export type AgentRole = 'believer' | 'skeptic' | 'judge';
export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface Agent {
  role: AgentRole;
  provider: AIProvider;
  temperature: number;
  max_tokens: number;
  max_tool_calls: number;
}

export interface AgentResponse {
  role: AgentRole;
  content: string;
  evidence: Evidence[];
  provider_used: AIProvider;
  tokens_used: number;
}

export interface AgentConfig {
  role: AgentRole;
  provider: AIProvider;
  temperature: number;
  systemPrompt: string;
  tools: string[]; // MCP tool names
}

export interface Evidence {
  source: string;
  snippet: string;
  credibility: number;
  timestamp: Date;
}
```

#### File: `src/lib/types/evidence.ts`
```typescript
export interface Evidence {
  id: string;
  source_url: string;
  domain: string;
  snippet: string;
  credibility_score: number;
  timestamp: Date;
  debate_id: string;
  mentioned_by: 'believer' | 'skeptic' | 'both';
}

export interface EvidenceSource {
  url: string;
  domain: string;
  credibility_score: number;
  title?: string;
  description?: string;
}

export interface CredibilityScore {
  domain: string;
  score: number; // 0-100
  factors: {
    domain_age?: number;
    https_enabled: boolean;
    fact_check_rating?: string;
    backlink_count?: number;
  };
}
```

#### File: `src/lib/types/mcp.ts`
```typescript
export type MCPToolType = 'brave_search' | 'fact_check' | 'archive' | 'whois';

export interface MCPTool {
  name: MCPToolType;
  rateLimit: {
    maxRequests: number;
    period: 'hour' | 'day' | 'month';
  };
  timeout: number; // milliseconds
}

export interface MCPResult {
  tool: MCPToolType;
  success: boolean;
  data?: any;
  error?: string;
  cached: boolean;
  timestamp: Date;
}

export interface VerificationTools {
  braveSearch: (query: string) => Promise<MCPResult>;
  factCheck: (claim: string) => Promise<MCPResult>;
  archiveCheck: (url: string) => Promise<MCPResult>;
  whoisLookup: (domain: string) => Promise<MCPResult>;
}

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  rank: number;
}

export interface FactCheckResult {
  claim: string;
  rating: string;
  publisher: string;
  url: string;
}

export interface ArchiveResult {
  url: string;
  snapshots: Array<{
    timestamp: Date;
    archive_url: string;
  }>;
}

export interface WhoisResult {
  domain: string;
  registrar: string;
  creation_date: Date;
  expiration_date: Date;
  registrant_country?: string;
}
```

---

### Step 3: Implement AI Provider Rotation

#### File: `src/lib/utils/ai-provider.ts`
```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider } from '@/lib/types/agent';

export interface ProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

export class AIProviderManager {
  private providers: ProviderConfig[];
  private currentProviderIndex: number = 0;
  private backoffDelays = [1000, 2000, 4000, 8000]; // milliseconds
  private maxRetriesPerProvider = 3;

  constructor(providerChain: AIProvider[] = ['openai', 'anthropic', 'gemini']) {
    this.providers = providerChain.map(provider => this.getProviderConfig(provider));
  }

  private getProviderConfig(provider: AIProvider): ProviderConfig {
    switch (provider) {
      case 'openai':
        return {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          apiKey: process.env.OPENAI_API_KEY || '',
        };
      case 'anthropic':
        return {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          apiKey: process.env.ANTHROPIC_API_KEY || '',
        };
      case 'gemini':
        return {
          provider: 'gemini',
          model: 'gemini-2.0-flash-exp',
          apiKey: process.env.GOOGLE_API_KEY || '',
        };
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  async executeWithFallback<T>(
    executionFn: (provider: ProviderConfig) => Promise<T>
  ): Promise<{ result: T; provider: AIProvider }> {
    let lastError: Error | null = null;

    for (let providerIndex = 0; providerIndex < this.providers.length; providerIndex++) {
      const provider = this.providers[providerIndex];

      for (let attempt = 0; attempt < this.maxRetriesPerProvider; attempt++) {
        try {
          const result = await this.retryWithBackoff(
            () => executionFn(provider),
            attempt
          );
          return { result, provider: provider.provider };
        } catch (error) {
          lastError = error as Error;
          console.warn(
            `Provider ${provider.provider} attempt ${attempt + 1} failed:`,
            error
          );

          // If it's the last attempt for this provider, move to next provider
          if (attempt === this.maxRetriesPerProvider - 1) {
            console.warn(`Provider ${provider.provider} exhausted. Trying next provider...`);
            break;
          }
        }
      }
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attemptIndex: number
  ): Promise<T> {
    if (attemptIndex > 0) {
      const delay = this.backoffDelays[attemptIndex - 1] || 8000;
      await this.sleep(delay);
    }
    return fn();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getNextProvider(): AIProvider {
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    return this.providers[this.currentProviderIndex].provider;
  }

  getCurrentProvider(): AIProvider {
    return this.providers[this.currentProviderIndex].provider;
  }
}
```

---

### Step 4: Verify Environment Variables
**Action**: Check if `.env.local` exists and contains required keys:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `BRAVE_SEARCH_API_KEY`
- `DATABASE_URL`

**DO NOT create** `.env.local` if missing. Instead, report in phase-result.md that user must create it manually.

---

### Step 5: Create Cloudflare D1 Database
**Command**:
```powershell
npx wrangler d1 create devilsadvocate-db
```

**Expected Output**:
```
✅ Successfully created DB 'devilsadvocate-db'

Add the following to your wrangler.toml:

[[d1_databases]]
binding = "DB"
database_name = "devilsadvocate-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Action**: Capture the `database_id` and report it in phase-result.md

---

## Verification Criteria

- [ ] All dependencies installed without errors
- [ ] 4 type definition files created in `src/lib/types/`
- [ ] `AIProviderManager` class implemented with fallback chain
- [ ] Exponential backoff logic verified (1s, 2s, 4s, 8s delays)
- [ ] `.env.local` verified to contain required API keys (or reported missing)
- [ ] Cloudflare D1 database created successfully
- [ ] Database ID captured for wrangler.toml configuration
- [ ] No TypeScript errors when running `npm run build`

---

## STOP CONDITIONS

⛔ **DO NOT proceed to Phase 2** (Database Layer)
⛔ **DO NOT create** database schema files
⛔ **DO NOT implement** data access services
⛔ **If blocked**, write "BLOCKED: [reason]" to `.plan-delegator/phase-result.md` and STOP

---

## Output Format

Write results to `.plan-delegator/phase-result.md` with this structure:

```markdown
# Phase 1 Execution Result

## Status
✅ SUCCESS | ❌ FAILED | ⚠️ BLOCKED

## Summary
[Brief description of what was completed]

## Files Created
- src/lib/types/debate.ts
- src/lib/types/agent.ts
- src/lib/types/evidence.ts
- src/lib/types/mcp.ts
- src/lib/utils/ai-provider.ts

## Files Modified
- package.json (added dependencies)

## Dependencies Installed
- drizzle-orm
- drizzle-kit
- @libsql/client
- openai
- @anthropic-ai/sdk
- @google/generative-ai
- zod

## D1 Database
- Database Name: devilsadvocate-db
- Database ID: [captured-id]

## Environment Variables
- ✅ OPENAI_API_KEY present
- ✅ ANTHROPIC_API_KEY present
- ✅ GOOGLE_API_KEY present
- ⚠️ BRAVE_SEARCH_API_KEY missing (user must add)

## Verification
- [x] TypeScript compiles without errors
- [x] All type definitions follow PDR.md specifications
- [x] Provider rotation logic implemented
- [x] Exponential backoff tested

## Issues
[Any problems encountered]

## Next Steps
Ready for Phase 2: Database Layer
```
