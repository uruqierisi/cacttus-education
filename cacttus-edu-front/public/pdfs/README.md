# Curriculum PDFs

Served as-is by Vite: everything in `public/` is copied to the site root unchanged,
so a file here at `public/pdfs/x.pdf` is reachable at `/pdfs/x.pdf`.

The "Shkarko planprogramin" button on each programme page links to one of these by an
exact, case-sensitive name. Drop the real files in with EXACTLY these names — no
rebuild needed, and no code change:

| Page                                        | Route        | File to add                                 |
|---------------------------------------------|--------------|---------------------------------------------|
| Zhvillim i Ueb-it dhe Aplikacioneve Mobile  | /programim   | plani-zhvillim-web-aplikacione-mobile.pdf   |
| Siguria Kibernetike                         | /siguria     | plani-siguria-kibernetike.pdf               |

Until they are added the buttons open a new tab and 404 — expected, not a bug.

The names are set in `src/app/App.tsx` on the `planUrl` prop of each `<ProgramPage>`.
Renaming a file here means changing it there too.
