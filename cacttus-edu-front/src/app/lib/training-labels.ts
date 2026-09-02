import type {
  TrainingCategory,
  TrainingFormat,
  TrainingStatus,
} from "../../marketing/lib/public-api";



/* ─── Albanian labels for the catalogue taxonomy ───
   The API stores stable machine values; these are what a visitor reads. Renaming a
   category is a change here, never a data migration. */
export const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  PROGRAMIM: "Programim",
  ADMINISTRIM: "Administrim",
  SIGURI_KIBERNETIKE: "Siguri Kibernetike",
  MARKETING_DIZAJN: "Marketing & Dizajn",
  MENAXHIM_PROJEKTEVE: "Menaxhim i Projekteve",
  AFTESI_TE_BUTA: "Aftësi të buta",
};


/* Lifecycle labels + the two badge palettes. Green reads as "open, you can still join",
   neutral grey as "closed" — the same green/grey pairing the rest of the site already
   uses for success and muted states, so this adds no new colours. */
export const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  ACTIVE: "Aktive",
  COMPLETED: "Përfunduar",
};


export const TRAINING_STATUS_STYLES: Record<TrainingStatus, { bg: string; fg: string }> = {
  ACTIVE: { bg: "#E6F6EF", fg: "#1E9E6A" },
  COMPLETED: { bg: "#F4F4F6", fg: "#71717D" },
};


export const TRAINING_FORMAT_LABELS: Record<TrainingFormat, string> = {
  KLASE: "Klasë",
  HIBRID: "Hibrid",
  ONLINE: "Online",
};
