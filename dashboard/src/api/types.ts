/**
 * Wire types mirroring the backend DTOs. Dates arrive as ISO strings over JSON and
 * are typed as such — converting them lives in the formatting layer.
 */
import type { FieldType, FormType, Role, SubmissionStatus } from '@/lib/constants';

export type User = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: Role;
  readonly createdAt: string;
};

/**
 * The richer shape returned by `/api/admin/users` (ADMIN only).
 *
 * `postCount` is surfaced by the API precisely so the dashboard can explain up front
 * why "Fshij" is unavailable for an author, instead of letting the admin discover it
 * through a 409.
 */
export type AdminUser = User & {
  readonly isActive: boolean;
  readonly postCount: number;
  readonly passwordChangedAt: string;
};

export type FieldOption = {
  readonly value: string;
  readonly label: string;
};

export type FieldDefinition = {
  readonly name: string;
  readonly label: string;
  readonly type: FieldType;
  readonly required: boolean;
  readonly placeholder?: string;
  readonly helpText?: string;
  readonly order: number;
  readonly options: readonly FieldOption[];
};

export type Form = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly type: FormType;
  readonly fields: readonly FieldDefinition[];
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly submissionCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type Submission = {
  readonly id: string;
  readonly formId: string;
  readonly formSlug: string;
  readonly formTitle: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly data: Record<string, unknown>;
  readonly status: SubmissionStatus;
  readonly createdAt: string;
};

export type Post = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly coverImage: string | null;
  readonly content: string;
  readonly excerpt: string;
  readonly published: boolean;
  readonly author: { readonly id: string; readonly name: string };
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SubmissionStats = {
  readonly total: number;
  readonly byStatus: Record<SubmissionStatus, number>;
};

export type PostStats = {
  readonly total: number;
  readonly published: number;
};

export type AuthResponse = {
  readonly user: User;
  readonly accessToken: string;
};

/* ------------------------------------------------------------------ audit trail */

/** Mirrors the `AuditAction` enum. Served by `/api/admin/audit-logs/actions`. */
export type AuditAction = string;

export const AUDIT_ENTITY_TYPES = ['Form', 'Submission', 'User', 'Post', 'Auth'] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export type AuditLog = {
  readonly id: string;
  /** Null once the account has been deleted — the row deliberately outlives it. */
  readonly actorId: string | null;
  readonly actorEmail: string;
  readonly actorRole: Role;
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly ip: string | null;
  readonly userAgent: string | null;
  readonly createdAt: string;
};

/* ----------------------------------------------------------------------- stats */

export type StatsSummary = {
  readonly currentMonth: number;
  readonly previousMonth: number;
  /** Null when the previous month was empty — there is no change from zero. */
  readonly changePercent: number | null;
  readonly newCount: number;
  readonly total: number;
  readonly rangeStart: string;
  readonly previousRangeStart: string;
};

export type StatsGranularity = 'day' | 'week' | 'month';

export type TimeseriesPoint = {
  readonly bucket: string;
  readonly count: number;
};

export type StatsTimeseries = {
  readonly granularity: StatsGranularity;
  readonly from: string;
  readonly to: string;
  readonly points: readonly TimeseriesPoint[];
};

export type ByTypePoint = {
  readonly type: FormType;
  readonly count: number;
};

export type StatsByType = {
  readonly total: number;
  readonly items: readonly ByTypePoint[];
};

/**
 * A row of the managed taxonomy, not a union of machine values any more.
 *
 * `name` IS the label. There used to be a `TRAINING_CATEGORY_LABELS` map in
 * `lib/constants.ts` translating `'PROGRAMIM'` into `'Programim'`, with an identical
 * copy in the marketing site; both are gone, because adding a category no longer means
 * editing two frontends.
 */
export type TrainingCategory = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly sortOrder: number;
  /**
   * Trainings pointing here, SOFT-DELETED ONES INCLUDED — those still hold the foreign
   * key and still block a delete, so the number has to match what the API will enforce.
   */
  readonly trainingCount: number;
  readonly createdAt: string;
};

/** The category as it rides along on a training payload. */
export type TrainingCategoryRef = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type TrainingFormat = 'KLASE' | 'HIBRID' | 'ONLINE';

/** Lifecycle. Separate from `isActive`, which is publish/unpublish. */
export type TrainingStatus = 'ACTIVE' | 'COMPLETED';

/**
 * A catalogue entry. NOT a Form — a Training points AT a form via `formSlug`, and the
 * two have separate lifecycles: several trainings may share one application form, and a
 * form shared on social media belongs to no training at all.
 */
export type Training = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly category: TrainingCategoryRef;
  /** ISO instant, or null. Rendered as a date — the time component is always midnight. */
  readonly startDate: string | null;
  readonly format: TrainingFormat;
  readonly hours: number | null;
  readonly instructor: string | null;
  /** Portrait URL and short bio for the detail page's trainer block. */
  readonly instructorPhoto: string | null;
  readonly instructorBio: string | null;
  readonly city: string | null;
  /** Whole euros, or null when the price is not settled yet. */
  readonly price: number | null;
  readonly status: TrainingStatus;
  readonly description: string | null;
  readonly strengths: readonly string[];
  /** Job titles the training prepares for. Empty when unset. */
  readonly jobRoles: readonly string[];
  readonly syllabusPdf: string | null;
  readonly formSlug: string;
  /** Null when `formSlug` no longer resolves — the editor surfaces this as a warning. */
  readonly formTitle: string | null;
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly order: number;
  readonly submissionCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** One entry of the editor's "Forma e aplikimit" dropdown. */
export type FormOption = {
  readonly slug: string;
  readonly title: string;
  /** False for a form that exists but is not accepting submissions. Still selectable. */
  readonly isActive: boolean;
};
