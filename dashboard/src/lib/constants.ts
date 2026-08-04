/** Shared constants — route paths, enums mirrored from the API, and UI limits. */

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
export const PUBLIC_SITE_URL = 'https://cacttus.education';
export const PUBLIC_FORM_PATH = '/forma';

/** The shareable public URL of a form. */
export function publicFormUrl(slug: string): string {
  return `${PUBLIC_SITE_URL}${PUBLIC_FORM_PATH}/${slug}`;
}
