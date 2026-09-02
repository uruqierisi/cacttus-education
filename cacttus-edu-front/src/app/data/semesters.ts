
/* 3.1 — INTERACTIVE SEMESTER TABS */

/**
 * One course: [name, ECVET credits, contact hours].
 *
 * The credit figure is part of the DATA now. It used to be a literal `6 ECTS` inside the
 * row markup, which meant every course on every semester of both programmes claimed six
 * credits regardless of its real weight — the same shape of bug the "Çfarë do të mësosh"
 * descriptions had. The semester total in the panel header is summed from these rather
 * than hardcoded, so editing a course's credits keeps the badge honest by itself.
 */
export type SemesterModule = readonly [name: string, ecvet: number, hours: number];

export type Semester = { readonly sem: string; readonly modules: readonly SemesterModule[] };


/* ── /programim curriculum — EDIT COURSES HERE ── */
export const SEM_PROGRAMIM: readonly Semester[] = [
  {
    sem: "Semestri 1",
    modules: [
      ["Gjuhë angleze për TI", 4, 80],
      ["Bazat e Ueb-it", 4, 80],
      ["Matematikë për shkencat kompjuterike", 6, 120],
      ["Bazat e TIK", 8, 160],
      ["Hyrje në programim", 8, 160],
    ],
  },
  {
    sem: "Semestri 2",
    modules: [
      ["Algoritmet dhe strukturat e të dhënave", 6, 120],
      ["Dizajnimi dhe zhvillimi i bazave të të dhënave", 8, 160],
      ["Programimi i Ueb-it interaktiv", 4, 80],
      ["Programimi i orientuar në objekte", 8, 160],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
  {
    sem: "Semestri 3",
    modules: [
      ["Inxhinieria softuerike", 6, 120],
      ["Zhvillimi i Ueb-it", 7, 140],
      ["Zhvillimi i aplikacioneve mobile", 7, 140],
      ["Dizajni i ndërfaqes së përdoruesit dhe përdorshmëria", 6, 120],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
  {
    sem: "Semestri 4",
    modules: [
      ["Zhvillimi i avancuar i Ueb-it", 7, 140],
      ["Zhvillimi i avancuar i aplikacioneve mobile", 7, 140],
      ["Hyrje në siguri kibernetike", 6, 120],
      ["Analiza dhe vizualizimi i të dhënave", 6, 120],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
];


/* ── /siguria curriculum — EDIT COURSES HERE ──
   Note the totals are NOT all 30: semester 3 sums to 29 and semester 4 to 31. That is
   the real programme, not a typo — and it is exactly why the panel badge is summed from
   these rows rather than printing a fixed "30". */
export const SEM_SIGURIA: readonly Semester[] = [
  {
    sem: "Semestri 1",
    modules: [
      ["Gjuhë angleze për TI", 4, 80],
      ["Matematikë për shkencat kompjuterike", 6, 120],
      ["Bazat e TIK", 8, 160],
      ["Rrjetat Kompjuterike 1", 6, 120],
      ["Hyrje në programim", 6, 120],
    ],
  },
  {
    sem: "Semestri 2",
    modules: [
      ["Rrjetat Kompjuterike 2", 6, 120],
      ["Linux 1", 7, 140],
      ["Teknologjitë Cloud", 7, 140],
      ["Gjuhë skriptuese", 6, 120],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
  {
    sem: "Semestri 3",
    modules: [
      ["Rrjetat Kompjuterike 3", 6, 120],
      ["Linux 2", 6, 120],
      ["Administrimi i bazave të të dhënave", 6, 120],
      ["Siguria e Informacionit", 7, 140],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
  {
    sem: "Semestri 4",
    modules: [
      ["Virtualizimi", 6, 120],
      ["Siguria Kibernetike", 7, 140],
      ["Operacionet Kibernetike / Cyber Operations", 7, 140],
      ["Testimi i Sigurisë / Penetration Testing", 7, 140],
      ["Lëndë zgjedhore", 4, 80],
    ],
  },
];
