# RainSite Agent Guidelines

## Project Overview

This is Rain's Chinese personal blog, built with Hugo and PaperMod and
deployed as Cloudflare Worker static assets. Keep the site simple and
content-first.

## Adding or Updating a Blog Post

1. Put each post in a year and slug directory:

   ```text
   content/posts/YYYY/post-slug/index.md
   ```

2. Use front matter consistent with existing posts:

   ```yaml
   ---
   title: "文章标题"
   date: 2026-10-17T00:00:00+08:00
   tags: ["标签"]
   categories: ["tech"] # or "life"
   draft: false
   ---
   ```

3. Store article images under the date they belong to:

   ```text
   static/images/YYYY/MM/DD/meaningful-file-name.jpg
   ```

   Use descriptive lowercase names with hyphens. Do not keep camera names
   such as `IMG_...` in the published layout. Keep site-wide contact icons in
   `static/images/contact/`.

4. Reference images with site-root paths:

   ```markdown
   ![图片说明](/images/YYYY/MM/DD/meaningful-file-name.jpg)
   ```

5. Do not commit `public/`, `resources/`, `.hugo_build.lock`, or videos.
   Workers Assets has a 25 MiB per-file limit. Large media belongs in an
   external store such as Cloudflare R2; add a public URL only after it has
   been provided and verified.

## Voice and Editing Rules

The author's writing should sound like a real personal log, not polished
marketing copy or generic AI prose.

- Preserve the author's first-person perspective, chronology, opinions,
  jokes, internet slang, English words, and deliberately casual expressions.
- Preserve concrete details such as times, places, prices, routes, counts,
  comparisons, and personal judgments. Do not invent missing facts.
- Prefer light-touch editing: fix typos, incorrect words, broken grammar,
  punctuation, paragraph breaks, Markdown structure, and obvious logical
  jumps.
- Do not replace the author's wording with elegant literary phrases, formal
  summaries, motivational conclusions, or generic transitions.
- Keep self-deprecating humor and subjective reactions when they are clear.
  Do not sanitize the voice into neutral travel-guide language.
- If a sentence is awkward but understandable, keep its character and make
  only the smallest change needed for readability.
- Never silently change factual claims, numbers, names, dates, or the author's
  assessment. If a fact is uncertain, preserve the uncertainty or flag it.
- Before editing, read the whole post. After editing, check that it still
  reads like the author wrote it.

## Media Handling

- Inspect supplied media before writing references.
- Rename meaningless image filenames when organizing them, and update every
  reference in the post.
- Rotate or transcode media only when explicitly requested or required for
  deployment, and verify the result after conversion.
- Do not embed local video files in the site unless the deployment limit and
  hosting plan support them. Prefer R2 URLs for future videos.

## Verification and Publishing

Run the smallest relevant checks after content changes:

```bash
hugo --minify
git diff --check
```

Confirm every referenced image exists under `static/`, then remove generated
`public/` and `.hugo_build.lock` files before committing. Review the diff to
make sure unrelated user edits were preserved. Commit related content changes
in one focused commit and push to `origin/main` only when the user asks to
publish.
