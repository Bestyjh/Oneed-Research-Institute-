# SEO Words Guide (Oneed)

Use this whenever you add a new page or improve ranking for an existing page.

## 1) Choose words for each page
- Pick 1 primary keyword phrase.
- Pick 3-5 secondary related phrases.
- Keep them specific (example: `education grants Canada`, not just `grants`).

## 2) Update route SEO config
Edit `src/App.jsx` inside `SeoManager()` in the `seoByPath` array.

For each route object, set:
- `title`
- `description`
- `keywords` (array of your page-specific phrases)

Example shape:

```js
{
  match: /^\/grants$/,
  title: 'Grants & Scholarships | Oneed Research Institute',
  description: 'Find grants and scholarship opportunities that support inclusive learning and research.',
  keywords: ['education grants Canada', 'student scholarships Canada', 'research funding opportunities']
}
```

## 3) Keep words where Google expects them
- Title tag: already set from `title`.
- Meta description: already set from `description`.
- Meta keywords: auto-generated from `keywords`.
- H1 in page content: include your primary phrase naturally.
- First paragraph: include primary phrase once.

## 4) Rules to avoid over-optimization
- Do not repeat the same phrase unnaturally.
- Use variants/synonyms.
- Keep each page focused on one topic intent.

## 5) Verify after change
- Open page source and confirm `<title>`, `description`, and `keywords`.
- In Search Console, request indexing for updated URLs.
