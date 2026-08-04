You are redesigning specific parts of an existing website for CACTTUS EDUCATION, a professional technology education
  institution in Kosovo. The site is in Albanian.

  === ABSOLUTE RULE ===
  Change ONLY the items listed below. Every page, section, component, color, font, image and piece of copy that is NOT
  explicitly mentioned in this brief must stay exactly as it is. Do not "improve" anything I did not ask about. Do not restyle
  the header, footer, hero, or any other section beyond what is listed.

  === BRAND SYSTEM (use for anything new you create) ===
  - Primary purple: #823685
  - Secondary purple: #91478d
  - Base / background: #FFFFFF
  - Light theme only — never produce a dark variant
  - Typeface: Publica Sans (fallback: a clean geometric sans)
  - Tone: professional, confident, career-focused, modern. Not playful, not childish.
  - Visual language: generous white space, soft rounded corners, thin 1px purple-tinted borders, subtle shadows, purple accents
  used sparingly as highlight — not large purple blocks.
  - All on-page copy must be written in ALBANIAN.

  =====================================================================
  PART 1 — GLOBAL CHANGES (apply across the whole site)
  =====================================================================

  1.1 — SLIM ANNOUNCEMENT BANNER ("20%" promo bar)
  The thin full-width banner at the very top currently uses ORANGE. Orange clashes with the brand. Replace it.
  - New background: deep brand purple #823685 (solid), OR a very soft purple tint #F4EAF5 with #823685 text — choose the
  variant that sits more comfortably above the existing header.
  - Text: white if the background is #823685; #6A2A6D if the background is the soft tint.
  - Keep the banner's existing height, existing copy, existing button, and existing dismiss "×". Only the colors change.
  - The inline CTA button inside the banner: white/transparent background with a 1px border and a subtle hover fill. Keep it
  small and slim.
  - Do not make the banner taller, do not add icons, do not change its wording.

  1.2 — NAVIGATION BAR
  Add a "Rreth Nesh" link to the navigation bar, positioned IMMEDIATELY BEFORE "Kontakti".
  - Final order of the affected part of the nav: ... → Rreth Nesh → Kontakti
  - Style "Rreth Nesh" identically to the other existing nav links (same font size, weight, color, spacing, hover state).
  - Change nothing else in the nav — same logo, same other links, same layout, same mobile menu behaviour (just include Rreth
  Nesh in the mobile menu in the same position).

  =====================================================================
  PART 2 — HOME PAGE
  =====================================================================

  2.1 — REDESIGN THE SECOND SECTION (currently just a wall of photos)
  Problem: the second section of the home page is literally nothing but images. It communicates nothing and looks unfinished.
  Replace it with a real, content-driven section about STUDIME PROFESIONALE (professional 2-year studies).

  Build it like this:
  - Section eyebrow (small uppercase label, letter-spaced, #823685): "STUDIME PROFESIONALE"
  - Section heading (large, bold, dark charcoal #1A1A1A): a strong Albanian headline about becoming job-ready in technology
  through accredited 2-year professional studies.
  - Supporting paragraph: 2 short sentences, max ~40 words, muted grey #5A5A5A.
  - Then a TWO-COLUMN layout:
    • LEFT (55%): two program cards stacked vertically. Each card = white background, 1px #E9DCEA border, 16px radius, 28px
  padding, soft shadow on hover, and a small purple icon badge (48×48, #F4EAF5 background, #823685 icon). Card contents:
        Card 1 — "Zhvillues i Ueb-it dhe Aplikacioneve Mobile"
          One-line description + 3 small pill tags (e.g. programim, zhvillim uebi, aplikacione mobile)
          Meta row: duration, diploma level, accreditation
          Text link CTA in purple with an arrow: "Mëso më shumë →"
        Card 2 — "Siguria Kibernetike"
          One-line description + 3 pill tags (mbrojtje sistemesh, analizë rreziqesh, incidente kibernetike)
          Same meta row + same CTA style.
    • RIGHT (45%): a single tall vertical image of students working in a real classroom/lab, 20px radius, with a floating white
  "proof card" overlapping its bottom-left corner. The proof card contains 2–3 key stats stacked (large purple number + small
  grey label underneath), e.g. graduate employment rate, number of partner companies, number of graduates.
  - Below the two columns, a single full-width thin strip listing 4 short reassurance points in one row, separated by thin
  dividers, each with a small purple check icon (e.g. accredited program, practice-first teaching, industry lecturers, career
  support).
  - Mobile: stack to a single column, image moves below the cards, the 4-point strip becomes a 2×2 grid.
  - Keep at most ONE photograph in this section. The section must be led by text and structure, not by imagery.

  2.2 — "AFTËSOHU SHPEJT — NË MUAJ, JO VITE" SECTION
  This section currently has 3 boxes. Add a FOURTH box for a training so the row contains 4 boxes total.
  - The new box must be visually identical to the existing three: same size, same padding, same border, same radius, same icon
  treatment, same hover behaviour, same CTA style. It is a clone in style, new in content only.
  - Give it a distinct training topic that complements the existing three, with a short Albanian title, a one-line description,
  and the same meta info the other boxes show (duration / format).
  - Change the grid so all 4 sit evenly: 4 columns on desktop, 2×2 on tablet, 1 column stacked on mobile.
  - Do not change the section heading, the intro copy, or the existing three boxes.

  2.3 — APPLICATION FORM → HORIZONTAL "NEWSLETTER STYLE" SECTION
  Replace the current tall, wide, vertically-stacked application form with a compact HORIZONTAL band, like a premium newsletter
  signup strip.

  Design it like this:
  - One full-width band with a soft purple background (#F7F1F8) or a subtle #823685 → #91478d gradient, generous vertical
  padding (~72px), 24px radius if it is an inset card rather than edge-to-edge.
  - LEFT side (~40%): short bold heading + one supporting line of Albanian copy inviting the visitor to apply.
  - RIGHT side (~60%): the form fields laid out IN A SINGLE HORIZONTAL ROW — Emri, Email, Telefoni, a Programi dropdown, and a
  solid purple submit button labeled "Apliko tani". All inputs are pill-shaped or 12px-radius, white background, no visible
  heavy borders, equal height (~52px), aligned on one baseline.
  - Below the row, one small line of fine print in muted grey about being contacted / privacy.
  - Tablet: fields wrap to two rows, button full width. Mobile: fields stack vertically, button full width, heading centered
  above.
  - This must read as ONE horizontal strip, not as a form page. Keep it visually light and short in height.
  - Keep the same fields and the same submit action as the current form — only the layout and styling change.

  =====================================================================
  PART 3 — "STUDIME PROFESIONALE" PAGE
  =====================================================================

  3.1 — "PLANI MËSIMOR" SECTION — MAKE THE SEMESTER CIRCLES INTERACTIVE
  This section has 4 circles labeled Semestri 1, Semestri 2, Semestri 3, Semestri 4, with the curriculum content displayed
  underneath.
  Turn the circles into a working tab/selector control:
  - All four circles are clickable. Clicking a circle loads THAT semester's curriculum into the content area directly beneath
  the circles. Clicking Semestri 1 shows the Semester 1 plan-program, Semestri 2 shows Semester 2, and so on for all four.
  - Default state on page load: Semestri 1 is selected.
  - ACTIVE circle: filled #823685, white text, slightly larger scale, soft purple glow ring around it.
  - INACTIVE circles: white fill, 2px #E4D3E6 border, #823685 text.
  - HOVER on inactive: border darkens to #823685, subtle lift.
  - Show a thin horizontal connector line running behind the four circles to communicate progression; the portion up to the
  active circle is filled purple, the rest is light grey.
  - Each circle needs a visible cursor pointer, a focus ring for keyboard users, and must be operable with Enter/Space and
  left/right arrow keys.
  - The curriculum panel below changes with a soft crossfade / slide-up transition (~200ms). It should not jump the page scroll
  position.
  - Curriculum panel layout: semester title + total ECTS on top, then the subject list as clean rows — subject name on the
  left, hours and ECTS right-aligned, thin dividers between rows, alternating very light purple row tint. Each semester has its
  own distinct subject list.
  - Mobile: the four circles stay in one horizontal row (shrink them if needed) or become a horizontally scrollable row — never
  stack them vertically.

  3.2 — "KU PUNOJNË TË DIPLOMUARIT TANË" SECTION — INFINITE LOGO LOOP
  Replace the current static logo arrangement with a continuously scrolling infinite marquee, because there are many partner
  logos.
  - Two rows of logos scrolling horizontally, forever, with no visible start or end (seamless loop).
  - Row 1 scrolls right-to-left, Row 2 scrolls left-to-right, at a slow, calm speed (~35–45 seconds per full cycle). The
  opposing directions add motion without feeling frantic.
  - Logos are rendered greyscale at ~60% opacity; on hover a logo becomes full color at 100% opacity and lifts slightly. Pause
  the animation on hover.
  - Each logo sits in a white card, ~180×90, 12px radius, 1px #EEE8EF border, logo centered with padding so all logos read at a
  consistent optical size regardless of their aspect ratio.
  - Add a soft white fade-out gradient mask on the left and right edges of the section so logos fade in and out rather than
  getting cut off.
  - The layout must accept an arbitrary number of logos — adding more logos should simply extend the loop, never break the
  layout.
  - Keep the existing section heading "Ku punojnë të diplomuarit tanë" and any existing supporting line above it.
  - Mobile: keep both rows, reduce card size, speed up slightly.

  3.3 — SWAP THE APPLICATION FORM
  Replace this page's current application form with the SAME horizontal newsletter-style band specified in 2.3. It must be
  pixel-consistent with the home page version — identical layout, colors, field styling, spacing and button. Reuse it as one
  shared component.

  =====================================================================
  PART 4 — "TRAJNIME PROFESIONALE" PAGE
  =====================================================================

  4.1 — LABEL THE FILTERS IN THE SECOND SECTION
  The second section starts immediately with filter chips for trainings and for cities, with no explanation of what the user is
  looking at. Add clear labels.
  - Above / before the row of training filter chips, add a bold label: "Trajnimet:"
  - Above / before the row of city filter chips, add a bold label: "Qyteti:"
  - Label styling: Publica Sans semi-bold, ~15px, color #1A1A1A, with ~12px of space between the label and its chips.
  - Desktop: place each label inline on the left of its own chip row, vertically centered, with the chips flowing to its right.
  Mobile: label sits on its own line directly above its chips.
  - Keep the two filter groups on separate rows, clearly separated by ~20px of vertical space, so it is obvious that
  "Trajnimet:" governs the training chips and "Qyteti:" governs the city chips.
  - Do not change the chips themselves, their behaviour, their active states, or the results grid below.

  =====================================================================
  PART 5 — "PËR BIZNESE" SUBPAGES
  =====================================================================

  RIGHT NOW all four subpages under "Për Biznese" use the SAME generic template. That is the problem. Each one must become its
  own purpose-built page with its own structure, its own sections and its own visual rhythm — while still clearly belonging to
  the same brand system (same header, same footer, same fonts, same purple palette, same button styles).

  Build each of the four as follows.

  --- 5.1 — "TRAJNIME TË PERSONALIZUARA" (custom corporate training / reskilling) ---
  Theme: help a company reskill its existing workforce to fill technology roles.
  Sections in order:
  1. Hero — split layout. Left: eyebrow "PËR BIZNESE", a strong Albanian headline about reskilling your existing talent to fill
  technology roles, a 2-line subhead, and two CTAs (solid purple "Kontaktoni ne" + outlined "Shkarko broshurën"). Right: a
  photo of a corporate training session in a modern classroom, 20px radius.
  2. The problem — a short centered heading plus 3 columns, each with a purple icon, a bold one-line problem statement and 2
  lines of explanation (the tech skills gap, the cost of external hiring, employee turnover).
  3. Why reskill instead of hire — a two-column comparison block. Left card = "Punësim i ri" in neutral grey with drawbacks
  listed with grey dashes. Right card = "Rikualifikim i brendshëm" in brand purple, elevated with a stronger shadow and a small
  "E rekomanduar" badge, advantages listed with white check icons.
  4. How it works — 4 numbered steps in a horizontal timeline with a connecting line: analysis of needs → custom program design
  → delivery of the training → measurement & certification. Each step is a card with a large ghosted step number in light
  purple behind the content.
  5. What we can train — a 3-column grid of topic cards (software development, cybersecurity, data & analytics, cloud/DevOps,
  digital tools, project management). Each card: small purple icon, topic name, one line of description.
  6. Formats — a horizontal strip of 3 options: in your offices / at our campus / hybrid, each with an icon and one line.
  7. Proof — a purple full-width band with 3–4 large white stat numbers and labels (companies trained, employees reskilled,
  satisfaction rate, years of experience).
  8. Testimonial — a single quote card from an HR/company leader, with photo, name, role and company, on a very light purple
  background.
  9. FAQ — 5 collapsible accordion items in a single centered column, thin dividers between them, a purple + / − toggle on the
  right.
  10. Final CTA — a contact band for businesses: short heading, one line, and a compact horizontal form (Emri i kompanisë,
  Personi kontaktues, Email, Telefoni, submit "Kontaktoni ne"), styled to match the site's horizontal form band.

  --- 5.2 — "RRJETI I TALENTËVE" (talent network for employers) ---
  Theme: give companies access to the portfolios and CVs of Cacttus Education students and graduates.
  Sections in order:
  1. Hero — centered, not split. Big headline about hiring pre-vetted, job-ready tech talent. Subhead. One primary CTA "Bëhu
  partner". Beneath the CTA, an overlapping row of circular student avatars plus a "+200" chip to signal volume.
  2. Value strip — a single row of 4 stat blocks directly under the hero on a white card that overlaps the hero's bottom edge
  (graduates available, average hiring time, partner companies, employment rate).
  3. Who you get — a 2-column layout. Left: an accordion or list of the profile types available (web & mobile developers,
  cybersecurity specialists, etc.), each with a short capability summary. Right: a sample "talent card" mockup showing what
  employers see — avatar, name, program, skill tags, portfolio link, CV download button. Give this card a strong shadow so it
  reads as a product preview.
  4. How it works for employers — 3 large numbered steps laid out horizontally: register your company → browse profiles and
  portfolios → request an interview. Purple circular step numbers.
  5. Why our graduates — a 2×3 grid of benefit cards with purple icons (practice-based training, real project portfolios,
  industry-designed curriculum, soft skills, immediate availability, no recruitment fee).
  6. Partner logos — a horizontal marquee of employer logos, using the SAME infinite-loop component built in 3.2.
  7. Testimonial — one quote from a partner employer.
  8. Join CTA — a purple band with a short registration form for companies (Kompania, Email, Fusha e interesit, submit
  "Regjistrohu në rrjet").

  --- 5.3 — "BURSA E IMPAKTIT" (impact scholarships / become a sponsor) ---
  Theme: invite companies and donors to sponsor scholarships for students who cannot afford the tuition.
  Sections in order:
  1. Hero — emotional and human. Split layout: left = headline about investing in a young person's future and the country's
  tech sector, subhead, CTA "Bëhu sponsor". Right = a warm photo of a student. Add a small floating card over the photo showing
  the number of scholarships awarded to date.
  2. What is the Impact Scholarship — a centered narrative block, max 720px wide, 2 short paragraphs explaining the program.
  3. The impact in numbers — 4 stat blocks in a row on a light purple background (scholarships awarded, students supported,
  employed after graduation, sponsoring companies). Use large purple numerals.
  4. Sponsorship tiers — 3 pricing-style cards side by side (e.g. Bronz / Argjend / Ar, or Një bursë / Tre bursa / Program i
  plotë). Each card: tier name, what the sponsor funds, a bulleted list of what the sponsor receives (logo placement, event
  presence, first access to graduates, impact report), and a CTA button. The middle card is elevated, purple-bordered, and
  carries a "Më i zgjedhuri" badge.
  5. Student stories — 2–3 story cards in a row, each with a student photo, name, program and a 2-line quote about what the
  scholarship changed for them. This is the emotional core of the page — give it room.
  6. How a sponsorship works — 4 compact steps in a horizontal row with icons: choose a tier → sign the agreement → the student
  is selected → you receive impact reports.
  7. Current sponsors — a logo grid or the infinite marquee, with a short line thanking them.
  8. Final CTA — a full-width purple band: strong closing line and two buttons, "Bëhu sponsor" (white solid) and "Shkarko
  raportin e impaktit" (white outline).

  --- 5.4 — "KLASËT ME QERA" (classroom rental) ---
  Theme: rent modern, fully equipped classrooms and training rooms.
  Sections in order:
  1. Hero — image-led. A wide photo of a modern classroom as the hero, with the headline, one subhead line and a "Rezervo tani"
  CTA in a white card overlapping the image's lower-left corner.
  2. Quick specs strip — one horizontal row of 4–5 icon + label pairs immediately under the hero (capacity,
  computers/workstations, projector & screen, Wi-Fi, air conditioning).
  3. The spaces — a gallery of 2–3 room cards. Each card: photo, room name, capacity, a short list of what the room includes, a
  price-on-request line, and a "Rezervo" button. Cards in a row on desktop, stacked on mobile.
  4. Full equipment list — a 2-column checklist with purple check icons covering everything included in a rental.
  5. Ideal for — a row of 4 use-case cards with icons: corporate trainings, workshops, certification exams, conferences and
  presentations.
  6. Photo gallery — a clean 3-column masonry or grid of interior photos, each with a hover zoom. This is the one section where
  imagery leads, and that is intentional here.
  7. Location & access — a 2-column block. Left: address, parking, public transport, and contact details with icons. Right: an
  embedded map, 16px radius.
  8. Pricing & availability note — a short centered block explaining that pricing depends on duration and configuration, with a
  "Kërko ofertë" CTA.
  9. Booking CTA — the horizontal form band: Emri, Email, Telefoni, Data e dëshiruar, Numri i pjesëmarrësve, submit "Rezervo
  tani".

  --- SHARED RULES FOR ALL FOUR SUBPAGES ---
  - Same global header, same global footer, same fonts, same button styles, same color palette on all four. Only the section
  architecture differs.
  - Alternate section backgrounds between #FFFFFF and #FAF6FB so sections separate visually without hard lines.
  - Every page must open with a hero and close with a CTA band, but no two of the four heroes may use the same layout
  (split-left, centered, split-right, image-led).
  - Every page must be fully responsive: multi-column grids collapse to 2 columns on tablet and 1 column on mobile; horizontal
  timelines become vertical on mobile; no horizontal page scroll at any width.
  - All copy in Albanian, professional register, aimed at business decision-makers rather than students.

  =====================================================================
  FINAL REMINDER
  =====================================================================
  Implement exactly and only the changes described in Parts 1–5. Every other page, section, image, color and word on the site
  remains untouched.