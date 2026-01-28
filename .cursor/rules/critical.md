# Cursor IDE Rules - DevilsAdvocate

## ðŸŽ¯ Project: DevilsAdvocate

**Framework**: next-js  
**Description**: {{DESCRIPTION}}

---

## Universal Rules (Inherited from Master Workspace)

### TypeScript Standards
- **NEVER use `any` types** - all types explicitly defined
- Strongly typed objects/classes only
- Keep files under 500 lines

### PowerShell Syntax (Windows)
- Use `;` for command chaining (NEVER `&&`)
- Example: `git add .; git commit -m "message"`

### Git Workflow
- Create checkpoint before significant changes
- Descriptive commit messages

---

## Project-Specific Rules

### Database
- **Type**: {{DATABASE}}
- Use service layer pattern for data access
- Keep business logic separate from queries

### File Organization
- Core logic: `src/lib/`
- Components: `src/components/` (if applicable)
- API routes: Framework-specific pattern
- Tests: `tests/` directory

### Common Commands
```powershell
# Install dependencies
npm install  # or framework equivalent

# Start dev
npm run dev  # or framework equivalent

# Git checkpoint
git add .; git commit -m "checkpoint: before [change]"
```

---

## Key Files to Reference
- `PDR.md` - Complete specification
- `CLAUDE.md` - Detailed guidance
- `.github/copilot-instructions.md` - Full rules

---

**Framework**: next-js  
**Status**: Ready for development

