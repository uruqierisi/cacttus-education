/**
 * Turns an `AuditLog` row into an Albanian sentence.
 *
 * The trail is read by a human answering "who did what, when" — so a row must read as
 * prose ("Eris (Administrator) krijoi formën «Aplikimi për Shkollë»"), not as an enum
 * name beside a cuid. The raw action, entity id, ip and userAgent are all still
 * available in the expandable detail; this layer is presentation only and NEVER drops
 * information that is not shown elsewhere on the row.
 *
 * Every lookup here falls back rather than throwing. The action vocabulary comes from a
 * Prisma enum that will gain members over time, and a dashboard that renders a blank
 * row (or crashes) for an action it has not been taught about would fail exactly when
 * the trail matters most — right after someone ships a new kind of privileged action.
 */
import { ROLE_LABELS, SUBMISSION_STATUS_LABELS, type Role, type SubmissionStatus } from './constants';
import type { AuditLog } from '@/api/types';

/** Short label for the action filter dropdown. */
export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  LOGIN_SUCCESS: 'Kyçje e suksesshme',
  LOGIN_FAILED: 'Kyçje e dështuar',
  LOGOUT: 'Dalje',
  PASSWORD_CHANGED: 'Ndryshim fjalëkalimi',
  PASSWORD_RESET: 'Rivendosje fjalëkalimi',
  USER_CREATED: 'Krijim përdoruesi',
  USER_UPDATED: 'Përditësim përdoruesi',
  USER_DEACTIVATED: 'Çaktivizim përdoruesi',
  USER_DELETED: 'Fshirje përdoruesi',
  FORM_CREATED: 'Krijim forme',
  FORM_UPDATED: 'Përditësim forme',
  FORM_DELETED: 'Fshirje forme',
  FORM_RESTORED: 'Rikthim forme',
  SUBMISSION_STATUS_CHANGED: 'Ndryshim statusi aplikimi',
  SUBMISSIONS_EXPORTED: 'Eksport aplikimesh',
  SUBMISSIONS_IMPORTED: 'Import aplikimesh',
  POST_CREATED: 'Krijim artikulli',
  POST_UPDATED: 'Përditësim artikulli',
  POST_DELETED: 'Fshirje artikulli',
  TRAINING_CATEGORY_CREATED: 'Krijim kategorie trajnimi',
  TRAINING_CATEGORY_UPDATED: 'Përditësim kategorie trajnimi',
  TRAINING_CATEGORY_DELETED: 'Fshirje kategorie trajnimi',
  POST_CATEGORY_CREATED: 'Krijim kategorie artikulli',
  POST_CATEGORY_UPDATED: 'Përditësim kategorie artikulli',
  POST_CATEGORY_DELETED: 'Fshirje kategorie artikulli',
});

export const AUDIT_ENTITY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  Form: 'Forma',
  Submission: 'Aplikimi',
  User: 'Përdoruesi',
  Post: 'Artikulli',
  Auth: 'Qasja',
});

/** Human label for an action, falling back to the raw enum name. */
export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function auditEntityLabel(entityType: string): string {
  return AUDIT_ENTITY_LABELS[entityType] ?? entityType;
}

/**
 * Display name for the actor.
 *
 * `AuditLog` stores `actorEmail`, not a name — deliberately, because the snapshot must
 * survive the account being deleted. So a readable name is derived from the local part
 * ("eris.krasniqi" -> "Eris Krasniqi"). The full email is always shown in the row's
 * detail panel, so nothing is hidden by the prettier form.
 */
export function actorDisplayName(email: string): string {
  const localPart = email.split('@')[0] ?? email;

  const words = localPart
    .split(/[._-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  return words.length > 0 ? words.join(' ') : email;
}

export function actorLabel(email: string, role: Role): string {
  return `${actorDisplayName(email)} (${ROLE_LABELS[role] ?? role})`;
}

function readString(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function readNumber(metadata: Record<string, unknown> | null, key: string): number | null {
  const value = metadata?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function statusLabel(value: string | null): string {
  if (!value) {
    return '—';
  }
  return SUBMISSION_STATUS_LABELS[value as SubmissionStatus] ?? value;
}

/** Best available name for the affected row: title, then slug, then email, then id. */
function subjectName(log: AuditLog): string {
  return (
    readString(log.metadata, 'title') ??
    readString(log.metadata, 'targetEmail') ??
    readString(log.metadata, 'slug') ??
    readString(log.metadata, 'formSlug') ??
    log.entityId ??
    '—'
  );
}

/**
 * The verb phrase that follows the actor's name.
 *
 * Returned without the actor and without the timestamp so the row component can style
 * each part independently (bold subject, muted date) instead of parsing a sentence back
 * apart.
 */
export function auditPredicate(log: AuditLog): string {
  const subject = subjectName(log);

  switch (log.action) {
    case 'LOGIN_SUCCESS':
      return 'u kyç në panel';
    case 'LOGIN_FAILED':
      return `dështoi të kyçet (${log.actorEmail})`;
    case 'LOGOUT':
      return 'doli nga paneli';
    case 'PASSWORD_CHANGED':
      return 'ndryshoi fjalëkalimin e vet';
    case 'PASSWORD_RESET':
      return `rivendosi fjalëkalimin e ${subject}`;

    case 'USER_CREATED':
      return `krijoi përdoruesin ${subject}`;
    case 'USER_UPDATED':
      return `përditësoi përdoruesin ${subject}`;
    case 'USER_DEACTIVATED':
      return `çaktivizoi përdoruesin ${subject}`;
    case 'USER_DELETED':
      return `fshiu përdoruesin ${subject}`;

    case 'FORM_CREATED':
      return `krijoi formën «${subject}»`;
    case 'FORM_UPDATED':
      return `përditësoi formën «${subject}»`;
    case 'FORM_DELETED':
      return `fshiu formën «${subject}»`;
    case 'FORM_RESTORED':
      return `riktheu formën «${subject}»`;

    case 'SUBMISSION_STATUS_CHANGED':
      return `ndryshoi statusin e një aplikimi nga «${statusLabel(
        readString(log.metadata, 'from'),
      )}» në «${statusLabel(readString(log.metadata, 'to'))}»`;

    case 'SUBMISSIONS_EXPORTED': {
      const count = readNumber(log.metadata, 'count');
      return count === null
        ? 'eksportoi aplikime në CSV'
        : `eksportoi ${count} aplikime në CSV`;
    }
    case 'SUBMISSIONS_IMPORTED': {
      const inserted = readNumber(log.metadata, 'inserted');
      return inserted === null
        ? 'importoi aplikime nga CSV'
        : `importoi ${inserted} aplikime nga CSV`;
    }

    case 'POST_CREATED':
      return `krijoi artikullin «${subject}»`;
    case 'POST_UPDATED':
      return `përditësoi artikullin «${subject}»`;
    case 'POST_DELETED':
      return `fshiu artikullin «${subject}»`;

    default:
      // Unknown action: still say something true and specific rather than nothing.
      return `kreu veprimin ${auditActionLabel(log.action)} te ${auditEntityLabel(
        log.entityType,
      ).toLowerCase()} ${subject}`;
  }
}
