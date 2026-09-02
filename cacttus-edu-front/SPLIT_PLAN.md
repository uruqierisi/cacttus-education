# SPLIT_PLAN.md — breaking up `src/app/App.tsx`

**Phase 1 deliverable. No code has been moved. Nothing outside this file has been created or edited.**

Branch state: `backup-before-split-20260901` created off `main`; working on `split-app-tsx`; `main` untouched.

---

## 0. Scope and ground rules (restating the contract)

- Pure structural refactor. Zero behaviour change: no UI, copy, CSS/Tailwind class, routing, data-fetching or security change.
- Cut-and-paste only. No renames, no reordering, no cleanups, no "while I'm here" fixes.
- Bugs found are **listed** (§7), not fixed.
- Nothing outside `cacttus-edu-front/` is touched. `src/marketing/lib/forms.config.ts` is not touched.
- Preserved exactly: every `credentials: 'omit'` fetch, every DOMPurify call and its config, `loading="lazy"`, all `aria-*` / NavLink active-state logic, and the drawer's `overflow-hidden` wrapper (iOS horizontal-scroll fix).
- Comments move verbatim with the code they annotate. This file is unusually comment-dense and the comments carry real decisions (measured pixel values, rejected alternatives, CSS traps). They are part of the payload.

### 0.1 One correction to the brief — read this before approving

> "`pnpm build` (includes tsc) must be 0 after every step."

**`pnpm build` does not typecheck.** `package.json` line 8:

```json
"build": "vite build",
"typecheck": "tsc --noEmit",
```

Vite transpiles TypeScript with esbuild and **discards types entirely** — a broken import, a missing export or a type error will build clean and only fail at runtime. This is exactly the class of error a file split produces most of.

**The gate I propose instead, after every step:**

```
pnpm typecheck && pnpm build
```

Both must exit 0. If you want the `build` script itself changed to `tsc --noEmit && vite build`, say so — but that is a `package.json` edit and therefore outside "zero behaviour change", so I have not assumed it.

---

## 1. Facts established

| | |
|---|---|
| `src/app/App.tsx` | 8,645 lines |
| Top-level declarations | 161 |
| Image imports from `../imports/` | 150, in **three separate blocks** (lines 3–171, 6972–7004, 7867–7886) |
| Other module imports | `react`, `embla-carousel-react`, `react-router`, `dompurify`, `lucide-react`, `../marketing/lib/public-api`, `../marketing/lib/forms.config` |
| `lucide-react` import position | **line 418**, mid-file, after `renderSafeHtml` |
| Routes declared | 24 (16 static + 8 generated from `PROJECTS`) |
| Largest declarations | `HorizontalApplicationBand` 527, `PublicApplicationForm` 387, `PageBiznestKlasa` 337, `PageTrajnimiDetal` 336, `ScrollPopupForm` 309 |
| Fully dead top-level declarations | **0** — every one of the 161 is referenced at least once |
| `src/app/components/ui/*` (48 files) + `components/figma/ImageWithFallback.tsx` | imported by **nothing**; `App.tsx` mentions `carousel.tsx` only in a comment |
| Everything `main.tsx` loads | `./app/App.tsx` and `./styles/index.css` — that is the whole graph |

---

## 2. Inventory — all 161 top-level declarations

`Deps` = other top-level declarations referenced **in code** (comments excluded). `Img` = count of `../imports/*` assets referenced.

| Lines | Size | Kind | Name | Deps | Img | Target module |
|---|---|---|---|---|---|---|
| 216–227 | 12 | const | `TRAINING_CATEGORY_LABELS` | — | | `lib/training-labels.ts` |
| 228–232 | 5 | const | `TRAINING_STATUS_LABELS` | — | | `lib/training-labels.ts` |
| 233–247 | 15 | const | `TRAINING_STATUS_STYLES` | — | | `lib/training-labels.ts` |
| 248–267 | 20 | fn | `TrainingStatusBadge` | `TRAINING_STATUS_LABELS`, `TRAINING_STATUS_STYLES` | | `ui/TrainingStatusBadge.tsx` |
| 268 | 1 | const | `PHONE_RULE` | — | | `lib/phone.ts` |
| 269–277 | 9 | const | `PHONE_ERROR` | — | | `lib/phone.ts` |
| 278–284 | 7 | fn | `sanitizePhone` | — | | `lib/phone.ts` |
| 285–288 | 4 | fn | `isValidPhone` | `PHONE_RULE` | | `lib/phone.ts` |
| 289–305 | 17 | const | `TRAINING_FORMAT_LABELS` | — | | `lib/training-labels.ts` |
| 306–328 | 23 | fn | `formatTrainingDate` | — | | `lib/dates.ts` |
| 329–333 | 5 | const | `ALBANIAN_MONTHS` | — | | `lib/dates.ts` |
| 334–366 | 33 | fn | `formatPostDate` | `ALBANIAN_MONTHS` | | `lib/dates.ts` |
| 367–377 | 11 | const | `ALLOWED_HTML_TAGS` | — | | `lib/sanitize.ts` |
| 378–406 | 29 | const | `ALLOWED_HTML_ATTR` | — | | `lib/sanitize.ts` |
| **401–405** | 5 | — | **`DOMPurify.addHook` — module-scope side effect** | — | | `lib/sanitize.ts` ⚠ §5.1 |
| 407–460 | 54 | fn | `renderSafeHtml` | `ALLOWED_HTML_TAGS`, `ALLOWED_HTML_ATTR` | | `lib/sanitize.ts` |
| 461–502 | 42 | const | `C` | — | | `theme.ts` |
| 503–565 | 63 | const | `globalStyle` | — | | `theme.ts` |
| 566–572 | 7 | type | `DropdownId` | — | | `layout/Navbar.tsx` |
| 573–622 | 50 | fn | `TopBanner` | `C` | | `layout/TopBanner.tsx` |
| 623–782 | 160 | fn | `Navbar` | `C`, `PrimaryBtn`, `DropdownId`, all 4 dropdowns | | `layout/Navbar.tsx` |
| 783–837 | 55 | fn | `DropdownStudime` | `C` | | `layout/dropdowns.tsx` |
| 838–848 | 11 | const | `PROJEKTET_LIST` | — | 8 | `data/projektet-list.ts` ⚠ §5.2 |
| 849–885 | 37 | fn | `DropdownProjektet` | `C`, `PROJEKTET_LIST` | | `layout/dropdowns.tsx` |
| 886–923 | 38 | fn | `DropdownBiznese` | `C` | | `layout/dropdowns.tsx` |
| 924–946 | 23 | fn | `DropdownRreth` | `C` | | `layout/dropdowns.tsx` |
| 947–1035 | 89 | fn | `MobileMenu` | `C`, `AccordionMobile`, `PROJEKTET_LIST`, `PrimaryBtn` | | `layout/MobileMenu.tsx` ⚠ §5.3 |
| 1036–1090 | 55 | fn | `AccordionMobile` | `C` | | `layout/MobileMenu.tsx` |
| 1091–1115 | 25 | fn | `TikTokIcon` | — | | `layout/TikTokIcon.tsx` |
| 1116–1122 | 7 | const | `SOCIAL_URLS` | — | | `data/socials.ts` |
| 1123–1124 | 2 | type | `SocialLink` | — | | `data/socials.ts` |
| 1125–1138 | 14 | const | `FOOTER_SOCIALS` | `SOCIAL_URLS`, `SocialLink`, `TikTokIcon` | | `data/socials.ts` |
| 1139–1145 | 7 | const | `CONTACT_SOCIALS` | `SOCIAL_URLS`, `SocialLink`, `TikTokIcon` | | `data/socials.ts` |
| 1146–1153 | 8 | const | `FOOTER_LINKS` | — | | `data/socials.ts` |
| 1154–1335 | 182 | fn | `Footer` | `C`, `FOOTER_LINKS`, `FOOTER_SOCIALS` | | `layout/Footer.tsx` |
| 1336–1350 | 15 | fn | `PrimaryBtn` | `C` | | `ui/buttons.tsx` |
| 1351–1364 | 14 | fn | `SecondaryBtn` | `C` | | `ui/buttons.tsx` |
| 1365–1382 | 18 | fn | `GhostBtn` | `C` | | `ui/buttons.tsx` |
| 1383–1394 | 12 | fn | `Overline` | `C` | | `ui/Overline.tsx` |
| 1395–1401 | 7 | const | `HERO_STATS` | — | | `data/hero-stats.ts` |
| 1402–1417 | 16 | fn | `HeroStats` | `C`, `HERO_STATS` | | `ui/HeroStats.tsx` |
| 1418–1425 | 8 | fn | `MetaChip` | `C` | | `ui/MetaChip.tsx` |
| 1426–1442 | 17 | fn | `Breadcrumb` | `C` | | `ui/Breadcrumb.tsx` |
| 1443–1460 | 18 | fn | `FormField` | `C` | | `ui/FormField.tsx` |
| 1461–1487 | 27 | fn | `FormSelect` | `C` | | `ui/FormField.tsx` |
| 1488–1500 | 13 | fn | `PageWrapper` | — | | `ui/PageWrapper.tsx` |
| 1501–1514 | 14 | const | `POPUP_DREJTIMET` | — | | `forms/popup-config.ts` |
| 1515–1520 | 6 | const | `POPUP_PROGRAMME_VALUES` | — | | `forms/popup-config.ts` |
| 1521–1536 | 16 | const ×9 | `POPUP_ENTER_MS`, `POPUP_EXIT_MS`, `POPUP_ROW_MS`, `POPUP_ROW_STAGGER_MS`, `POPUP_ROW_START_MS`, `POPUP_REDUCED_MS`, `POPUP_REVEAL_FALLBACK_MS`, `POPUP_ENTER_EASE`, `POPUP_ROW_EASE` | — | | `forms/popup-config.ts` |
| 1537–1845 | **309** | fn | `ScrollPopupForm` | `C`, `FormField`, `FormSelect`, `PrimaryBtn`, `PHONE_ERROR`, `isValidPhone`, `sanitizePhone`, all `POPUP_*` | | `forms/ScrollPopupForm.tsx` |
| 1846–1847 | 2 | type | `AnswerValue` | — | | `forms/answers.ts` |
| 1848–1850 | 3 | const | `EMPTY_CONTACT` | — | | `forms/answers.ts` |
| 1851–1859 | 9 | const | `TEXT_INPUT_TYPES` | — | | `forms/answers.ts` |
| 1860–1877 | 18 | fn | `emptyAnswer` | `AnswerValue` | | `forms/answers.ts` |
| 1878–1884 | 7 | fn | `blankAnswers` | `AnswerValue`, `emptyAnswer` | | `forms/answers.ts` |
| 1885–1897 | 13 | fn | `isBlank` | `AnswerValue` | | `forms/answers.ts` |
| 1898–1916 | 19 | fn | `indexErrorDetails` | — | | `forms/answers.ts` |
| 1917–1958 | 42 | fn | `ApplyFieldShell` | — | | `forms/ApplyFieldShell.tsx` |
| 1959–1990 | 32 | fn | `PublicFormFieldShell` | `C` | | `forms/PublicFormFieldShell.tsx` |
| 1991–2517 | **527** | fn | `HorizontalApplicationBand` | `C`, `ApplyFieldShell`, `answers.*`, `PHONE_ERROR`, `isValidPhone`, `sanitizePhone` | | `forms/HorizontalApplicationBand.tsx` |
| 2518–2904 | **387** | fn | `PublicApplicationForm` | `C`, `PrimaryBtn`, `SecondaryBtn`, `PublicFormFieldShell`, `answers.*`, `PHONE_ERROR`, `isValidPhone`, `sanitizePhone` | | `forms/PublicApplicationForm.tsx` |
| 2905–2933 | 29 | fn | `RotatingWord` | `C` | | `sections/RotatingWord.tsx` |
| 2934–2950 | 17 | iface | `StudentPhoto` | — | | `data/student-photos.ts` |
| 2951–2969 | 19 | const | `STUDENT_PHOTOS` | `StudentPhoto` | 9 | `data/student-photos.ts` |
| 2970–3036 | 67 | fn | `SuccessCarousel` | `C`, `STUDENT_PHOTOS` | | `sections/SuccessCarousel.tsx` |
| 3037–3062 | 26 | fn | `ArticleCard` | `C`, `formatPostDate` | | `cards/ArticleCard.tsx` |
| 3063–3133 | 71 | fn | `PersonCard` | `C`, `MetaChip` | | `cards/PersonCard.tsx` |
| 3134–3142 | 9 | const | `HERO_PARTNERS` | — | 6 | `data/hero-partners.ts` |
| 3143–3181 | 39 | fn | `PartnerLogoGrid` | `C`, `HERO_PARTNERS` | | `sections/PartnerLogoGrid.tsx` |
| 3182–3201 | 20 | fn | `ProjectCard` | `C`, `GhostBtn` | | `cards/ProjectCard.tsx` |
| 3202–3294 | 93 | fn | `PageBallina` | `C`, `HeroStats`, `PrimaryBtn`, `SecondaryBtn`, `PageWrapper`, `RotatingWord`, `SuccessCarousel`, `StudimeProfesionaleSection`, `TrajnimePromoSection`, `HorizontalApplicationBand`, `BALLINA_PROGRAMS_ID`, `scrollToSection`, `useApplyPopup` | 1 | `pages/PageBallina.tsx` |
| 3295–3296 | 2 | const | `STUDIME_SECTION_IMG_POSITION` | — | | `sections/StudimeProfesionaleSection.tsx` |
| 3297–3469 | 173 | fn | `StudimeProfesionaleSection` | `C`, `Overline`, `SecondaryBtn`, `BALLINA_PROGRAMS_ID`, `STUDIME_SECTION_IMG_POSITION` | 1 | `sections/StudimeProfesionaleSection.tsx` |
| 3470–3485 | 16 | const | `TRAINING_CATEGORY_ICONS` | — | | `sections/TrajnimePromoSection.tsx` |
| 3486–3496 | 11 | const ×3 | `HOME_TRAININGS_LIMIT`, `HOME_TRAINING_CARD_STYLE`, `HOME_SKELETON_BAR` | — | | `sections/TrajnimePromoSection.tsx` |
| 3497–3638 | 142 | fn | `TrajnimePromoSection` | `C`, `GhostBtn`, `PrimaryBtn`, `Overline`, `TRAINING_FORMAT_LABELS`, `TRAINING_CATEGORY_ICONS`, `HOME_*` | | `sections/TrajnimePromoSection.tsx` |
| 3639–3641 | 3 | type | `MarqueeLogo` | — | | `data/partner-logos.ts` |
| 3642–3668 | 27 | const | `PARTNER_LOGOS` | `MarqueeLogo` | 9 | `data/partner-logos.ts` |
| 3669–3707 | 39 | const | `PARTNER_LOGO_IMAGES` | `MarqueeLogo` | 17 | `data/partner-logos.ts` |
| 3708–3757 | 50 | const | `TESTIMONIALS` | — | | `data/testimonials.ts` |
| 3758–3884 | 127 | fn | `TestimonialsSection` | `C`, `TESTIMONIALS` | | `sections/TestimonialsSection.tsx` |
| 3885–3933 | 49 | fn | `InfiniteLogoMarquee` | `C`, `LogoCard`, `MarqueeLogo`, `PARTNER_LOGOS` | | `sections/InfiniteLogoMarquee.tsx` |
| 3934–3972 | 39 | fn | `LogoCard` | `C`, `MarqueeLogo` | | `cards/LogoCard.tsx` |
| 3973–3976 | 4 | type ×2 | `SemesterModule`, `Semester` | — | | `data/semesters.ts` |
| 3977–4023 | 47 | const | `SEM_PROGRAMIM` | `Semester` | | `data/semesters.ts` |
| 4024–4066 | 43 | const | `SEM_SIGURIA` | `Semester` | | `data/semesters.ts` |
| 4067–4175 | 109 | fn | `SemesterTabs` | `C`, `SEM_PROGRAMIM` (as `typeof`) | | `sections/SemesterTabs.tsx` |
| 4176–4377 | 202 | fn | `ProgramPage` | `C`, `Breadcrumb`, `MetaChip`, `PageWrapper`, `PrimaryBtn`, `SecondaryBtn`, `SemesterTabs`, `InfiniteLogoMarquee`, `PARTNER_LOGO_IMAGES`, `HorizontalApplicationBand`, `SEM_PROGRAMIM`, `useApplyPopup` | | `pages/ProgramPage.tsx` |
| 4378–4437 | 60 | fn | `PageProgramim` | `ProgramPage`, `SEM_PROGRAMIM` | 1 | `pages/PageProgramim.tsx` |
| 4438–4495 | 58 | fn | `PageSiguria` | `ProgramPage`, `SEM_SIGURIA` | 1 | `pages/PageSiguria.tsx` |
| 4496–4517 | 22 | const | `TRAINERS` | — | 4 | `data/trainers.ts` |
| 4518–4549 | 32 | fn | `FilterRow` | `C` | | `sections/FilterRow.tsx` |
| 4550–4591 | 42 | fn | `TrainingCard` | `C`, `MetaChip`, `PrimaryBtn`, `TrainingStatusBadge`, `TRAINING_CATEGORY_LABELS`, `TRAINING_FORMAT_LABELS`, `formatTrainingDate` | | `cards/TrainingCard.tsx` |
| 4592–4601 | 10 | const | `ALL_FILTER` | — | | `pages/PageTrajnime.tsx` |
| 4602–4613 | 12 | fn | `cityKey` | — | | `lib/cities.ts` |
| 4614–4626 | 13 | fn | `dedupeCities` | `cityKey` | | `lib/cities.ts` |
| 4627–4874 | 248 | fn | `PageTrajnime` | `C`, `FilterRow`, `HeroStats`, `PageWrapper`, `SecondaryBtn`, `TrainingCard`, `InfiniteLogoMarquee`, `TestimonialsSection`, `TRAINERS`, `ALL_FILTER`, `cityKey`, `dedupeCities`, 3 label maps | | `pages/PageTrajnime.tsx` |
| 4875–4876 | 2 | const | `TRAJNIMI_INSTRUCTOR_IMG_POSITION` | — | | `pages/PageTrajnimiDetal.tsx` |
| 4877–5212 | 336 | fn | `PageTrajnimiDetal` | `C`, `Breadcrumb`, `MetaChip`, `PageWrapper`, `PrimaryBtn`, `SecondaryBtn`, `PublicApplicationForm`, label maps, `formatTrainingDate` | | `pages/PageTrajnimiDetal.tsx` |
| 5213–5281 | 69 | fn | `PageForma` | `C`, `Overline`, `PageWrapper`, `PublicApplicationForm` | | `pages/PageForma.tsx` |
| 5282–5340 | 59 | const ×3 | `BIZNESE_HERO_IMG_OFFSET`, `BIZNESE_HERO_IMG_HEIGHT`, `BIZNESE_HERO_IMG_SCALE` | — | | `pages/PageBiznese.tsx` |
| 5341–5489 | 149 | fn | `PageBiznese` | `C`, `GhostBtn`, `PageWrapper`, `PrimaryBtn`, `BIZNESE_HERO_IMG_*` | 1 | `pages/PageBiznese.tsx` |
| 5490–5549 | 60 | hook | `useBusinessLead` | `PHONE_ERROR`, `isValidPhone` | | `hooks/useBusinessLead.ts` |
| 5550–5603 | 54 | hook | `useClassBooking` | `PHONE_ERROR`, `isValidPhone` | | `hooks/useClassBooking.ts` |
| 5604–5605 | 2 | const | `KLASA_BOOKING_ID` | — | | `pages/PageBiznestKlasa.tsx` |
| 5606–5607 | 2 | const | `BIZNESE_TRAJNIME_IMG_POSITION` | — | | `pages/PageBizneseTrajnime.tsx` |
| 5608–5845 | 238 | fn | `PageBizneseTrajnime` | `C`, `Breadcrumb`, `PageWrapper`, `PrimaryBtn`, `globalStyle`, `sanitizePhone`, `useBusinessLead` | 1 | `pages/PageBizneseTrajnime.tsx` |
| 5846–5853 | 8 | type | `TalentPerson` | — | | `data/talents.ts` |
| 5854–5878 | 25 | const | `TALENT_PEOPLE` | `TalentPerson` | 12 | `data/talents.ts` |
| 5879–5952 | 74 | const | `TALENT_CATEGORIES` | `TALENT_PEOPLE` | | `data/talents.ts` |
| 5953–5955 | 3 | const | `TALENT_AVATAR_RING` | — | | `cards/TalentCard.tsx` |
| 5956–6084 | 129 | fn | `TalentCard` | `C`, `TALENT_AVATAR_RING`, `TalentPerson` | | `cards/TalentCard.tsx` |
| 6085–6230 | 146 | fn | `TalentCarousel` | `C`, `TalentCard`, `TalentPerson` | | `sections/TalentCarousel.tsx` |
| 6231–6441 | 211 | fn | `PageBizneseTalente` | `C`, `Breadcrumb`, `PageWrapper`, `PrimaryBtn`, `TalentCarousel`, `TALENT_CATEGORIES`, `TALENTE_LIST_ID`, `globalStyle`, `sanitizePhone`, `scrollToSection`, `useBusinessLead` | 5 | `pages/PageBizneseTalente.tsx` |
| 6442–6461 | 20 | const | `BURSA_HERO_IMG_POSITION` | — | | `pages/PageBizneseBursa.tsx` |
| 6462–6470 | 9 | iface | `BursaSponsor` | — | | `data/bursa-sponsors.ts` |
| 6471–6477 | 7 | const | `BURSA_SPONSORS` | `BursaSponsor` | 3 | `data/bursa-sponsors.ts` |
| 6478–6666 | 189 | fn | `PageBizneseBursa` | `C`, `Breadcrumb`, `PageWrapper`, `PrimaryBtn`, `BURSA_SPONSORS`, `BURSA_HERO_IMG_POSITION`, `globalStyle` | 1 | `pages/PageBizneseBursa.tsx` |
| 6667–6668 | 2 | const | `KLASA_HERO_IMG_POSITION` | — | | `pages/PageBiznestKlasa.tsx` |
| 6669–7005 | 337 | fn | `PageBiznestKlasa` | `C`, `Breadcrumb`, `PageWrapper`, `PrimaryBtn`, `KLASA_*`, `globalStyle`, `sanitizePhone`, `useClassBooking` | 43 | `pages/PageBiznestKlasa.tsx` |
| 7006–7210 | 205 | const | `PROJECTS` | — | 30 | `data/projects.ts` |
| 7211–7268 | 58 | fn | `PageProjektet` | `C`, `PROJECTS`, `PageWrapper`, `PartnerLogoGrid`, `ProjectCard` | | `pages/PageProjektet.tsx` |
| 7269–7274 | 6 | const | `PROJECT_FALLBACK_GALLERY` | — | | `data/projects.ts` |
| 7275–7465 | 191 | fn | `ProjectDetailPage` | `C`, `Breadcrumb`, `PageWrapper`, `PrimaryBtn`, `PROJECTS`, `PROJECT_FALLBACK_GALLERY`, `PROJEKTET_LIST` | | `pages/ProjectDetailPage.tsx` |
| 7466–7572 | 107 | fn | `PageLajme` | `C`, `ArticleCard`, `GhostBtn`, `PageWrapper`, `SecondaryBtn`, `formatPostDate` | | `pages/PageLajme.tsx` |
| 7573–7713 | 141 | fn | `PageArtikulli` | `C`, `ArticleCard`, `Breadcrumb`, `PageWrapper`, `PrimaryBtn`, `formatPostDate`, **`renderSafeHtml`** | | `pages/PageArtikulli.tsx` |
| 7714–7887 | 174 | fn | `PageKontakti` | `C`, `CONTACT_SOCIALS`, `FormField`, `FormSelect`, `PageWrapper`, `PrimaryBtn`, `PHONE_ERROR`, `isValidPhone`, `sanitizePhone` | 20 (mid-block) | `pages/PageKontakti.tsx` |
| 7888–7937 | 50 | const | `TEAM_MEMBERS` | — | 21 | `data/team.ts` |
| 7938–7951 | 14 | const | `ABOUT_MISSION_POINTS` | — | | `data/about.ts` |
| 7952–7960 | 9 | const | `ABOUT_VALUES` | — | | `data/about.ts` |
| 7961–7967 | 7 | const | `ABOUT_STAT_ICONS` | — | | `data/about.ts` |
| 7968–7977 | 10 | const | `COUNT_UP_MS` | — | | `sections/AboutStatsBand.tsx` |
| 7978–8017 | 40 | hook | `useHasEnteredView` | — | | `hooks/useHasEnteredView.ts` |
| 8018–8035 | 18 | fn | `splitStatValue` | — | | `sections/AboutStatsBand.tsx` |
| 8036–8077 | 42 | fn | `CountUpValue` | `COUNT_UP_MS`, `splitStatValue` | | `sections/AboutStatsBand.tsx` |
| 8078–8128 | 51 | fn | `AboutStatsBand` | `C`, `ABOUT_STAT_ICONS`, `CountUpValue`, `HERO_STATS`, `useHasEnteredView` | | `sections/AboutStatsBand.tsx` |
| 8129–8134 | 6 | const ×2 | `RRETH_AMBIENT_IMG_POSITION`, `RRETH_TEAM_IMG_POSITION` | — | | `pages/PageRrethNesh.tsx` |
| 8135–8380 | 246 | fn | `PageRrethNesh` | `C`, `Breadcrumb`, `PageWrapper`, `PrimaryBtn`, `SecondaryBtn`, `AboutStatsBand`, `HorizontalApplicationBand`, `ABOUT_*`, `RRETH_*` | 1 | `pages/PageRrethNesh.tsx` |
| 8381–8407 | 27 | fn | `PageEkipi` | `C`, `Breadcrumb`, `PageWrapper`, `PersonCard`, `TEAM_MEMBERS` | | `pages/PageEkipi.tsx` |
| 8408–8445 | 38 | const | `LIGJËRUEIT` | — | 19 | `data/lecturers.ts` |
| 8446–8488 | 43 | fn | `PageLigjërueit` | `C`, `Breadcrumb`, `PageWrapper`, `PersonCard`, `SecondaryBtn`, `LIGJËRUEIT` | | `pages/PageLigjerueit.tsx` ⚠ §5.5 |
| 8489–8491 | 3 | const | `ApplyPopupContext` | — | | `hooks/apply-popup.tsx` |
| 8492–8500 | 9 | hook | `useApplyPopup` | `ApplyPopupContext` | | `hooks/apply-popup.tsx` |
| 8501 | 1 | const | `BALLINA_PROGRAMS_ID` | — | | `lib/scroll.ts` |
| 8502–8523 | 22 | const | `TALENTE_LIST_ID` | — | | `lib/scroll.ts` |
| 8524–8530 | 7 | fn | `scrollToSection` | — | | `lib/scroll.ts` |
| 8531–8598 | 68 | fn | `Layout` | `C`, `globalStyle`, `TopBanner`, `Navbar`, `MobileMenu`, `Footer`, `ScrollPopupForm`, `ApplyPopupContext` | | `Layout.tsx` |
| 8599–8645 | 47 | fn | `App` (default export) | `Layout`, `PROJECTS`, all 19 page components | | `App.tsx` |

---

## 3. Route table

All routes live in one nested `<Routes>` inside `Layout`, under a single outer `path="/*"`.

| Path | Element | Notes |
|---|---|---|
| `/` | `PageBallina` | |
| `/programim` | `PageProgramim` | wraps `ProgramPage` |
| `/siguria` | `PageSiguria` | wraps `ProgramPage` |
| `/trajnime` | `PageTrajnime` | live API |
| `/trajnime/:slug` | `PageTrajnimiDetal` | live API, renders `PublicApplicationForm` |
| `/forma/:slug` | `PageForma` | live API, renders `PublicApplicationForm` |
| `/biznese` | `PageBiznese` | |
| `/biznese/trajnime` | `PageBizneseTrajnime` | POSTs `kontakt-biznesi` |
| `/biznese/talente` | `PageBizneseTalente` | POSTs `kontakt-biznesi` |
| `/biznese/bursa` | `PageBizneseBursa` | |
| `/biznese/klasa` | `PageBiznestKlasa` | POSTs `rezervo-klase` |
| `/projektet` | `PageProjektet` | |
| `/projektet/skill-factory` | `ProjectDetailPage` | **generated** by `PROJECTS.map(...)` |
| `/projektet/usaid` | `ProjectDetailPage` | generated |
| `/projektet/sdc` | `ProjectDetailPage` | generated |
| `/projektet/wow` | `ProjectDetailPage` | generated |
| `/projektet/kode` | `ProjectDetailPage` | generated |
| `/projektet/rcf` | `ProjectDetailPage` | generated |
| `/projektet/luxdev` | `ProjectDetailPage` | generated |
| `/projektet/vic` | `ProjectDetailPage` | generated |
| `/lajme` | `PageLajme` | live API |
| `/lajme/:slug` | `PageArtikulli` | live API, **`dangerouslySetInnerHTML` + `renderSafeHtml`** |
| `/kontakti` | `PageKontakti` | POSTs `kontakt`; Google Maps `<iframe>` |
| `/rreth-nesh` | `PageRrethNesh` | |
| `/ekipi` | `PageEkipi` | |
| `/ligjërueit` | `PageLigjërueit` | **non-ASCII path** |
| `*` | `PageBallina` | catch-all renders the homepage, not a 404 |

**Route ordering matters and must be preserved byte-for-byte:** `/trajnime` before `/trajnime/:slug`, `/lajme` before `/lajme/:slug`, and the eight generated project routes between `/projektet` and `/lajme`. `App.tsx` is the last thing moved (step 14) and its `<Routes>` block is copy-pasted whole.

---

## 4. Shared-state map

There is very little cross-tree state. This is the whole picture:

### 4.1 `ApplyPopupContext` — the only React context

```
Layout (owns isPopupOpen + openPopup/closePopup)
  ├─ TopBanner            ← openPopup via prop
  ├─ Navbar               ← openPopup via prop
  ├─ Footer               ← openPopup via prop
  ├─ ApplyPopupContext.Provider value={openPopup}
  │    └─ <main>{children}</main>
  │         ├─ PageBallina   → useApplyPopup()
  │         └─ ProgramPage   → useApplyPopup()   (i.e. /programim, /siguria)
  └─ ScrollPopupForm      ← isOpen / onClose via prop
```

`ApplyPopupContext` and `useApplyPopup` must live in **their own module** (`hooks/apply-popup.tsx`), imported by both `Layout.tsx` and the two page modules. If they lived in `Layout.tsx`, `pages/* → Layout.tsx → pages/*` would be a cycle.

The default context value is a no-op (`() => {}`), deliberately, not a throw — preserve it.

### 4.2 Prop-drilled state in `Layout`

| State | Owner | Consumers |
|---|---|---|
| `showBanner` (always `true`, no setter) | `Layout` | `TopBanner`, `Navbar` (`showBanner` prop shifts the navbar's top offset) |
| `mobileMenuOpen` | `Layout` | `Navbar` (`setMobileMenuOpen`), `MobileMenu` (`open`, `onClose`) |
| `isPopupOpen` | `Layout` | `ScrollPopupForm` |
| `popupShownThisLoad` (ref) | `Layout` | the homepage-only scroll auto-trigger effect |
| `location` (`useLocation`) | `Layout` | closes the drawer on navigation; gates the auto-trigger to `/` |

All of this stays inside `Layout.tsx`. Nothing about it changes.

### 4.3 Per-page local state

Every page owns its own `useState` and its own fetch effect. There is no store, no query cache, no global mutable module state anywhere. `useBusinessLead` / `useClassBooking` / `useHasEnteredView` are self-contained.

### 4.4 Cross-tree data reads (why some data must be its own module)

| Data | Read by | Consequence |
|---|---|---|
| `PROJEKTET_LIST` | `layout/dropdowns` **and** `layout/MobileMenu` **and** `pages/ProjectDetailPage` | must be `data/`, not `layout/` — otherwise `pages → layout` |
| `PROJECTS` | `pages/PageProjektet`, `pages/ProjectDetailPage`, **and `App.tsx`** (route generation) | must be `data/` |
| `HERO_STATS` | `ui/HeroStats` and `sections/AboutStatsBand` | `data/` |
| `SEM_PROGRAMIM` | `data`, but also used as a **type** (`semesters: typeof SEM_PROGRAMIM`) by `SemesterTabs` and `ProgramPage` | must be exported, not just re-declared |
| `PARTNER_LOGOS` | `sections/InfiniteLogoMarquee` (default arg) and `pages/PageTrajnime` | `data/` |
| `PARTNER_LOGO_IMAGES` | `pages/ProgramPage` | `data/` |
| `TALENT_PEOPLE` avatars | also referenced individually in `PageBizneseTalente`'s hero avatar row | 5 imports duplicated across two modules — Vite resolves both to one asset, so this is safe |
| `trajnerAlban`, `trajnerAli`, `trajnereHana`, `lektorArditi` | in **both** `data/trainers.ts` and `data/lecturers.ts` | same — one asset, two importers |

---

## 5. Module-scope side effects and ordering hazards

### 5.1 ⚠ `DOMPurify.addHook` at line 401 — the single highest-risk item

```ts
DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  if ((data.attrName === "src" || data.attrName === "href") && /^data:/i.test(data.attrValue)) {
    data.keepAttr = false;
  }
});
```

Its own comment: *"Registered at module scope: DOMPurify hooks are global and cumulative, so adding this inside `renderSafeHtml` would stack a fresh copy on every render."*

Two failure modes to avoid:

1. **Registered twice** — if the hook ends up in a module that is somehow evaluated more than once, or is duplicated into two modules, `data:` URIs get filtered twice (harmless) but the hook array grows (leak). Mitigation: **exactly one** `addHook` call in the entire codebase, in `lib/sanitize.ts`, and `grep -rn "addHook" src/` after step 3 must return exactly 1 hit.
2. **Never registered** — if `renderSafeHtml` were split from the hook into a different module and only the function were imported, the hook module might be tree-shaken away and `data:` URIs would survive sanitisation. **This is a real security regression, and it is silent.** Mitigation: the hook, `ALLOWED_HTML_TAGS`, `ALLOWED_HTML_ATTR` and `renderSafeHtml` all go in **one** module. Since `renderSafeHtml` is in that module, importing it guarantees the module is evaluated and the hook runs.

Verification for step 3 is spelled out in §10.4.

### 5.2 ⚠ Temporal dead zone: `PROJEKTET_LIST` vs `HERO_PARTNERS`

Lines 833–836 carry an explicit note that `PROJEKTET_LIST` references its image imports **directly** rather than reading `HERO_PARTNERS`, *"because that const is declared further down the module and would still be in its temporal dead zone here"*.

Once these are two ES modules the TDZ hazard disappears. **Do not act on that.** The code and the comment move verbatim. Rewriting `PROJEKTET_LIST` to read `HERO_PARTNERS` would be a behaviour-neutral cleanup — and cleanups are out of scope.

### 5.3 ⚠ The iOS drawer fix

`MobileMenu`, ~line 976:

```tsx
<div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${...}`}>
```

`overflow-hidden` on the `fixed inset-0` wrapper is the fix for the iOS-only 384px horizontal scroll (Chrome does not count a `position: fixed` subtree toward `document.scrollWidth`; iOS Safari does). It must survive the move byte-for-byte, and the 375px overflow check in §10.3 must explicitly **include** `position: fixed` subtrees — the automated scan that missed this bug last time skipped them.

### 5.4 Import islands

`App.tsx` has three separate `../imports/*` blocks (top, 6972–7004, 7867–7886) plus a mid-file `lucide-react` import at line 418. ES imports hoist, so this works today. After the split each asset import lands in the module that uses it, and the islands disappear naturally. No behaviour change — Vite emits the same asset URLs.

### 5.5 Non-ASCII identifiers

`LIGJËRUEIT`, `PageLigjërueit` and the route `/ligjërueit` all contain `ë`.

- **Identifiers and the route string stay exactly as they are.**
- **File names will be ASCII**: `pages/PageLigjerueit.tsx` (exporting `PageLigjërueit`), `data/lecturers.ts`. Non-ASCII filenames on Windows + git are a known source of `core.quotepath` / NFC-vs-NFD grief and there is nothing to gain from them. The mismatch will be noted in a one-line comment at the top of the file.

### 5.6 `globalStyle` is injected five times

`Layout` renders `<style>{globalStyle}</style>`, and so do `PageBizneseTrajnime`, `PageBizneseTalente`, `PageBizneseBursa` and `PageBiznestKlasa`. That means five identical `<style>` tags in the DOM on those four routes. This is current behaviour; **all five stay**. Listed as a finding in §7.

---

## 6. Duplicates and dead code (found, not touched)

| Item | Status |
|---|---|
| `src/app/components/ui/*` — 48 shadcn components | Imported by **nothing**. `App.tsx` mentions `carousel.tsx` only inside a comment. Entirely dead relative to the shipped app. Left in place. |
| `src/app/components/figma/ImageWithFallback.tsx` | Same — dead. |
| `motion` (12.23.24) in `package.json` | Imported nowhere in `src/`; the `AboutStatsBand` comment says so explicitly and hand-rolls the count-up instead. |
| `@mui/*`, `react-slick`, `recharts`, `react-dnd`, `vaul`, `cmdk`, `sonner`, `canvas-confetti`, `input-otp`, `react-day-picker`, `react-responsive-masonry`, `react-hook-form`, `react-popper`, `next-themes` | All present in `dependencies`, all reachable only through the dead `components/ui/*` tree. Not my call to remove in a structural refactor. |
| `globalStyle` rendered 5× | See §5.6. |
| `PROJECT_FALLBACK_GALLERY` + the Unsplash fallback in `ProjectDetailPage` (`project.mainImg ?? "https://images.unsplash.com/..."`) | Both branches are now unreachable — every project has `mainImg` and `gallery`. Kept deliberately (documented in comments) so a newly added project still renders. |
| `PageRrethNesh` "Historia jonë" image | **Not** a fallback: a live `https://images.unsplash.com/...` URL is the actual production image, flagged as PLACEHOLDER in its own comment. |
| No fully unreferenced top-level declaration | Verified across all 161. |

---

## 7. Bugs found — LISTED, NOT FIXED

Ordered roughly by consequence.

1. **`pnpm build` does not typecheck.** `"build": "vite build"`. Type errors, missing exports and broken imports ship silently. (§0.1)
2. **`text-2x1` typo — line 5152**, `PageTrajnimiDetal`, the "Rolet e punës që mund t'i fitosh" heading: `className="text-2x1 font-bold mb-5"`. Digit `1` for letter `l`. Tailwind emits no rule, so this `<h2>` renders at the default `<h2>` size instead of `text-2xl`. Every sibling heading on the page uses `text-2xl`.
3. **`text-0.5g` typo — line ~8453**, `PageLigjërueit` intro paragraph: `className="text-0.5g"`. Not a valid class in any Tailwind version; emits nothing.
4. **`TALENT_CATEGORIES` skill strings are attached to the wrong roles** — "UI/UX Designers" reads *"Penetration testing, SOC, incident response"* and "Network Engineers" reads *"Figma, prototyping, user research"*. These two are swapped, and neither matches its role. Already flagged in a `⚠` comment in the source; it predates this work and is visible on `/biznese/talente`.
5. **`ProgramPage` declares a required prop `to: string` that its body never reads.** Both callers pass it (`to="/programim"`, `to="/siguria"`). Dead required prop.
6. **Two room accent colours fail WCAG AA contrast on white**, documented in the source with measured ratios: `#FAA700` (Klasa Portokalli) at 1.98:1 and `#FFC726` (Klasa e verdhë) at 1.56:1 against a 3:1 large-text requirement. The comment names passing alternatives (`#C77A00`, `#B8860B`) and says they were kept on purpose to match the rooms' real colours.
7. **`PageRrethNesh` ships a remote Unsplash image in production** for the "Historia jonë" mosaic panel — a third-party URL on a first-party page, with the privacy and availability exposure that implies. Flagged as PLACEHOLDER in its own comment.
8. **Component name typo: `PageBiznestKlasa`** (should be `PageBizneseKlasa` to match its three siblings). Cosmetic; a rename is out of scope for this task.
9. **Arrays rebuilt on every render inside components**: `BUSINESS_OFFERINGS` in `PageBiznese`, `faqs` in `PageBizneseTrajnime`, the rooms array in `PageBiznestKlasa`, the spec/gallery arrays, the `cities` array in `PageEkipi`. Harmless at this scale, but they are data and every other data table in this file is module-scope.
10. **`PageBiznese` has an orphaned comment** at lines 5464–5466 — *"Partner logos, directly above the closing CTA…"* — followed by nothing. The section it describes does not exist.
11. **`PageBiznestKlasa` numbering skips section 8** (7 → 9), with an empty gap at line ~7005 where it used to be.
12. **`TESTIMONIALS` `skills`/quote data and `BURSA_SPONSORS` scholarship counts are placeholders** — the sponsor logos are real, the "20x Bursa" figures are not. Flagged in-source.
13. **`ProgramPage`'s `imgPosition` default is `center 20%`**, but both callers pass an explicit value, so the default is unreachable. (Documented as deliberate — `/siguria` was made to state its value rather than inherit.)

None of these are touched in Phase 2.

---

## 8. Proposed folder structure

Note the deliberate avoidance of `src/app/components/` — that name is already taken by the dead shadcn tree, and putting hand-rolled primitives inside `components/ui/` next to shadcn's `components/ui/button.tsx` would be actively confusing.

```
src/app/
├── App.tsx                          ~50   routing only
├── Layout.tsx                       ~70
├── theme.ts                        ~105   C, globalStyle
│
├── lib/
│   ├── sanitize.ts                  ~95   ⚠ owns the DOMPurify hook
│   ├── phone.ts                     ~21
│   ├── dates.ts                     ~61
│   ├── training-labels.ts           ~49
│   ├── cities.ts                    ~25
│   └── scroll.ts                    ~30
│
├── hooks/
│   ├── apply-popup.tsx              ~12   ApplyPopupContext + useApplyPopup
│   ├── useBusinessLead.ts           ~60
│   ├── useClassBooking.ts           ~54
│   └── useHasEnteredView.ts         ~40
│
├── data/
│   ├── hero-stats.ts                 ~7
│   ├── socials.ts                   ~38   SOCIAL_URLS, SocialLink, FOOTER_SOCIALS, CONTACT_SOCIALS, FOOTER_LINKS
│   ├── projektet-list.ts            ~19   + 8 image imports
│   ├── hero-partners.ts             ~15   + 6
│   ├── partner-logos.ts             ~69   MarqueeLogo, PARTNER_LOGOS, PARTNER_LOGO_IMAGES + 26
│   ├── student-photos.ts            ~45   + 9
│   ├── testimonials.ts              ~50
│   ├── semesters.ts                 ~94
│   ├── trainers.ts                  ~26   + 4
│   ├── talents.ts                  ~107   + 12
│   ├── bursa-sponsors.ts            ~16   + 3
│   ├── projects.ts                 ~241   PROJECTS + PROJECT_FALLBACK_GALLERY + 30
│   ├── team.ts                      ~71   + 21
│   ├── lecturers.ts                 ~57   + 19 (4 shared with trainers.ts)
│   └── about.ts                     ~30
│
├── ui/                                    hand-rolled primitives
│   ├── buttons.tsx                  ~47   PrimaryBtn, SecondaryBtn, GhostBtn
│   ├── Overline.tsx                 ~12
│   ├── MetaChip.tsx                  ~8
│   ├── Breadcrumb.tsx               ~17
│   ├── FormField.tsx                ~45   FormField + FormSelect
│   ├── PageWrapper.tsx              ~13
│   ├── HeroStats.tsx                ~16
│   └── TrainingStatusBadge.tsx      ~20
│
├── layout/
│   ├── TopBanner.tsx                ~50
│   ├── Navbar.tsx                  ~167   Navbar + DropdownId
│   ├── dropdowns.tsx               ~153   DropdownStudime/Projektet/Biznese/Rreth
│   ├── MobileMenu.tsx              ~144   MobileMenu + AccordionMobile   ⚠ iOS fix
│   ├── Footer.tsx                  ~182
│   └── TikTokIcon.tsx               ~25
│
├── forms/
│   ├── popup-config.ts              ~36
│   ├── answers.ts                   ~71
│   ├── ApplyFieldShell.tsx          ~42
│   ├── PublicFormFieldShell.tsx     ~32
│   ├── ScrollPopupForm.tsx         ~309
│   ├── HorizontalApplicationBand.tsx ~527
│   └── PublicApplicationForm.tsx   ~387
│
├── cards/
│   ├── ArticleCard.tsx              ~26
│   ├── PersonCard.tsx               ~71
│   ├── ProjectCard.tsx              ~20
│   ├── TrainingCard.tsx             ~42
│   ├── TalentCard.tsx              ~132   + TALENT_AVATAR_RING
│   └── LogoCard.tsx                 ~39
│
├── sections/
│   ├── RotatingWord.tsx             ~29
│   ├── SuccessCarousel.tsx          ~67
│   ├── PartnerLogoGrid.tsx          ~39
│   ├── StudimeProfesionaleSection.tsx ~175
│   ├── TrajnimePromoSection.tsx    ~169
│   ├── TestimonialsSection.tsx     ~127
│   ├── InfiniteLogoMarquee.tsx      ~49
│   ├── SemesterTabs.tsx            ~109
│   ├── FilterRow.tsx                ~32
│   ├── TalentCarousel.tsx          ~146
│   └── AboutStatsBand.tsx          ~121   + COUNT_UP_MS, splitStatValue, CountUpValue
│
├── pages/
│   ├── PageBallina.tsx              ~93
│   ├── ProgramPage.tsx             ~202
│   ├── PageProgramim.tsx            ~60
│   ├── PageSiguria.tsx              ~58
│   ├── PageTrajnime.tsx            ~258
│   ├── PageTrajnimiDetal.tsx       ~338
│   ├── PageForma.tsx                ~69
│   ├── PageBiznese.tsx             ~208
│   ├── PageBizneseTrajnime.tsx     ~240
│   ├── PageBizneseTalente.tsx      ~211
│   ├── PageBizneseBursa.tsx        ~209
│   ├── PageBiznestKlasa.tsx        ~341
│   ├── PageProjektet.tsx            ~58
│   ├── ProjectDetailPage.tsx       ~191
│   ├── PageLajme.tsx               ~107
│   ├── PageArtikulli.tsx           ~141
│   ├── PageKontakti.tsx            ~174
│   ├── PageRrethNesh.tsx           ~252
│   ├── PageEkipi.tsx                ~27
│   └── PageLigjerueit.tsx           ~43
│
└── components/                       UNTOUCHED (existing, dead)
    ├── ui/ …                         48 shadcn files
    └── figma/ImageWithFallback.tsx
```

**85 new files** (2 root + 6 `lib` + 4 `hooks` + 15 `data` + 8 `ui` + 6 `layout` + 7 `forms` + 6 `cards` + 11 `sections` + 20 `pages`), plus `App.tsx` reduced to ~50 lines. **Largest new file is `HorizontalApplicationBand.tsx` at ~527 lines** — under the 800-line ceiling but above the 200–400 comfort band. It is one component and splitting it further would mean restructuring, which is not this task.

Import-direction rule (no cycles by construction):

```
App.tsx  →  Layout, pages/*, data/projects
Layout   →  layout/*, forms/ScrollPopupForm, hooks/apply-popup, theme
pages/*  →  sections/*, forms/*, cards/*, ui/*, hooks/*, lib/*, data/*, theme
sections/→  cards/*, ui/*, lib/*, data/*, theme
cards/*  →  ui/*, lib/*, data/*, theme
forms/*  →  ui/*, lib/*, theme
layout/* →  ui/*, data/*, theme
ui/*     →  data/*, lib/*, theme
hooks/*  →  lib/*
data/*   →  layout/TikTokIcon (socials.ts only), lucide-react, ../imports/*
lib/*    →  (leaf; sanitize.ts → dompurify)
theme.ts →  (leaf)
```

The one upward edge is `data/socials.ts → layout/TikTokIcon.tsx`, because `FOOTER_SOCIALS` embeds the icon component. `TikTokIcon` imports nothing but React, so there is no cycle. (The alternative — moving `TikTokIcon` into `ui/` — would be a rename-by-relocation of something that is unambiguously a layout icon. Either is defensible; say if you prefer `ui/`.)

---

## 9. Migration order — 14 steps, one commit each

Lowest risk first; every step leaves the tree building and the app running. Gate after **every** step: `pnpm typecheck && pnpm build` both exit 0.

| # | Commit message | Creates | Moves out of App.tsx | App.tsx after | Risk |
|---|---|---|---|---|---|
| 1 | `split: theme tokens` | `theme.ts` | `C`, `globalStyle` (105 lines) | 8,540 | Low mechanically, but ~140 references rewrite to an import. Pure `tsc` catch. |
| 2 | `split: pure utils` | `lib/phone.ts`, `lib/dates.ts`, `lib/training-labels.ts`, `lib/cities.ts`, `lib/scroll.ts` | 15 decls (~185 lines) | ~8,355 | Low. All leaf functions, no JSX. |
| 3 | `split: html sanitisation` | `lib/sanitize.ts` | `ALLOWED_HTML_TAGS`, `ALLOWED_HTML_ATTR`, the `DOMPurify.addHook` block, `renderSafeHtml` (~95 lines) | ~8,260 | **HIGH.** Module-scope side effect. §5.1 + §10.4. |
| 4 | `split: hooks` | `hooks/apply-popup.tsx`, `hooks/useBusinessLead.ts`, `hooks/useClassBooking.ts`, `hooks/useHasEnteredView.ts` | 6 decls (~166 lines) | ~8,095 | Medium — the context must be a standalone module or step 14 deadlocks. |
| 5 | `split: static data` | 15 files under `data/` | 25 decls + **148 image imports** (~900 lines) | ~7,190 | Medium. High volume, zero logic. The 4 assets shared by `trainers.ts`/`lecturers.ts` and the 5 shared by `talents.ts`/`PageBizneseTalente` are duplicate `import` statements, one asset each. |
| 6 | `split: ui primitives` | 8 files under `ui/` | 11 decls (~180 lines) | ~7,010 | Low. |
| 7 | `split: layout chrome` | 6 files under `layout/` | 10 decls (~720 lines) | ~6,290 | Medium. ⚠ carries the drawer `overflow-hidden` fix and all `aria-*`/active-state logic. |
| 8 | `split: form engine` | 7 files under `forms/` | 20 decls (~1,400 lines) | ~4,890 | **HIGH by volume.** Three of the file's five largest components. Every `submitPublicForm` call site. |
| 9 | `split: cards` | 6 files under `cards/` | 7 decls (~330 lines) | ~4,560 | Low. |
| 10 | `split: sections` | 11 files under `sections/` | 17 decls (~1,060 lines) | ~3,500 | Medium. |
| 11 | `split: pages — home, programmes, trajnime` | `PageBallina`, `ProgramPage`, `PageProgramim`, `PageSiguria`, `PageTrajnime`, `PageTrajnimiDetal`, `PageForma` | 9 decls (~1,080 lines) | ~2,420 | Medium. |
| 12 | `split: pages — biznese` | `PageBiznese`, `PageBizneseTrajnime`, `PageBizneseTalente`, `PageBizneseBursa`, `PageBiznestKlasa` | 12 decls (~1,190 lines) | ~1,230 | Medium. 43 image imports move with `PageBiznestKlasa` alone. |
| 13 | `split: pages — projects, lajme, kontakti, rreth` | `PageProjektet`, `ProjectDetailPage`, `PageLajme`, `PageArtikulli`, `PageKontakti`, `PageRrethNesh`, `PageEkipi`, `PageLigjerueit` | 10 decls (~860 lines) | ~370 | Medium. |
| 14 | `split: Layout + App routing` | `Layout.tsx`; `App.tsx` reduced to routing | `Layout`, `App` | **~50** | Medium. The `<Routes>` block is copied whole; ordering is load-bearing. |

Steps 11–13 split the page migration into three commits rather than one so a DOM regression bisects to seven pages rather than twenty.

**Baseline capture happens before step 1** (§10.1) and the DOM/screenshot diff runs after **every** step, not only at the end. That is the only way "any DOM diff other than whitespace = stop" is actionable — otherwise a regression at step 3 is discovered at step 14 with 11 commits on top of it.

---

## 10. Verification strategy

### 10.1 Baseline (before step 1)

`split-app-tsx` currently has zero commits on top of `main`, so the working tree **is** `main`. Baseline is captured now, from this tree, and stored under `cacttus-edu-front/.split-baseline/` (added to `.gitignore`, never committed).

Captured per route × per viewport:

- **`dom.txt`** — `document.documentElement.outerHTML`, normalised (see §10.2).
- **`shot.png`** — full-page screenshot.
- **`overflow.json`** — `document.scrollWidth`, `documentElement.clientWidth`, and the worst-offending element's `getBoundingClientRect().right`, **including `position: fixed` subtrees**.

Viewports: **375×812** and **1280×800**, set via `browser.newContext({ viewport })` — a real CSS viewport, not `resize_window`, which has proven unreliable in this environment.

Routes: all 26 in §3, using `/trajnime/<a real slug>`, `/lajme/<a real slug>` and `/forma/aplikim-studime-profesionale` for the three dynamic ones.

### 10.2 Making the diff deterministic

Four sources of noise, each handled:

| Noise | Handling |
|---|---|
| **Live API data changing between runs** | Record every `GET /api/public/**` response once, into `.split-baseline/api/`. Every subsequent run replays them through Playwright `page.route()`. The backend is then irrelevant to the diff and the comparison is exact. |
| **Vite asset content-hashes** | Assets are byte-identical across the refactor, so hashes should not move — but chunk names will (that is the point of the split). Normalise `/assets/<name>-<8hex>.<ext>` → `/assets/<name>.<ext>` in `dom.txt` only. |
| **React `useId` / random ids** | Normalise `«r…»`-style ids to a placeholder. |
| **Whitespace / attribute order** | Serialise via a normaliser: lowercase tag names, sort attributes, collapse runs of whitespace in text nodes. Whitespace-only diffs are explicitly permitted by the brief; sorting attributes removes JSX-ordering noise that is not a behaviour change either. Everything else is a hard stop. |

Time-dependent output: `formatPostDate` and `formatTrainingDate` render absolute dates from API data (now frozen by the replay), so no clock freezing is needed. The homepage `RotatingWord` and `SuccessCarousel` animate on timers — screenshots for `/` are taken after a fixed settle and the rotating word's text node is normalised out of `dom.txt`.

### 10.3 Horizontal overflow at 375px

Run on every route, both before and after, and **the scan must not skip `position: fixed`**:

```js
const vw = document.documentElement.clientWidth;
const bad = [...document.querySelectorAll('*')]
  .map(el => ({ el, r: el.getBoundingClientRect().right }))
  .filter(x => x.r > vw + 1)                 // no fixed/absolute exclusion
  .sort((a, b) => b.r - a.r);
```

Report `document.scrollWidth` alongside. Pass = `scrollWidth <= clientWidth` **and** the worst `right` is unchanged from baseline. A `worstRight` of `viewport + 384` on any route means the drawer wrapper lost its `overflow-hidden` — that is the exact signature of the bug that was fixed here before, and it is the reason this check exists in this shape.

### 10.4 Security invariants (checked after step 3, and again at the end)

| Invariant | Check |
|---|---|
| Exactly one DOMPurify hook registration | `grep -rn "addHook" cacttus-edu-front/src` returns exactly **1** line |
| The hook actually runs | On `/lajme/<slug>`, evaluate `DOMPurify.sanitize('<img src="data:text/html,x">')` in page context via the same import path and assert the `src` is stripped. Also assert the rendered `.post-body` contains no `src^="data:"` / `href^="data:"`. |
| `renderSafeHtml` config unchanged | Diff the four options (`ALLOWED_TAGS`, `ALLOWED_ATTR`, `ALLOWED_URI_REGEXP`, `ADD_URI_SAFE_ATTR`) against the pre-split source, character for character |
| Only one `dangerouslySetInnerHTML` in the app | `grep -rn "dangerouslySetInnerHTML" src` returns exactly **1** (`PageArtikulli`) |
| `credentials: 'omit'` intact | `grep -n "credentials" src/marketing/lib/public-api.ts` — one hit, `'omit'`. `public-api.ts` is not touched by any step; `git diff main -- src/marketing/` must be **empty** at the end. |
| No cookie/auth code leaked into marketing | `git diff main --stat` shows changes only under `src/app/` |

### 10.5 Form wiring

For each of the six public forms, drive the UI to submit with valid dummy values under `page.route()` **interception with `route.abort()`** — the request is asserted and then killed, so no `Submission` row is ever created.

| Form | Route | Expected `POST` path | Expected top-level keys |
|---|---|---|---|
| Application band | `/`, `/programim`, `/siguria`, `/rreth-nesh` | `/api/public/forms/aplikim-studime-profesionale/submissions` | `name`, `email`, `phone`, `data` |
| Scroll popup | any (Layout) | `…/aplikim-studime-profesionale/…` | same |
| Contact | `/kontakti` | `…/kontakt/…` | `data.subjekti`, `data.mesazhi` |
| Business — trainings | `/biznese/trajnime` | `…/kontakt-biznesi/…` | `data.tipi_kerkeses = "Trajnime të personalizuara"`, `data.kompania` |
| Business — partnership | `/biznese/talente` | `…/kontakt-biznesi/…` | `data.tipi_kerkeses = "Partneritet / Punëdhënës"`, `data.kompania`, `data.fusha_interesit` |
| Class booking | `/biznese/klasa` | `…/rezervo-klase/…` | `data.klasa`, `data.data_deshiruar`, `data.nr_personave`, `data.shenime` |
| Training detail | `/trajnime/<slug>` | the slug from `training.form.slug` | `name`, `email`, `phone`, `data`, `trainingId` |

Also assert the request has **no `Cookie` header** and that `credentials` is `omit` (observable as no cookies being attached).

### 10.6 Bundle size

`pnpm build` before step 1 and after step 14; record total `dist/assets` bytes, the JS chunk count, and per-chunk gzip sizes. Expected outcome: **total roughly unchanged**, chunk count unchanged (the split is compile-time only — no `React.lazy`, no dynamic `import()`, so Rollup still emits one app chunk). A large swing either way means something was dropped or duplicated and is treated as a failure.

### 10.7 Manual pass (once, after step 14)

Automation cannot see everything. One human pass at 375px and 1280px over: the navbar dropdowns opening/closing and their active states, the mobile drawer open/close, the scroll popup auto-trigger on `/` (two downward scroll bursts), the semester stepper on `/programim` and `/siguria`, the talent carousel swipe on `/biznese/talente`, and the testimonials embla carousel.

### 10.8 Stop conditions

Stop and report immediately, without continuing to the next step, on any of:

- `pnpm typecheck` or `pnpm build` non-zero
- any non-whitespace DOM diff on any route at either viewport
- any screenshot pixel diff above a 0.1% threshold that is not explained by an animation frame
- `document.scrollWidth > clientWidth` at 375px on any route
- `grep addHook` returning anything other than 1
- any form POSTing to a different slug or shedding a `data` key
- `git diff main -- src/marketing/` non-empty

---

## 11. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **DOMPurify hook silently dropped** (tree-shaken or never imported) → `data:` URIs survive sanitisation on `/lajme/:slug` | Low | **Critical, silent** | Hook co-located with its only consumer; explicit runtime assertion in §10.4; `grep addHook == 1` |
| 2 | **`pnpm build` passes while the app is broken**, because Vite does not typecheck | High if unaddressed | High | Gate is `pnpm typecheck && pnpm build`, both steps, every commit |
| 3 | **iOS drawer `overflow-hidden` lost** in the `MobileMenu` move → 384px horizontal scroll returns on iOS only | Low | High (invisible in Chrome) | 375px overflow scan that includes `position: fixed`; class-string diff of the wrapper `<div>` against the baseline |
| 4 | **Circular import** `pages ↔ Layout` via `ApplyPopupContext` | Medium if done naively | High (blank page at runtime, builds fine) | Context lives in its own leaf module (`hooks/apply-popup.tsx`), moved at step 4 before any page moves |
| 5 | **An asset import gets lost** among 150 moves → broken image | Medium | Medium | Today: 150 import statements, 150 **distinct** asset paths (verified). After the split the statement count rises, because some assets are imported by two modules — so the invariant is on the **set of distinct paths**, which must still be exactly those 150. Check: collect `"../../imports/…"` across all of `src/app/**`, `sort -u`, diff against the baseline list. Screenshot diff catches any that slips through. |
| 6 | **Route order changes** (e.g. `/trajnime/:slug` ahead of `/trajnime`) | Low | High | `<Routes>` copied as one block; route-by-route DOM diff at step 14 |
| 7 | **`typeof SEM_PROGRAMIM` / `typeof PROJECTS[0]` prop types break** across module boundaries | Medium | Low (caught by `tsc`) | Export the consts, not just the values; step 5 lands before any consumer |
| 8 | **A comment gets orphaned from its code** — this file's comments carry measured values and rejected alternatives, and losing that context is a real (if slow-acting) loss | Medium | Medium | Move by line range, not by symbol; leading comment block always travels with its declaration; final `git diff main -- src/app/App.tsx` reviewed for any comment that has no new home |
| 9 | **`globalStyle` accidentally de-duplicated** ("obviously it should only be injected once") | Medium | Low but it is a behaviour change | Explicit rule: all five `<style>{globalStyle}</style>` sites stay |
| 10 | **The temporal-dead-zone workaround gets "cleaned up"** (§5.2) | Medium | Low but out of scope | Explicit rule: `PROJEKTET_LIST` keeps its direct image references |
| 11 | **Non-ASCII filename trouble on Windows/git** | Low | Medium | ASCII filenames; non-ASCII identifiers and route strings unchanged |
| 12 | **API data changes mid-verification**, producing a false DOM diff | High if unaddressed | Medium (wasted investigation) | Recorded-and-replayed API fixtures (§10.2) |
| 13 | **`HorizontalApplicationBand` (527 lines) or `PublicApplicationForm` (387) gets subtly reflowed** during a large paste | Medium | High | Move by exact line range with `sed`, not by retyping; verify with `git show` that the moved block's content hash matches the original range |

---

## 12. What I need from you

1. **Approval to proceed to Phase 2** as ordered above.
2. **A decision on the build gate** (§0.1): confirm `pnpm typecheck && pnpm build` as the per-step gate, or tell me to change the `build` script.
3. **`TikTokIcon` placement** (§8): `layout/TikTokIcon.tsx` (my proposal, keeps the one upward import edge) or `ui/TikTokIcon.tsx` (removes it). Either is fine; I default to `layout/` if you say nothing.
4. Confirmation that the backend can be running for the one-time API fixture recording (§10.2). If it cannot, I will hand-author the fixtures from the type definitions in `public-api.ts` and say so.

Nothing moves until you say go.
