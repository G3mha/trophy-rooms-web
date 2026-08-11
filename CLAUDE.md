# Trophy Rooms Web - Development Guidelines

Web frontend for Trophy Rooms (Next.js, React).

## Required Workflow

**IMPORTANT: Always follow this workflow after making code changes.**

### 1. Lint and Build

```bash
npm run lint
npm run build
```

Fix any lint errors or build failures before proceeding.

### 2. Commit Strategy

Always maximize the number of commits using stacked diffs style:

- Make small, atomic commits - one logical change per commit
- Each commit should be independently meaningful, reviewable, and testable
- Break large features into multiple smaller commits (e.g., scaffolding, core logic, styles, tests)
- Use clear, concise commit messages following conventional commits:
  - `feat:` - new features
  - `fix:` - bug fixes
  - `style:` - CSS/styling changes
  - `refactor:` - code restructuring
  - `chore:` - maintenance tasks
  - `docs:` - documentation
- Never combine unrelated changes into a single commit

### 3. Push

```bash
git push origin main
```

## Pre-commit Checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Changes are split into atomic commits
- [ ] Commit messages are clear and follow conventions
- [ ] Changes are pushed to remote

## Icons

**Always use Lucide React icons.** Never use:
- Emojis
- Inline SVGs
- Other icon libraries

See `.claude/skills/lucide-icons.md` for usage patterns and common icons.

Exception: third-party brand assets with mandated branding (e.g., the Google sign-in button's official "G" logo per Google's branding guidelines) keep their official artwork.

## Visual Identity

All visual/branding work follows the "trophy cabinet" design system: see
`.claude/skills/trophy-cabinet-design/SKILL.md` (palette, fonts, motifs, rules)
and `docs/branding/generate_cards.py` (App Store card generator + silhouette
SVG library).
