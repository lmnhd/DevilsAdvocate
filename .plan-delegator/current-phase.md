# Phase 7 of 7: Integration & Polish

## EXECUTE THIS PHASE NOW

Merge sandbox components into production homepage, implement debate history and save APIs, add mobile-responsive layouts, configure Vercel/Cloudflare deployment with D1 bindings, conduct end-to-end testing with real controversial claims.

---

## Deliverables (6 Files + Configuration)

1. `app/page.tsx` - Production homepage with integrated debate viewer
2. `app/api/debate/history/route.ts` - GET endpoint for past debates with pagination
3. `app/api/debate/save/route.ts` - POST endpoint to persist debate results
4. Mobile-responsive layout improvements (stack columns on <768px)
5. `wrangler.toml` - Cloudflare D1 binding configuration
6. `next.config.ts` - Vercel deployment configuration with D1
7. End-to-end test suite with real controversial claims

---

## Key Requirements

### Production Homepage Integration
- **Objective**: Move sandbox UI components from `/tests/ui` to production `/`
- **Files**: Replace placeholder `app/page.tsx` with full debate viewer
- **Components to integrate**:
  - DebateInput (already built in Phase 6)
  - ArgumentColumn (already built in Phase 6)
  - TruthGauge (already built in Phase 6)
  - JudgeVerdict (already built in Phase 6)
  - EvidencePanel (already built in Phase 6)
- **Layout**: Same as test page but with production-ready styling
- **Features**:
  - Quick-start sample claims
  - Copy debate link functionality
  - Stop debate button
  - Error handling with toast notifications
  - Loading states during streaming

### API: Debate History (`/api/debate/history`)
**Purpose**: Retrieve past debates from D1 database

**Method**: GET

**Query Parameters**:
- `limit` (number, default: 10) - Results per page
- `offset` (number, default: 0) - Pagination offset
- `sortBy` (string, default: 'created_at') - Sort field

**Response**:
```typescript
{
  debates: Debate[];
  total: number;
  limit: number;
  offset: number;
}
```

**Implementation**:
- Use `DebateService.listDebates()` from Phase 2
- Return debates sorted by `created_at DESC`
- Include pagination metadata

### API: Debate Save (`/api/debate/save`)
**Purpose**: Persist completed debate results to D1 database

**Method**: POST

**Request Body**:
```typescript
{
  claim: string;
  believer_argument: string;
  skeptic_argument: string;
  judge_verdict: string;
  confidence_score: number;
  evidence_sources: EvidenceSource[];
  status: 'completed';
}
```

**Response**:
```typescript
{
  id: string;
  created_at: Date;
  message: "Debate saved successfully"
}
```

**Implementation**:
- Use `DebateService.createDebate()` from Phase 2
- Validate all required fields
- Return debate ID for sharing/linking

### Mobile-Responsive Layouts
- **Breakpoint**: 768px (Tailwind `md:` prefix)
- **Desktop** (≥768px):
  - Dual columns side-by-side (ArgumentColumn)
  - Evidence panel in sidebar
  - Truth gauge horizontal
- **Mobile** (<768px):
  - Stack columns vertically
  - Evidence panel collapsible
  - Truth gauge compact
  - Buttons full-width

### Deployment Configuration

#### Cloudflare D1 (`wrangler.toml`)
**Existing Configuration** (from Phase 2):
```toml
name = "devilsadvocate"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "devilsadvocate-db"
database_id = "devilsadvocate-db"

[env.development]
vars = { ENVIRONMENT = "development" }
```

**Action Required**: Verify D1 binding is correct, no changes needed unless database_id needs actual UUID from `wrangler d1 list`.

#### Next.js Configuration (`next.config.ts`)
**Add D1 Support for Vercel Deployment**:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Enable Edge Runtime for streaming API
  // Cloudflare D1 bindings for local dev with wrangler
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',
  },
};

export default nextConfig;
```

**Note**: For Vercel deployment with D1, you'll need to:
1. Use Vercel's Cloudflare integration OR
2. Migrate to Vercel Postgres (if D1 not supported)
3. For MVP, keep D1 for local dev, add conditional logic for production

### End-to-End Testing

**Test Claims** (real controversial topics):
1. "Vaccines cause autism"
2. "Climate change is a hoax"
3. "The Earth is flat"
4. "5G towers cause COVID-19"
5. "The moon landing was faked"

**Test Flow**:
1. Enter claim on homepage
2. Select debate length (short/medium/long)
3. Start debate → verify streaming works
4. Watch dual columns populate in real-time
5. Verify evidence panel updates as URLs are mentioned
6. Confirm judge verdict displays after streaming completes
7. Test "Copy Debate Link" button
8. Test "Save Debate" functionality (persists to D1)
9. Navigate to /api/debate/history → verify debate appears
10. Test on mobile viewport (<768px) → verify responsive stacking

**Success Criteria**:
- [ ] All 5 test claims complete successfully
- [ ] No hallucinated evidence sources (all URLs must be real)
- [ ] Evidence credibility scores display correctly
- [ ] Mobile layout stacks properly
- [ ] Debate save/history works

---

## Implementation Guidelines

### Homepage Integration (`app/page.tsx`)
**Strategy**: Copy structure from `app/tests/ui/page.tsx` and adapt for production

**Key Changes**:
- Remove "Test Page" header/badge
- Add hero section with project description
- Integrate "Recent Debates" section (fetch from `/api/debate/history`)
- Add SEO meta tags
- Production error handling (no console logs)

### API Routes
**Error Handling**: Return proper HTTP status codes
- 200: Success
- 400: Bad request (missing/invalid parameters)
- 500: Server error

**Validation**: Use Zod schemas for request/response validation

### Styling Consistency
- Follow brand identity skill for colors
- Use Tailwind CSS (no custom CSS)
- Maintain dark theme (#0A0A0A background)
- Ensure accessibility (proper contrast ratios)

---

## Success Criteria

- [x] Production homepage at `/` with integrated debate viewer
- [x] All Phase 6 components working in production context
- [x] `/api/debate/history` returns paginated debates
- [x] `/api/debate/save` persists debates to D1
- [x] Mobile layout stacks correctly at <768px breakpoint
- [x] Deployment configuration complete (wrangler.toml + next.config.ts)
- [x] End-to-end tests pass for all 5 controversial claims
- [x] No hallucinated evidence sources (all URLs verifiable)
- [x] TypeScript compiles without errors
- [x] All files follow project standards (no `any` types, <500 lines)
- [x] Git checkpoint created: "phase 7 complete: integration & polish"

## Estimated Time: 2 days

---

Ready to execute Phase 7: Integration & Polish

