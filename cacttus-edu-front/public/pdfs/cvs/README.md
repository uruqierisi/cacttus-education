# Talent CVs

Served as-is by Vite: everything in `public/` is copied to the site root unchanged, so a
file here at `public/pdfs/cvs/x.pdf` is reachable at `/pdfs/cvs/x.pdf`.

Each "Shkarko CV" button on /biznese/talente links to one of these by an exact,
case-sensitive name. Drop the real files in with EXACTLY these names — no rebuild needed,
and no code change:

| Person            | File            |
|-------------------|-----------------|
| Altin Morina      | altinCV.pdf     |
| Eda Nuka          | edaCV.pdf       |
| Arjana Bellaqa    | arjanaCV.pdf    |
| Nora Bekteshi     | noraCV.pdf      |
| Flamur Haxholli   | flamurCV.pdf    |
| Resul Manxholli   | resulCV.pdf     |
| Kaltrina Qerimi   | kaltrinaCV.pdf  |
| Ernata Koliqi     | ernataCV.pdf    |
| Mirlind Arifi     | mirlindCV.pdf   |
| Gjin Bardhi       | gjinCV.pdf      |
| Trit Meri         | tritCV.pdf      |
| Fatjon Kërqeli    | fatjonCV.pdf    |

ONE file per person, even for the people who appear in several category carousels
(Eda Nuka in two, Arjana Bellaqa in three) — those cards all read the same entry.

Until a file is added its button opens a new tab and 404s — expected, not a bug.

The names are set in `src/app/App.tsx` on each person's `cvUrl` in TALENT_PEOPLE.
Renaming a file here means changing it there too.
