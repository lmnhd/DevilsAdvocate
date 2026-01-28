# Preferred Tech Stack & Implementation Rules

When generating code or UI components for **Devil's Advocate**, you **MUST** strictly adhere to the following technology choices.

## Core Stack
* **Framework:** Next.js 15 (App Router) with TypeScript
* **Styling Engine:** Tailwind CSS v4 (Mandatory. Do not use plain CSS or styled-components unless explicitly asked.)
* **Component Library:** shadcn/ui (Use these primitives as the base for all new components.)
* **Icons:** Lucide React
* **Animations:** Framer Motion (for debate transitions and gauge animations)
* **Streaming:** Server-Sent Events (SSE) via Next.js Route Handlers

## Implementation Guidelines

### 1. Tailwind Usage
* Use utility classes directly in JSX.
* Utilize the color tokens defined in `design-tokens.json` via Tailwind config.
* **Color Naming Convention:**
  - `bg-believer` / `text-believer` / `border-believer` for Believer agent
  - `bg-skeptic` / `text-skeptic` / `border-skeptic` for Skeptic agent
  - `bg-judge` / `text-judge` / `border-judge` for Judge agent
* **Dark Mode:** This brand is DARK-FIRST. Default to dark backgrounds (`bg-background` = near-black).

### 2. Component Patterns

#### Debate Layout
* **ALWAYS** use a two-column grid for Believer vs. Skeptic:
```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="border-l-4 border-believer">
    {/* Believer content */}
  </div>
  <div className="border-l-4 border-skeptic">
    {/* Skeptic content */}
  </div>
</div>
```

#### Buttons
* Primary CTAs: Use `bg-accent` (amber) for high-contrast against dark background
* Believer actions: Use `bg-believer`
* Skeptic actions: Use `bg-skeptic`
* Destructive actions: Use `bg-destructive`

#### Forms
* Labels must be placed **above** input fields
* Use dark-themed inputs: `bg-background-secondary` with `border-border`
* Placeholder text should be `text-foreground-muted`

#### Typography
* Headings: Use `font-bold` and `text-foreground`
* Body text: Use `text-foreground-secondary`
* Agent names: Use colored text (`text-believer`, `text-skeptic`, `text-judge`)
* Code blocks: Use `font-mono` and `bg-muted`

### 3. Animation Patterns

#### Gauge Animation (Truth Confidence)
Use Framer Motion to animate the gauge needle:
```tsx
<motion.div
  animate={{ rotate: confidenceScore * 1.8 }}
  transition={{ duration: 0.5, ease: "easeInOut" }}
/>
```

#### Streaming Text
Text should "type in" character by character:
```tsx
<motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {streamedText}
</motion.p>
```

#### Glow Effects
Apply glow to active agent columns:
```tsx
className="shadow-[0_0_20px_rgba(14,165,233,0.5)]" // Believer glow
className="shadow-[0_0_20px_rgba(239,68,68,0.5)]" // Skeptic glow
```

### 4. API Structure

#### Streaming API Route Pattern
```typescript
// app/api/debate/stream/route.ts
export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Stream believer arguments
      controller.enqueue(encoder.encode(`event: believer_token\ndata: ${text}\n\n`));
      
      // Stream skeptic arguments
      controller.enqueue(encoder.encode(`event: skeptic_token\ndata: ${text}\n\n`));
      
      // Stream final verdict
      controller.enqueue(encoder.encode(`event: judge_complete\ndata: ${verdict}\n\n`));
      
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 5. Forbidden Patterns
* ❌ Do NOT use single-column layouts for debate content
* ❌ Do NOT use light backgrounds (this is a dark-first brand)
* ❌ Do NOT mix Believer and Skeptic colors in the same component
* ❌ Do NOT use generic button colors - always use semantic agent colors
* ❌ Do NOT create new CSS files; keep styles in Tailwind utilities
* ❌ Do NOT use Bootstrap or Material UI

### 6. File Structure
```
src/
├── components/
│   ├── debate/
│   │   ├── DebateViewer.tsx        # Main split-screen component
│   │   ├── BelieverColumn.tsx      # Left column (blue theme)
│   │   ├── SkepticColumn.tsx       # Right column (red theme)
│   │   └── TruthGauge.tsx          # Center gauge visualization
│   ├── ui/                         # shadcn/ui components
│   └── layout/
├── lib/
│   ├── agents/
│   │   ├── believer.ts
│   │   ├── skeptic.ts
│   │   └── judge.ts
│   ├── prompts/
│   └── types/
└── app/
    ├── api/
    │   └── debate/
    │       └── stream/
    └── (pages)/
```

### 7. Accessibility Requirements
* Maintain WCAG AA contrast ratios (dark bg + near-white text = 15:1 ratio ✅)
* Use `aria-label` for agent columns: "Believer's argument" / "Skeptic's argument"
* Ensure gauge animation respects `prefers-reduced-motion`
* Provide keyboard navigation for debate history

### 8. Performance Targets
* First Contentful Paint: < 1.5s
* Time to Interactive: < 3s
* Streaming latency: < 200ms per token
* Lighthouse Performance: > 90

## Required Dependencies
Add these to `package.json`:
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "latest",
    "tailwindcss": "^4.0.0",
    "@vercel/ai": "latest"
  }
}
```
