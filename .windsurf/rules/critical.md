# Windsurf IDE Rules - DevilsAdvocate

## ðŸŽ¯ Project: DevilsAdvocate

**Framework**: next-js  
**Description**: {{DESCRIPTION}}

---

## Core Rules

### TypeScript
- NEVER use `any` types
- All types explicitly defined
- Files under 500 lines

### PowerShell (Windows)
- Use `;` for chaining (not `&&`)
- Native PowerShell cmdlets

### Git
- Checkpoint before changes: `git add .; git commit -m "checkpoint: before [change]"`

---

## Project Patterns

### Database
- **Type**: {{DATABASE}}
- Service layer for data access

### Structure
- Core logic: `src/lib/`
- Tests: `tests/`
- Follow framework conventions

---

## Key Files
- `PDR.md` - Complete spec
- `CLAUDE.md` - Detailed guidance
- `.github/copilot-instructions.md` - Full rules

---

**Framework**: next-js

