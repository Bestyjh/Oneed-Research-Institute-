---
name: updateoneedwebsite
description: Update, optimize, and deploy the Oneed website (UI/UX, accessibility, SEO/AEO/GEO/SXO, performance, legal pages, blog content, and Vercel production releases). Use for requests like "update Oneed site", "fix Lighthouse issues", "improve SEO", "deploy to Vercel", "add pages/content", or "make design changes".
---

# updateoneedwebsite

Use this skill when the task is about implementing or improving the Oneed website and shipping changes safely to production.

## Scope

This skill covers:
- UI/visual updates (layout, glass effects, responsiveness)
- Accessibility fixes (contrast, landmarks, ARIA issues, heading order)
- Performance tuning (CLS/INP improvements, image sizing, interaction cost)
- SEO/AEO/GEO/SXO improvements
- Structured data (Organization, FAQPage, BlogPosting, BreadcrumbList, etc.)
- Sitemap/robots/metadata/canonical correctness
- Blog/content updates (including image ALT support)
- Vercel deployment and post-deploy verification

## Project assumptions

- Stack: React + React Router + Tailwind-style utility classes + custom CSS in `src/index.css`
- Main app file: `src/App.jsx`
- Blog data: `src/data/blogPosts.json`
- Public metadata files: `public/index.html`, `public/sitemap.xml`, `public/robots.txt`
- Build command: `npm run build`
- Deploy command: `vercel --prod -y`
- Live domain: `https://www.oneedinstitute.ca`

## Workflow

1. Understand request and identify impacted files.
2. Inspect existing implementation before editing.
3. Apply minimal, focused edits.
4. Run local validation:
   - `npm run build`
5. If deployment requested, deploy:
   - `vercel --prod -y`
6. Verify production behavior with `curl` checks:
   - route HTML/meta/canonical
   - sitemap/robots
   - specific schema presence
7. Report concise outcome with changed files and live URL.

## Implementation rules

- Preserve existing design language unless asked for a redesign.
- Keep accessibility intact; do not introduce non-compliant ARIA.
- When adding images:
  - include meaningful `alt`
  - include width/height if rendered in content regions
- For SEO:
  - ensure route metadata (title/description/canonical) is correct
  - keep sitemap aligned with real routes
  - include/update relevant JSON-LD
- For performance:
  - avoid heavy runtime animations on critical interactions
  - reduce CLS and INP regressions
- Never use destructive git commands.

## Common tasks and examples

### 1) Fix a Lighthouse accessibility warning
Request example:
- "Heading levels should only increase by one"
- "ARIA hidden element must not be focusable"

Actions:
- inspect affected component in `src/App.jsx`
- fix semantic/ARIA issue
- run `npm run build`
- deploy if requested

### 2) Improve SEO/AEO/GEO
Request example:
- "check oneed for AEO, GEO, SXO"
- "improve map listing/SEO"

Actions:
- audit `public/index.html`, `public/sitemap.xml`, route metadata in `src/App.jsx`
- ensure structured data coverage and canonical correctness
- verify with production `curl` checks

### 3) Make visual design more glassy
Request example:
- "make it more glassy"

Actions:
- update global tokens and glass classes in `src/index.css`
- keep readability and contrast acceptable
- validate with `npm run build`

### 4) Deploy to Vercel
Request example:
- "deploy"

Actions:
- run `vercel --prod -y`
- report:
  - deployment URL
  - production alias URL

## Verification snippets

Use checks like:
- `curl.exe -s https://www.oneedinstitute.ca/`
- `curl.exe -s https://www.oneedinstitute.ca/sitemap.xml`
- `curl.exe -s https://www.oneedinstitute.ca/faq | Select-String -Pattern 'FAQPage|application/ld\\+json'`
- `curl.exe -s https://www.oneedinstitute.ca/blog/<slug> | Select-String -Pattern 'BlogPosting|BreadcrumbList'`

## Done criteria

A task is complete when:
- requested change is implemented
- build passes
- deploy done if requested
- production verification confirms expected output
- final report includes what changed and where
