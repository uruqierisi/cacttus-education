
/**
 * The four headline numbers, in ONE place.
 *
 * These used to be inline markup inside the homepage hero. They are now a component
 * because the trainings catalogue and the About page show the same four figures, and
 * three hand-copied sets of numbers are three sets that drift the first time one of them
 * is updated. Editing `HERO_STATS` below changes every page at once.
 */
export const HERO_STATS: readonly (readonly [string, string])[] = [
  ["1,000+", "Studentë të diplomuar"],
  ["88%", "Studentë të punësuar"],
  ["120+", "Bursa të ofruara"],
  ["40+", "Partnerë nga industria"],
];
