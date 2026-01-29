# Phase 6 of 7: 2D Debate Viewer UI

## EXECUTE THIS PHASE NOW

Build interactive React components for the debate viewer UI with split-screen layout, real-time streaming support, and evidence panel. Complete user flow from claim input to final verdict.

---

## Deliverables (6 Files)

1. `src/components/DebateViewer/DebateInput.tsx` - Input form with debate length selector
2. `src/components/DebateViewer/ArgumentColumn.tsx` - Scrollable streaming argument display
3. `src/components/DebateViewer/TruthGauge.tsx` - Visual confidence spectrum gauge
4. `src/components/DebateViewer/JudgeVerdict.tsx` - Final verdict panel with risk assessment
5. `src/components/DebateViewer/EvidencePanel.tsx` - Collapsible citation list with badges
6. `app/tests/ui/page.tsx` - Full debate flow test page

---

## Key Requirements

### UI Architecture
- **Dual-Column Layout**: Believer (left) vs Skeptic (right) split-screen
- **Brand Identity**: Follow design tokens from `.github/skills/brand-identity/resources/`
- **Color Coding**: Believer (#0EA5E9), Skeptic (#EF4444), Judge (#8B5CF6)
- **Dark Theme**: Background #0A0A0A, text #FAFAFA
- **Tailwind CSS**: Utility-first styling, no custom CSS files
- **Responsive**: Stack columns vertically on screens <768px
- **Animations**: Framer Motion for gauge transitions and streaming effects


### Component Specifications

#### 1. DebateInput.tsx
**Purpose**: User input form for debate initiation

**Props**:
```typescript
interface DebateInputProps {
  onSubmit: (claim: string, length: 'short' | 'medium' | 'long') => void;
  isLoading: boolean;
}
```

**Features**:
- Textarea input for claim (min 10 chars, max 500 chars)
- Three buttons for debate length: Short (1000 tokens), Medium (2500), Long (5000)
- Character counter displaying remaining characters
- Disabled state while debate is running
- Placeholder: "Enter a claim to debate..."
- Submit button changes label based on debate length selection
- Toast notification on invalid input (too short/long)

**Styling**:
- Input: `bg-background-secondary border-border rounded-lg`
- Button active: `bg-accent text-foreground-primary font-semibold`
- Button inactive: `bg-border text-foreground-muted`

---

#### 2. ArgumentColumn.tsx
**Purpose**: Display streaming arguments with auto-scroll

**Props**:
```typescript
interface ArgumentColumnProps {
  agent: 'believer' | 'skeptic';
  tokens: string[];
  isStreaming: boolean;
}
```

**Features**:
- Left column border: 4px solid (believer: #0EA5E9, skeptic: #EF4444)
- Header with agent name and icon (colored badge)
- Scrollable content area that auto-scrolls as new tokens arrive
- Loading spinner while streaming
- "Streaming complete" message when done
- Glow effect while streaming: `shadow-[0_0_20px_rgba(...)]`
- Line wrapping at container width
- Smooth text transitions using Framer Motion opacity

**Typography**:
- Agent name: bold, colored text (`text-believer` or `text-skeptic`)
- Arguments: body text, line height 1.5

---

#### 3. TruthGauge.tsx
**Purpose**: Visual confidence spectrum gauge

**Props**:
```typescript
interface TruthGaugeProps {
  confidence: number; // 0-100
  isAnimating: boolean;
}
```

**Features**:
- Horizontal gauge from 0 (far left, red) to 100 (far right, green)
- Animated needle using Framer Motion: `rotate: confidence * 1.8`
- Transition: `duration: 0.5, ease: "easeInOut"`
- Color scale:
  - 0-33: Red (#EF4444) - "False"
  - 34-66: Amber (#FBBF24) - "Contested"
  - 67-100: Green (#10B981) - "True"
- Display confidence percentage below gauge
- Center text shows verdict category
- Width: 200px, height: 80px

---

#### 4. JudgeVerdict.tsx
**Purpose**: Final verdict panel with assessment

**Props**:
```typescript
interface JudgeVerdictProps {
  verdict: string;
  confidence: number;
  riskAssessment: 'low' | 'medium' | 'high';
}
```

**Features**:
- Header: "JUDGE VERDICT" in judge color (#8B5CF6)
- Three-part layout:
  1. Verdict statement (italics, large font)
  2. Confidence gauge (see TruthGauge component)
  3. Risk assessment badge (colored by risk level)
- Risk badge colors:
  - Low: Green (#10B981)
  - Medium: Amber (#FBBF24)
  - High: Red (#EF4444)
- Background: `bg-background-secondary border-l-4 border-judge`
- Padding: 16px, rounded corners
- Display verdict only after judge completes (not during streaming)

---

#### 5. EvidencePanel.tsx
**Purpose**: Collapsible citation list with credibility

**Props**:
```typescript
interface EvidencePanelProps {
  evidence: TrackedEvidence[];
}
```

**Features**:
- Collapsible section with toggle button
- Header: "EVIDENCE SOURCES" with count badge
- Sorted by credibility score descending
- Each evidence item shows:
  - Domain name with favicon (if available)
  - Credibility score with color-coded badge:
    - 🟢 (>70): `bg-success`
    - 🟡 (40-70): `bg-accent`
    - 🔴 (<40): `bg-destructive`
  - Role mentioned: "Believer" / "Skeptic" / "Both"
  - Clickable URL that opens in new tab
  - Snippet preview (truncated to 2 lines)
- Max height when expanded: 300px with scroll
- Empty state: "No evidence tracked during debate"

**URL Styling**:
```
domain.com
├─ Credibility: 85 🟢 (believer)
├─ "This study shows..."
└─ [Visit Source]
```

---

#### 6. app/tests/ui/page.tsx
**Purpose**: Complete debate flow demonstration

**Features**:
- Import all 5 components above
- Layout: Input section → Dual columns → Gauge → Verdict → Evidence
- Debate length selector visible and functional
- Sample claims available (1-click debate):
  - "Climate change is primarily caused by human activity"
  - "Artificial Intelligence will replace human workers"
  - "Social media is harmful to mental health"
- Real `/api/debate/stream` endpoint integration:
  - Use `EventSource` API to connect
  - Parse all SSE events (believer_token, skeptic_token, evidence, verdict)
  - Append tokens to respective columns
  - Update evidence panel in real-time
  - Display final verdict when judge_complete arrives
- "Copy Debate Link" button (generates shareable URL)
- "Stop Debate" button to cancel streaming
- Loading skeleton while waiting for first token
- Error handling with toast notifications
- Responsive grid: `grid grid-cols-2 gap-4` on desktop, `grid-cols-1` on mobile

---

## Implementation Guidelines

### Styling (Tailwind CSS)
- NEVER create custom CSS files
- Use design tokens from brand identity:
  - Colors: `text-believer`, `bg-skeptic`, `border-judge`
  - Spacing: Use multiples of 4px (p-4, gap-4, etc.)
  - Shadows: `shadow-[0_0_20px_rgba(14,165,233,0.5)]` for glows
- Dark background: `bg-background` = #0A0A0A
- Text: `text-foreground` = #FAFAFA

### Animation (Framer Motion)
- Auto-scroll: Use `useEffect` to scroll to bottom on new tokens
- Gauge rotation: `animate={{ rotate: confidence * 1.8 }}`
- Opacity fade: `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}`
- Duration: 300ms for token transitions, 500ms for gauge

### TypeScript
- All components must have explicit TypeScript props interfaces
- Import `TrackedEvidence` from `src/lib/evidence/tracker.ts`
- Use `'use client'` directive (client component)
- No `any` types

### Mobile Responsiveness
- Breakpoint 768px: Stack columns vertically
- Reduce font sizes on mobile by 10%
- Debate input full width on mobile
- Evidence panel collapses by default on mobile

---

## Success Criteria

- ✅ All 6 files created
- ✅ All files under 500 lines
- ✅ TypeScript compiles without errors
- ✅ No `any` types used
- ✅ All components export properly from barrel export
- ✅ Test page integrates with `/api/debate/stream` successfully
- ✅ Real-time token streaming displays correctly
- ✅ Evidence panel updates as URLs are extracted
- ✅ Judge verdict displays after streaming completes
- ✅ Mobile layout stacks correctly at <768px
- ✅ Auto-scroll works for argument columns
- ✅ Framer Motion animations execute smoothly
- ✅ No custom CSS files created
- ✅ All brand identity colors applied correctly

## Estimated Time: 3 days

---

Ready to execute Phase 6: 2D Debate Viewer UI

