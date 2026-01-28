# DevilsAdvocate

Multi-agent debate framework for fact-checking and bias detection with real-time streaming dual-perspective analysis

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm (or pnpm)
- TypeScript 5+

### Setup

1. **Clone the repository**
   ```powershell
   cd C:\Users\cclem\Dropbox\Source\Projects-26\DevilsAdvocate
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Configure environment**
   ```powershell
   Copy-Item .env.local.example .env.local
   # Edit .env.local with your values
   ```

4. **Start development**
   ```powershell
   npm run dev
   ```

---

## Project Structure

```
DevilsAdvocate/
â”œâ”€â”€ .github/
â”‚   â””â”€â”€ copilot-instructions.md  # AI agent development rules
â”œâ”€â”€ app/                          # Next.js App Router
â”‚   â”œâ”€â”€ api/                      # API routes
â”‚   â”œâ”€â”€ (features)/               # Feature route groups
â”‚   â””â”€â”€ layout.tsx                # Root layout
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ lib/                      # Core business logic
â”‚   â”œâ”€â”€ components/               # React components
â”‚   â””â”€â”€ server/                   # Server-side utilities
â”œâ”€â”€ public/                       # Static assets
â”œâ”€â”€ CLAUDE.md                     # Claude Code agent guidance
â”œâ”€â”€ .cursor/rules/critical.md    # Cursor IDE rules
â”œâ”€â”€ .windsurf/rules/critical.md  # Windsurf IDE rules
â”œâ”€â”€ .agent/rules/critical.md     # Generic agent rules
â”œâ”€â”€ PDR.md                        # Project Design Record
â””â”€â”€ README.md                     # This file
```

---

## Key Files

- **`.github/copilot-instructions.md`** - Agent development rules and conventions
- **`CLAUDE.md`** - Agent guidance for Claude Code and direct Claude usage
- **`.cursor/rules/critical.md`** - Rules for Cursor IDE
- **`.windsurf/rules/critical.md`** - Rules for Windsurf IDE
- **`.agent/rules/critical.md`** - Rules for generic AI agents
- **`PDR.md`** - Project Design Record (architecture, design decisions)

---

## Development Guidelines

- **Follow workspace standards**: Check `.github/copilot-instructions.md`
- **Reference PDR.md**: For architectural patterns and design decisions
- **Create test pages**: Use `/tests/` directory for rapid iteration (``app/tests/``)
- **Git checkpoints**: Run `git add .; git commit -m "checkpoint: before [change]"` before major changes
- **TypeScript**: NEVER use `any` types - all types must be explicitly defined
- **PowerShell**: Use `;` for command chaining, NEVER `&&`

---

## Technologies

- **Framework**: next-js
- **Language**: TypeScript
- **Database**: TBD
- **Services**: openai,anthropic

---

## Getting Help

1. Read `.github/copilot-instructions.md` for agent rules
2. Check `PDR.md` for architecture decisions
3. Review project-specific notes in code comments

---

**Created**: January 28, 2026  
**Framework**: next-js  
**Status**: Ready for development
