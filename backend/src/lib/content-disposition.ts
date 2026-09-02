/**
 * `Content-Disposition` for downloaded files.
 *
 * WHY THIS IS NOT A ONE-LINER
 * ---------------------------
 * The header is one of the few places where a stored string is copied into a response
 * header, so it is a header-injection surface. Everything here treats the incoming name
 * as untrusted even though it comes from our own database: a CR or LF would split the
 * response, and a quote would end the quoted-string early and let the rest be read as
 * further header parameters.
 *
 * TWO FORMS, DELIBERATELY
 * -----------------------
 * `filename=` is the ASCII form every client understands, and `filename*=UTF-8''…`
 * (RFC 5987/6266) carries the exact bytes for clients that support it. Emitting both is
 * the standard belt-and-braces: a client that understands `filename*` prefers it, one
 * that does not falls back to the ASCII form rather than to the UUID.
 *
 * In practice a training slug is already ASCII — SLUG_PATTERN is `^[a-z0-9]+(?:-[a-z0-9]+)*$`
 * — so the two forms are usually identical. The percent-encoded form is what keeps a
 * hand-edited row containing `ë` or `ç` from silently degrading to a stripped name.
 */

/** Characters that are safe unquoted in the ASCII `filename=` parameter. */
const ASCII_SAFE = /[^A-Za-z0-9._-]+/g;
const EDGE_SEPARATORS = /^[-._]+|[-._]+$/g;

/**
 * Fold an arbitrary string down to the ASCII subset that is safe in a quoted filename.
 * Anything outside it — including CR, LF, `"` and `\` — is collapsed to a single dash.
 */
function toAsciiFilename(name: string): string {
  return name
    .normalize('NFD')
    // Strip combining marks so "ë" degrades to "e" rather than to a dash.
    .replace(/[̀-ͯ]/g, '')
    .replace(ASCII_SAFE, '-')
    .replace(EDGE_SEPARATORS, '');
}

/**
 * Build an `attachment` disposition for `name`, or a bare `attachment` when nothing
 * usable survives sanitisation.
 *
 * `attachment` without a filename is the correct fallback rather than a guess: the
 * browser then uses the URL's last segment, which is our own UUID — unhelpful, but never
 * wrong or dangerous.
 */
export function attachmentDisposition(name: string): string {
  const ascii = toAsciiFilename(name);

  if (ascii === '') {
    return 'attachment';
  }

  // `encodeURIComponent` leaves `!'()*` unescaped; they are legal in ext-value token
  // characters, but escaping them keeps the output inside the RFC 5987 attr-char set.
  const encoded = encodeURIComponent(name).replace(
    /['()!*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/** The download name a training's syllabus should arrive under. */
export function syllabusFilename(trainingSlug: string): string {
  return `${trainingSlug}-planprogrami.pdf`;
}
