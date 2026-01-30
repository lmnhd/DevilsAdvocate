# Devil's Advocate - Design Style Guide

## Component Library Standard

**ENFORCE**: All UI components **MUST** come from the **ShadCN component library**. No custom implementations. No exceptions.

- Use ShadCN Card, Button, Input, Select, Badge, Separator, Tabs, etc.
- Style ShadCN components using Tailwind classes
- Do not create custom component variants unless ShadCN doesn't provide the base
- Keep styling consistent by applying the same Tailwind patterns across all ShadCN usage

## Horizontal Layout Enforcement

**CRITICAL RULE**: Never allow a single component to stretch full-width across a page container.

- **Minimum Requirement**: Every vertical section must contain **at least 2 components side-by-side**
- **No Exception**: A lone button, textarea, dropdown, or card occupying the entire horizontal space is **prohibited**
- **Philosophy**: Horizontal space is precious; use it efficiently by grouping related elements together
- **Implementation**: Use `flex` with `gap-6`, `grid-cols-2+`, or similar patterns to create multi-element rows
- **More is Better**: 3-column layouts (Believer | Skeptic | Judge) or 4-column grids are preferred over 2-column when content allows

**Example - WRONG:**
```tsx
// ❌ Single full-width button - PROHIBITED
<button className="w-full">Start Debate</button>
```

**Example - CORRECT:**
```tsx
// ✅ Two equal-width boxes side-by-side
<div className="flex gap-6">
  <Card className="flex-1">Start Button</Card>
  <Card className="flex-1">Model Selection</Card>
</div>
```

---

## Design Philosophy

**Maximize horizontal real estate with bold, blocky containers** - The design prioritizes sleek, minimalistic aesthetics with vibrant yet sophisticated color nuances. Every element serves the principle of elegant efficiency: maximum visual impact with minimal complexity.

---

## Color System

### Brand Agent Colors (Vibrant Yet Refined)
- **Believer**: `#0EA5E9` - Bright, trustworthy blue
- **Skeptic**: `#EF4444` - Bold, challenging red  
- **Judge**: `#8B5CF6` - Measured, neutral purple

These three colors are the visual anchors for agent personalities and must always be used consistently in labels, accents, and indicators.

### Background & Surface Palette (Dark, Sophisticated)
- **Primary Background**: `#0A0A0A` - Deep black, almost void-like
- **Secondary Surface**: `#171717` - Slightly elevated, card containers
- **Tertiary Surface**: `#262626` - Interactive hover states, nested containers
- **Border Accent**: `#404040` - Subtle but defined card edges

**Design Intent**: The dark palette creates dramatic contrast with vibrant text and accent colors, reducing visual fatigue while making interactive elements pop.

### Text & Foreground
- **Primary Text**: `#FAFAFA` - Off-white, clean and readable
- **Muted Text**: `#A3A3A3` - Secondary information, helper text, hints
- **Accent Highlight**: `#FBBF24` - Gold/amber, primary action button color

---

## Spacing & Sizing System

### Container Padding
- **Standard Card Padding**: `p-6` (1.5rem) for main content areas
- **Compact Card Padding**: `p-5` (1.25rem) for nested or secondary panels
- **Minimal Padding**: `p-4` (1rem) for utility areas

### Gap Between Elements
- **Generous Gap**: `gap-4` (1rem) for major section separations
- **Tight Gap**: `gap-3` (0.75rem) for grouped controls or compact layouts
- **Minimal Gap**: `gap-2` (0.5rem) for tightly related elements like labels and icons

### Typography Scale

#### Headlines
- **Page Title**: `text-6xl` (3.75rem) - Bold, commanding presence
- **Section Header**: `text-lg` (1.125rem) - Clear hierarchy, `font-semibold`
- **Subsection**: `text-sm` (0.875rem) - Supporting headers, uppercase for emphasis

#### Body Text
- **Standard**: `text-sm` (0.875rem) - Primary reading content
- **Secondary/Helper**: `text-xs` (0.75rem) - Hints, labels, muted information
- **Compact Labels**: `text-xs` with `uppercase tracking-tight` - Sleek, condensed appearance

#### Interactive Elements
- **Button Text**: `text-lg` (1.125rem) - Prominent action buttons
- **Action Button Helper**: `text-xs` (0.75rem) - Secondary action guidance

---

## Layout Patterns

### Horizontal Space Utilization

**Full-Width Container**
- Maximum width: `max-w-6xl` for standard content areas
- Creates spacious, breathing layouts that leverage wide screens

**Compact Control Containers** 
- Maximum width: `max-w-2xl` (30% reduction) for consolidated input areas
- Centers and condenses secondary panels while maintaining prominence

**Card Grid Layouts**
- **Three-Column Layout**: `grid-cols-3` - Standard for debates, controls, examples
- **Two-Column Layout**: `flex gap-6` with `flex-1` - Action button + controls side-by-side
- **Mobile Responsive**: Collapses to single column below `md:` breakpoint

### Card Structure Aesthetic

All major content sections use **blocky, contained Card components**:
- Dark background (`bg-[#171717]`)
- Subtle border (`border-[#404040]`)
- Clear visual separation with rounded corners
- Internal padding creates breathing room

**Two-Box Pattern** (Signature Layout):
- Two equal-width cards side-by-side with `gap-6` spacing
- Left box: Large, prominent action button (`px-8 py-8`)
- Right box: Compact control panel (`p-5`)
- Creates visual balance and clear hierarchy

### Button & Interactive Styling

**Large Action Buttons**
- Prominent size with generous padding (`px-8 py-8`)
- Centered flex layout with icon + text + helper
- Smooth hover transitions with subtle background shift
- Disabled state with reduced opacity
- Text hierarchy: Icon (large) → Label → Helper text (small)

**Compact Control Selectors**
- Minimal padding: `px-2.5 py-1.5`
- Small text: `text-xs`
- Tight icon-label spacing: `gap-1.5`
- Responsive focus rings matching agent colors
- Seamless disabled state

---

## Component Aesthetics

### Model Selection Interface
Minimal, sleek dropdowns arranged in vertical or grid layout:
- **Label Styling**: Color-coded per agent with icon prefix
  - Believer: `text-[#0EA5E9]` with ✓ icon
  - Skeptic: `text-[#EF4444]` with ✗ icon
  - Judge: `text-[#8B5CF6]` with ⚖️ icon
- **Text Case**: `uppercase tracking-tight` for compact, modern feel
- **Descriptions**: Removed in compact modes to reduce visual clutter

### Quick Start Example Buttons
**Signature Aesthetic**: Colorful square cards in a 3×3 grid

- **Dimensions**: Roughly square cards (consistent height/width ratio)
- **Color Palette** (Vibrant Pastels):
  - Pink: `bg-pink-200 hover:bg-pink-300 text-pink-900`
  - Indigo: `bg-indigo-200 hover:bg-indigo-300 text-indigo-900`
  - Yellow: `bg-yellow-200 hover:bg-yellow-300 text-yellow-900`
  - Teal: `bg-teal-200 hover:bg-teal-300 text-teal-900`
  - Rose: `bg-rose-200 hover:bg-rose-300 text-rose-900`
  - Purple: `bg-purple-200 hover:bg-purple-300 text-purple-900`
  - Emerald: `bg-emerald-200 hover:bg-emerald-300 text-emerald-900`
  - Sky: `bg-sky-200 hover:bg-sky-300 text-sky-900`
  - Amber: `bg-amber-200 hover:bg-amber-300 text-amber-900`

- **Interior Layout**: 
  - Large emoji at top (visual anchor)
  - Claim text below (wrapped, readable)
  - Centered alignment
  - Smooth hover scale and shadow effects

### Visual Hierarchy

1. **Emphasis**: Vibrant brand colors (`#0EA5E9`, `#EF4444`, `#8B5CF6`) draw eye immediately
2. **Accents**: Gold button (`#FBBF24`) stands out as primary action
3. **Background**: Dark palette (`#0A0A0A`, `#171717`) creates dramatic contrast
4. **Text**: Off-white (`#FAFAFA`) is primary, muted gray (`#A3A3A3`) is secondary
5. **Borders**: Subtle dark gray (`#404040`) defines containers without dominating

---

## Typography Standards

- **Font Weight**: Semibold for headers, regular for body
- **Letter Spacing**: `tracking-tight` for compact, modern labels; default for body text
- **Text Transform**: `uppercase` for section headers and control labels to convey authority
- **Critical Rule**: Never apply base text sizing to containers; let nested elements control their own text

---

## Spacing & Rhythm

- **Vertical Breathing**: `mb-10` (2.5rem) between major sections
- **Horizontal Spacing**: `gap-4` for column separations, `gap-3` for control clusters
- **Padding Consistency**: Cards use `p-6` standard, compact areas use `p-5`
- **Margin Patterns**: Top margins on headers (`mb-4`), bottom margins on sections (`mb-10`)

---

## Empty States & Special Areas

- **Empty State Card**: Minimal content with centered text, subtle background
- **Quick Start Section**: Always visible, positioned at bottom after all content
- **Scrollable Areas**: Maximum height constraints with overflow handling

