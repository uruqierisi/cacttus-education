# Cacttus Education — Frontend Onboarding Guide

Written for a beginner picking up `cacttus-edu-front/` for the first time. Nothing in the repo was changed to produce this — it's a reading guide only.

---

## 1. BIG PICTURE

### What is this app?

It's the **public marketing website** for Cacttus Education (an IT school in Kosovo). It's the site visitors see when they Google the school, browse courses ("trajnime"), and apply. It is a *separate* app from the admin dashboard the school staff use to manage content.

**Jargon:** "Marketing site" = the public-facing website, as opposed to internal tools like the admin dashboard.

### Top-level folders in the monorepo

**Jargon: "monorepo"** = one git repository that contains multiple separate apps/projects side by side, instead of each having its own repo.

```
cacttus-education/          ← the monorepo root
├── cacttus-edu-front/       ← the marketing website (YOUR territory)
├── dashboard/                ← the internal admin app staff use to manage courses/forms
└── backend/                  ← the server/API both apps talk to
```

You will only be editing inside **`cacttus-edu-front/`**. Inside it:

```
cacttus-edu-front/
├── index.html            entry HTML page (barely touched, ever)
├── vite.config.ts         build tool configuration
├── package.json           lists dependencies + scripts (pnpm dev, pnpm build...)
├── src/
│   ├── main.tsx            the very first JS file that runs
│   ├── app/
│   │   ├── App.tsx          ⭐ THE big file — almost the entire website lives here
│   │   └── components/
│   │       ├── ui/           generic reusable building blocks (Button, Card, Input...)
│   │       └── figma/         one helper component from the original Figma export
│   ├── marketing/
│   │   └── lib/               code that talks to the backend API (forms, course data)
│   ├── imports/                a handful of image files used on the homepage
│   └── styles/                 CSS: fonts, Tailwind setup, color theme variables
```

### Languages & tools used (one sentence each)

| Tool | What it's for, in this project |
|---|---|
| **React** | The JavaScript library used to build the UI out of reusable "components" (functions that return HTML-like markup). |
| **TypeScript** | JavaScript with types added — catches typos and mismatched data shapes *before* you run the code (files end in `.tsx`/`.ts`). |
| **Vite** | The dev server + build tool — it's what `pnpm dev` runs to give you instant reload, and what bundles the site for production. |
| **Tailwind CSS** | A CSS framework where you style things by adding utility class names (like `px-4 mt-2 text-lg`) directly in the markup instead of writing separate `.css` files. |
| **React Router** | Handles navigation — decides which "page" component to show based on the URL (e.g. `/trajnime` shows the courses page), without a full page reload. |
| **Radix UI + shadcn-style components** | Pre-built, accessible UI primitives (dropdowns, dialogs, accordions) that live in `src/app/components/ui/` — the unstyled "engine" behind some of the fancier widgets. |
| **lucide-react** | The icon library — every little icon (chevrons, X, menu, social icons) imported at the top of `App.tsx` comes from here. |
| **pnpm** | The package manager (like npm/yarn) used to install dependencies — that's why you run `pnpm dev`, not `npm run dev`. |

### It started as a Figma Make export — what that means for the code

**Jargon: "Figma Make"** is a tool that generates a working React app straight from a Figma design file. The original site was generated this way, then developers kept building on top of it. Evidence of this in the code:

- `src/app/components/figma/ImageWithFallback.tsx` — a helper component Figma Make always includes.
- `ATTRIBUTIONS.md`, `guidelines/`, `prompts/` at the project root — leftover scaffolding/instruction files from that generation process.
- **Most importantly:** instead of a typical React project layout (many small files, one component per file), a huge amount of the site is **one single file**, `src/app/App.tsx`, with dozens of components defined one after another inside it. This is a very normal result of AI/design-tool generation — it's not "wrong," just unusually monolithic (all-in-one-file) compared to hand-built React projects. It means: to find something, you'll mostly be **searching inside one big file** rather than hunting across a folder tree.

---

## 2. HOW THE SITE IS STRUCTURED

### Where the app starts (boot sequence)

1. **`index.html`** — the actual HTML page the browser loads. It has one empty `<div id="root"></div>` and a `<script>` tag pointing at `src/main.tsx`.
2. **`src/main.tsx`** — the real starting point of the JS/React code:
   ```tsx
   import { createRoot } from "react-dom/client";
   import App from "./app/App.tsx";
   import "./styles/index.css";

   createRoot(document.getElementById("root")!).render(<App />);
   ```
   In plain words: "Find that empty `<div id="root">` and render the `<App />` component into it. Also load the global CSS."
3. **`src/app/App.tsx`**, at the very bottom (line ~4126), exports the `App` component, which sets up **routing** — matching the browser's URL to a page component.

### Routing — how a URL decides what you see

Routing lives at the bottom of `App.tsx` (lines **4126–4166**), using React Router:

```tsx
<Route path="/" element={<PageBallina />} />
<Route path="/trajnime" element={<PageTrajnime />} />
<Route path="/trajnime/:slug" element={<PageTrajnimiDetal />} />
...
```

**Jargon: "route"** = a rule mapping a URL path to a component to render. **`:slug`** is a dynamic segment — e.g. `/trajnime/programim-python` — the actual value is read inside the component via `useParams()`.

Every route is wrapped in a shared `<Layout>` component (defined just above, lines 4108–4124) — this is what renders the top banner, navbar, mobile menu, and footer on *every* page, with the page-specific content slotted into `<main>{children}</main>`.

### `App.tsx` map — page/section → approximate line range

`App.tsx` is 4,166 lines long. Everything in it is a function. Here's the map, top to bottom:

| # | What it is | Function name | Line range (approx.) |
|---|---|---|---|
| 0 | Brand color palette (`C` object) + global CSS keyframes | `const C = {...}` | 118–175 |
| 1 | Top promo banner ("Regjistrohu me 20% zbritje") | `TopBanner` | 185–212 |
| 2 | Main navbar + its dropdown menus | `Navbar`, `DropdownStudime`, `DropdownProjektet`, `DropdownBiznese`, `DropdownRreth` | 215–475 |
| 3 | Mobile hamburger menu | `MobileMenu`, `AccordionMobile` | 476–541 |
| 4 | Site footer | `Footer` | 542–598 |
| 5 | Shared small UI pieces: buttons, chips, breadcrumbs, form inputs | `PrimaryBtn`, `SecondaryBtn`, `GhostBtn`, `Overline`, `MetaChip`, `Breadcrumb`, `FormField`, `FormSelect` | 599–702 |
| 6 | Page wrapper (adds consistent top padding under sticky navbar) | `PageWrapper` | 703–741 |
| 7 | Application-form logic & the big "Apliko" (Apply) form band | helpers + `HorizontalApplicationBand`, `PublicApplicationForm` | 742–1688 |
| 8 | Small reusable widgets: rotating hero word, testimonial carousel, content cards | `RotatingWord`, `SuccessCarousel`, `ProgramCard`, `ArticleCard`, `PersonCard`, `ProjectCard` | 1689–1834 |
| 9 | **Home page** ("Ballina") | `PageBallina` | 1835–1932 |
| 10 | Home-page subsections: professional studies section, trainings promo, logo marquee | `StudimeProfesionaleSection`, `TrajnimePromoSection`, `InfiniteLogoMarquee`, `LogoCard` | 1933–2215 |
| 11 | Reusable semester tabs + generic program-page template | `SemesterTabs`, `ProgramPage` | 2216–2380 |
| 12 | **Programim (Programming studies) page** | `PageProgramim` | 2381–2396 |
| 13 | **Siguria (Cybersecurity studies) page** | `PageSiguria` | 2397–2425 |
| 14 | Trainings filter row + training card | `FilterRow`, `TrainingCard` | 2426–2489 |
| 15 | **Trajnime (Trainings catalogue) page** | `PageTrajnime` | 2490–2631 |
| 16 | **Trajnime detail page** (single course, `/trajnime/:slug`) | `PageTrajnimiDetal` | 2632–2840 |
| 17 | **Social-media intake form page** (`/forma/:slug`) | `PageForma` | 2841–2879 |
| 18 | **Biznese (Businesses) landing page** | `PageBiznese` | 2880–2931 |
| 19 | **Biznese → Trajnime (corporate trainings) subpage** | `PageBizneseTrajnime` | 2932–3169 |
| 20 | **Biznese → Talente (talent) subpage** | `PageBizneseTalente` | 3170–3350 |
| 21 | **Biznese → Bursa (scholarship) subpage** | `PageBizneseBursa` | 3351–3534 |
| 22 | **Biznese → Klasa (classroom) subpage** | `PageBiznestKlasa` | 3535–3742 |
| 23 | **Projektet (Projects) list page** | `PageProjektet` | 3743–3769 |
| 24 | **Individual project detail page** (per-project, dynamic route) | `ProjectDetailPage` | 3770–3836 |
| 25 | **Lajme (News) list page** | `PageLajme` | 3837–3885 |
| 26 | **News article page** | `PageArtikull` | 3886–3941 |
| 27 | **Kontakti (Contact) page** | `PageKontakti` | 3942–4037 |
| 28 | **Ekipi (Team) page** | `PageEkipi` | 4038–4079 |
| 29 | **Ligjërueit (Instructors) page** | `PageLigjërueit` | 4080–4107 |
| 30 | Shared page shell (banner+navbar+footer wrapper) | `Layout` | 4108–4124 |
| 31 | Router setup — maps URLs to pages | `App` (default export) | 4126–4166 |

**How to use this table:** if you're told "change the Contact page," you now know to open `App.tsx` and jump to line ~3942 (most editors: `Ctrl+G` to jump to a line number).

### Where reusable UI building blocks live

Two layers:

1. **Page-specific reusable pieces** — defined right inside `App.tsx` itself, close to where they're used (row 5 and 8 in the table above): `PrimaryBtn`, `SecondaryBtn`, `GhostBtn`, `ProgramCard`, `ArticleCard`, `PersonCard`, `TrainingCard`, etc. These are custom to this site's design.
2. **Generic, design-system-style components** — in `src/app/components/ui/` (one file per component: `button.tsx`, `card.tsx`, `input.tsx`, `accordion.tsx`, `dialog.tsx`, etc.). These came from the Figma Make export and wrap Radix UI primitives with Tailwind styling. In practice, most of the *visible* site content uses layer 1 (`PrimaryBtn` etc. in `App.tsx`), while layer 2 backs some of the more complex interactive widgets (forms, dropdowns).

If you're changing simple visible things (text, a button's color on the homepage), you'll almost always be in `App.tsx`, not in `components/ui/`.

---

## 3. HOW TO CHANGE THINGS

### Changing TEXT on a page

1. Open `src/app/App.tsx` in your editor.
2. Use **Find** (Ctrl+F in most editors, or your editor's global search) and search for the **exact visible text** you see in the browser (or a distinctive fragment of it). Since the Albanian text is written directly in the JSX (the HTML-like markup), a literal text search almost always finds it in one hit.
   - Example: to change the homepage headline "Ndërto karrierën tënde në", search for `Ndërto karrierën` — it's at line **1858**.
   - Example: to change the contact page, first use the **line-range table above** to jump near line 3942, then search within that area.
3. Edit the text between the JSX tags (e.g. between `<h1>` and `</h1>`), save, and check the browser.

### Changing a COLOR or the brand theme

There are two color systems in this codebase — know which one you're touching:

- **The one that actually controls almost everything you see:** the `C` object near the top of `App.tsx`, **lines 120–159**. It's a plain JavaScript object:
  ```ts
  const C = {
    brand: "#823685",       // main purple used everywhere (buttons, banner, links)
    brandDark: "#6A2A6D",   // hover state for the brand color
    brandLight: "#F4EAF5",
    brandSoft: "#FAF6FB",
    ...
    n900: "#1A1A1A",        // near-black text
    success: "#1E9E6A",
    danger: "#D33A3A",
    ...
  };
  ```
  Every page references these as `C.brand`, `C.n700`, etc. inside `style={{ ... }}` attributes. **To change the brand purple everywhere on the site, you'd change `C.brand` in one place (line 122) and it ripples through the whole site.** This is the safe, low-risk way to do a brand color change.
- **The other one:** `src/styles/theme.css` — CSS variables (`--primary`, `--secondary`, etc.) used by the generic `components/ui/*` widgets (the shadcn/Radix layer) and Tailwind's `dark:` mode. This is a second, mostly-separate palette. Editing it will *not* change the purple you see on most of the visible pages, because those pages use the `C` object directly instead of these CSS variables. Don't expect editing one to fix the other.

**Safe approach for a beginner:** if the color you want to change is something you can literally see (a button, a heading, a background band), search `App.tsx` for the hex code (e.g. `#823685`) or for the `C.` property name you suspect (e.g. `C.brand`) to see everywhere it's used before changing it.

### Changing an IMAGE

- A handful of images (hero photo, logo, one other) live in **`src/imports/`** and are imported at the very top of `App.tsx`:
  ```tsx
  import heroGraduates from "../imports/image.png";
  import studimePhoto from "../imports/Bursa_Redesign.png";
  import logoImg from "../imports/logo-180px.png";
  ```
  and then used like `<img src={heroGraduates} ... />`. To swap one of these, replace the file in `src/imports/` (keeping the same filename is simplest) or add a new file and update the `import` line + filename.
- Most **course/training images**, though, are NOT local files — they come from the backend API as URLs (see `TrainingCardData`, `imgUrl` fields) and are uploaded through the admin dashboard, not by editing this code. If an image is wrong on a specific course page, that's usually a dashboard content edit, not a code edit.

### Changing SPACING/LAYOUT (Tailwind classes)

**How Tailwind works, in one sentence:** instead of writing CSS rules in a separate file, you add short utility class names directly to the `className="..."` attribute, and each class does one small styling thing.

Three real examples from this codebase:

1. ```tsx
   <div className="max-w-[1200px] mx-auto px-5">
   ```
   - `max-w-[1200px]` → never let this box get wider than 1200 pixels (a custom, one-off value using square brackets).
   - `mx-auto` → center it horizontally (margin-left/right: auto).
   - `px-5` → padding-left and padding-right of `1.25rem` (Tailwind's spacing scale — 5 ≈ 20px).

2. ```tsx
   <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-3">
   ```
   - `text-5xl` → large font size by default (mobile).
   - `md:text-6xl` → **on medium screens and up** (`md:` = responsive prefix), bump to an even larger size. This is how the whole site handles "different look on phone vs. desktop" — a plain class for mobile, then a `sm:`/`md:`/`lg:`-prefixed class that only kicks in above a screen-width breakpoint.
   - `font-bold` → bold weight. `leading-tight` → tighter line-height. `mb-3` → margin-bottom.

3. ```tsx
   <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
   ```
   - `grid grid-cols-2` → lay children out in a 2-column grid by default.
   - `md:grid-cols-4` → switch to 4 columns once the screen is medium-sized or larger (this is the homepage stats row: "500+ Studentë...", "80% Bursa...", etc.).
   - `gap-6` → spacing between grid cells. `pt-6` → padding-top.

**Rule of thumb:** most spacing/sizing classes follow Tailwind's numeric scale (`1`=4px, `2`=8px, `3`=12px, `4`=16px, `5`=20px, `6`=24px, etc. — roughly ×4 in pixels), and a `prefix:` before a class (`md:`, `lg:`, `hover:`) means "only apply this at/above that screen size" or "only on that interaction state."

Note: this codebase also mixes in plain inline `style={{ ... }}` attributes (for exact colors from the `C` object, or precise pixel values like `minHeight: 720`). So layout is a mix of Tailwind classes *and* inline styles — check both when hunting for what controls a given box.

### Seeing your change (`pnpm dev`)

You already run `pnpm dev`. One-line version: it starts a **dev server with hot reload** — the moment you save a file, the browser tab automatically updates in place (no manual refresh, and usually without losing scroll position), so you just save and look.

---

## 4. WHAT NOT TO TOUCH (as a beginner)

| File/folder | Why to leave it alone |
|---|---|
| **`src/marketing/lib/public-api.ts`** | This is the *only* code that talks to the backend server (courses, forms, submissions). It has deliberate security decisions baked in (e.g., no cookies sent, specific error handling) — editing it risks breaking how the whole site fetches real data or introducing a security hole. |
| **`src/marketing/lib/config.ts`** | Reads the API URL from environment variables and fails loudly if missing. Not a place to hardcode values. |
| **`.env.local` / `.env.example`** | Environment configuration (like the backend API URL). Changing this points your whole dev site at a different backend. |
| **`vite.config.ts`** | Build tool configuration — includes the dev server port (deliberately pinned, with a comment explaining why — changing it can break how the site talks to the backend in dev). |
| **`tsconfig.json`, `eslint.config.js`, `postcss.config.mjs`** | Tooling configuration for TypeScript checking, linting, and CSS processing. Breaking these can silently disable error-checking across the whole project. |
| **`package.json` / `pnpm-lock.yaml`** | Declares dependencies and exact versions. Hand-editing can desync what's installed from what the code expects — use `pnpm add <package>` instead if you ever need a new library. |
| **`src/app/components/ui/*`** | The generic Radix/shadcn-based primitives. They're deliberately generic and reused everywhere; tweaking one can ripple into unrelated widgets across the site (dialogs, dropdowns, forms) in ways that are hard to predict as a beginner. |
| **`src/app/components/figma/ImageWithFallback.tsx`** | Small utility from the original Figma export; other code may depend on its exact behavior. |
| **`../backend/` and `../dashboard/`** | Entirely different apps in the monorepo — the server and the internal admin tool. Out of scope for marketing-site front-end work. |
| **Routing block at the bottom of `App.tsx` (~line 4126–4166)** | Changing a `path="..."` here changes real, live URLs (e.g. what `/trajnime` means) — could break bookmarks, the navbar links, and SEO. Safe to *read*, risky to edit without understanding all the places that link to that route. |

---

## 5. A SAFE FIRST EXERCISE

Try changing the subtitle text on the homepage hero section — it's plain visible text, has no logic attached, and can't break anything else.

- **File:** `cacttus-edu-front/src/app/App.tsx`
- **Line:** **1861–1863** (inside `PageBallina`), currently:
  ```tsx
  <p className="text-lg leading-relaxed mb-6 max-w-lg" style={{ color: C.muted }}>
    Shkolla e parë profesionale e teknologjisë në Kosovë. Studime dyvjeçare të akredituara, trajnime praktike dhe ligjërues nga industria.
  </p>
  ```
- **What to do:** change the Albanian sentence inside the `<p>...</p>` tags to anything you like (e.g. add your name, or tweak a word), keeping the `<p ...>` and `</p>` tags themselves untouched.
- **What you should see:** with `pnpm dev` running, save the file, open `http://localhost:5174` in your browser, and the paragraph right under the big rotating headline ("Ndërto karrierën tënde në...") on the homepage should instantly show your new text — no refresh needed. That's hot reload in action.

Once you've done that and it feels comfortable, tell me the real edit you want and we'll do it together, one at a time.
