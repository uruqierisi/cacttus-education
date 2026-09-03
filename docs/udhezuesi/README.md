# Udhëzues Përdorimi — Paneli Administrues

Source for the Albanian staff guide. The built `.docx` and `.pdf` sit alongside it and are
committed too, so anyone can hand them out without running anything.

## Files

| | |
|---|---|
| `build_udhezuesi.py` | The document. Text and layout live here — every paragraph sits next to the screenshot it explains. |
| `to_pdf.py` | Exports to PDF through Word, which also fills in the table of contents. |
| `screenshots/` | 19 numbered PNGs, 1280px wide, cropped per step. |
| `logo.png` | Rendered from `cacttus-edu-front/public/brand/education-black.svg`. |

## Rebuilding

```
python build_udhezuesi.py
python to_pdf.py
```

`to_pdf.py` needs Word on Windows. Without it the `.docx` still opens fine — Word fills
the contents page in on first open, or press F9 on it.

## Re-taking the screenshots

They were captured against the local stack (db + backend + dashboard + marketing site)
with demo content: invented trainings, articles and applicants. **No production data and
no real applicant names appear anywhere in this guide** — every person named in a
screenshot is fictional.

If the screenshots need retaking after a UI change, seed comparable demo content first;
a guide that pictures an empty dashboard teaches nothing.

## Scope

Deliberately excluded: server operations, deploys, backups, and creating staff accounts
beyond mentioning that the administrator does it.
