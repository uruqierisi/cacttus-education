/** Shared constants — route paths, enums mirrored from the API, and UI limits. */
import { config } from './config';

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  SUBMISSIONS: '/aplikimet',
  SUBMISSION_DETAIL: (id: string) => `/aplikimet/${id}`,
  TRAININGS: '/trajnimet',
  FORMS: '/format',
  FORM_NEW: '/format/e-re',
  FORM_EDIT: (id: string) => `/format/${id}`,
  POSTS: '/lajme',
  POST_NEW: '/lajme/i-ri',
  POST_EDIT: (id: string) => `/lajme/${id}`,
  AUDIT: '/regjistri',
  USERS: '/perdoruesit',
  SETTINGS: '/cilesimet',
  TRAINING_NEW: '/trajnimet/i-ri',
  TRAINING_EDIT: (id: string) => `/trajnimet/${id}`,
} as const;

export const FORM_TYPES = ['ZHVAM', 'CYBER', 'TRAINING', 'SCHOOL'] as const;
export type FormType = (typeof FORM_TYPES)[number];

/**
 * Programme names are the client's own brand terms and stay untranslated; only the
 * two generic ones get an Albanian word.
 */
export const FORM_TYPE_LABELS: Record<FormType, string> = {
  ZHVAM: 'ZHVAM',
  CYBER: 'Cyber',
  TRAINING: 'Trajnime',
  SCHOOL: 'Shkollë',
};

export const SUBMISSION_STATUSES = ['NEW', 'CONTACTED', 'ARCHIVED'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  NEW: 'I ri',
  CONTACTED: 'I kontaktuar',
  ARCHIVED: 'I arkivuar',
};

export const FIELD_TYPES = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'date',
  'select',
  'multiselect',
  'radio',
  'checkbox',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Tekst i shkurtë',
  textarea: 'Tekst i gjatë',
  email: 'Email',
  phone: 'Telefon',
  number: 'Numër',
  date: 'Datë',
  select: 'Listë zgjedhëse',
  multiselect: 'Zgjedhje të shumta',
  radio: 'Një nga disa',
  checkbox: 'Kuti kontrolli',
};

/** Field types that require an option list. */
export const CHOICE_FIELD_TYPES: readonly FieldType[] = ['select', 'multiselect', 'radio'];

export const TRAINING_CATEGORIES = [
  'PROGRAMIM',
  'ADMINISTRIM',
  'SIGURI_KIBERNETIKE',
  'MARKETING_DIZAJN',
  'MENAXHIM_PROJEKTEVE',
  'AFTESI_TE_BUTA',
] as const;
export type TrainingCategoryValue = (typeof TRAINING_CATEGORIES)[number];

/**
 * Albanian display labels for the catalogue taxonomy.
 *
 * The enum values are stable machine strings; these are what an admin and a visitor
 * read. Keeping the mapping here — rather than storing pretty text in the database —
 * means renaming a category is a code change in two frontends, never a data migration.
 */
export const TRAINING_CATEGORY_LABELS: Record<TrainingCategoryValue, string> = {
  PROGRAMIM: 'Programim',
  ADMINISTRIM: 'Administrim',
  SIGURI_KIBERNETIKE: 'Siguri Kibernetike',
  MARKETING_DIZAJN: 'Marketing & Dizajn',
  MENAXHIM_PROJEKTEVE: 'Menaxhim i Projekteve',
  AFTESI_TE_BUTA: 'Aftësi të buta',
};

export const TRAINING_FORMATS = ['KLASE', 'HIBRID', 'ONLINE'] as const;
export type TrainingFormatValue = (typeof TRAINING_FORMATS)[number];

export const TRAINING_FORMAT_LABELS: Record<TrainingFormatValue, string> = {
  KLASE: 'Klasë',
  HIBRID: 'Hibrid',
  ONLINE: 'Online',
};

/**
 * The cities a training can be held in.
 *
 * A FIXED LIST, not free text. `city` was a plain input, and the same city was typed both
 * with and without its diacritic ("Kamenice" vs "Kamenicë"). The public site builds its
 * "Qyteti" filter chips from the distinct stored values, so each spelling became its own
 * chip and the trainings behind them were split across two filters. That happened twice.
 *
 * The stored value is the LABEL itself, exactly as written here — there is no separate
 * code, because the marketing site displays and filters on this string directly. Which is
 * also why the spellings below are load-bearing: change one and it stops matching the rows
 * already in the database.
 *
 * A training may legitimately have NO city (an online one). That is `null` in the database,
 * never an empty string — see `NO_CITY_VALUE` at the editor, which exists only because a
 * Radix <Select> cannot carry "" as an item value.
 */
export const TRAINING_CITIES = ['Prishtinë', 'Prizren', 'Kamenicë'] as const;
export type TrainingCityValue = (typeof TRAINING_CITIES)[number];

/**
 * Lifecycle, not visibility. `isActive` already answers "is this published"; this answers
 * "has it finished", and the two are shown side by side, so the labels must not collide —
 * hence "Përfunduar" rather than reusing "E ndalur".
 */
export const TRAINING_STATUSES = ['ACTIVE', 'COMPLETED'] as const;
export type TrainingStatusValue = (typeof TRAINING_STATUSES)[number];

export const TRAINING_STATUS_LABELS: Record<TrainingStatusValue, string> = {
  ACTIVE: 'Aktive',
  COMPLETED: 'Përfunduar',
};

export const ROLES = ['ADMIN', 'EDITOR'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  EDITOR: 'Redaktor',
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** The audit trail has its own, larger page size — it mirrors AUDIT_PAGINATION. */
export const AUDIT_PAGE_SIZE = 50;

/** Debounce applied to every search input before it becomes a request. */
export const SEARCH_DEBOUNCE_MS = 350;

/** react-query cache window: admin data is fresh enough for half a minute. */
export const QUERY_STALE_TIME_MS = 30_000;

/** Sentinel used by the filter dropdowns, since Radix Select forbids an empty value. */
export const ALL_FILTER_VALUE = 'all';

/**
 * Public base URL of the marketing site, used to build the copyable form link.
 *
 * The API endpoint behind a form is `/api/public/forms/:slug`, but that is not what an
 * admin pastes into an email — they need the page a candidate can open. Both halves are
 * declared here so that when the marketing site settles on its final route, ONE
 * constant changes and every copy button follows.
 */
export const PUBLIC_SITE_URL = config.publicSiteUrl;
export const PUBLIC_FORM_PATH = '/forma';

/** Detail page of a training on the marketing site. Mirrors the API's `applyUrl`. */
export const PUBLIC_TRAINING_PATH = '/trajnime';

/** The shareable public URL of a form. */
export function publicFormUrl(slug: string): string {
  return `${PUBLIC_SITE_URL}${PUBLIC_FORM_PATH}/${slug}`;
}

/** The public URL of a training's detail page — the editor's "Shiko faqen" link. */
export function publicTrainingUrl(slug: string): string {
  return `${PUBLIC_SITE_URL}${PUBLIC_TRAINING_PATH}/${slug}`;
}
