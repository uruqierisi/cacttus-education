/**
 * Shared secret-redaction primitives.
 *
 * WHY THIS IS ITS OWN MODULE
 * --------------------------
 * Two independent sinks can leak a credential to somewhere durable: `lib/logger.ts`
 * (stdout, shipped to the platform log drain) and `lib/audit.ts` (a Postgres table that
 * is append-only and therefore impossible to scrub after the fact). They must enforce
 * the SAME denylist, but `audit.ts` already imports `logger.ts`, so putting the list in
 * either one would make the other import circular. It lives here instead, importing
 * nothing.
 *
 * KEYS ARE MATCHED AFTER NORMALISATION
 * ------------------------------------
 * `password_hash`, `passwordHash`, `PASSWORD-HASH` and `password hash` all collapse to
 * `passwordhash`. Matching raw `toLowerCase()` strings — as the logger previously did —
 * silently misses every snake_case and kebab-case spelling, which is exactly how a
 * header name like `x-access-token` slips through a denylist that contains `accesstoken`.
 */

export const REDACTED_PLACEHOLDER = '[redacted]';

/** Lowercased, non-alphanumerics stripped, so one entry covers every spelling. */
export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Exact key names that must never be persisted or printed.
 *
 * `email` / `name` are deliberately ABSENT: `actorEmail` and `metadata.targetEmail` are
 * the audit trail's primary identity fields, and denying them would gut the log. `phone`
 * IS denied — it is pure submitter PII with no oversight value, and it is one of the
 * three columns a careless `{ ...submission }` spread would otherwise copy in.
 */
export const DENIED_KEYS: ReadonlySet<string> = new Set([
  'password',
  'passwordhash',
  'plaintextpassword',
  'currentpassword',
  'newpassword',
  'oldpassword',
  'hash',
  'salt',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'bearer',
  'authorization',
  'apikey',
  'cookie',
  'cookies',
  'setcookie',
  'secret',
  'jwtsecret',
  'clientsecret',
  // Submitter PII. `data` is the Submission answer blob; `phone` is a promoted column
  // of the same row. Both already live on `Submission` and must not be mirrored.
  'data',
  'submissiondata',
  'answers',
  'payload',
  'pii',
  'phone',
  'body',
  'requestbody',
]);

/**
 * Substrings that make a key forbidden regardless of exact spelling. This is what stops
 * `api_key_2`, `xAuthorizationHeader`, `userPwd` or `sessionIdCookie` from walking past
 * an exact-match list.
 *
 * Every fragment here has been checked against the metadata keys the code actually
 * writes today (slug, title, type, isActive, fieldCount, changed, submissionCount,
 * targetEmail, role, nameChanged, fromRole, sessionsRevoked, targetRole, from, to,
 * formSlug, outcome, selfService) — none collide. Note `sessionid`, not `session`:
 * the latter would swallow the legitimate `sessionsRevoked` flag.
 */
export const DENIED_KEY_FRAGMENTS: readonly string[] = [
  'password',
  'passwd',
  'pwd',
  'token',
  'secret',
  'credential',
  'apikey',
  'authorization',
  // NOT the bare fragment `auth`: that would swallow `authorId`, which the
  // POST_DELETED entry records deliberately. `authheader` covers `authHeader`,
  // `x-auth-header` and friends without that collateral damage.
  'authheader',
  'bearer',
  'cookie',
  'sessionid',
  'privatekey',
  'signature',
  'hash',
  'otp',
  'mfa',
];

export function isDeniedKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return (
    DENIED_KEYS.has(normalized) ||
    DENIED_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment))
  );
}

/**
 * Last line of defence: values whose SHAPE gives them away no matter what key they
 * arrived under.
 *
 * A key-based denylist cannot catch `{ note: user.passwordHash }` or
 * `{ detail: accessToken }` — the key is innocent and the value is the credential. A
 * bcrypt digest is a fixed 60-character format and a JWT is three base64url segments
 * starting `eyJ`; neither shape occurs in legitimate audit metadata, so matching them is
 * free of false positives.
 */
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const JWT_PATTERN = /^eyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}$/;

export function looksLikeSecretValue(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value) || JWT_PATTERN.test(value);
}
