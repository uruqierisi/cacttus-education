import DOMPurify from "dompurify";


/**
 * Sanitise operator-authored HTML immediately before it is handed to
 * `dangerouslySetInnerHTML`.
 *
 * The body is ALREADY sanitised server-side on write (`sanitizeRichText` in
 * backend/src/lib/html.ts), so this is the second of two passes, and it is deliberate:
 *
 *  - Stored rows carry whatever the allowlist permitted the day they were saved. Widening
 *    that allowlist later cannot retroactively re-clean them; this pass runs against
 *    today's rules on every render.
 *  - This is the marketing origin. A stored payload that slipped through — via a direct
 *    DB edit, a restored backup, or a future endpoint that forgets to sanitise — must not
 *    become script execution on the public site.
 *
 * `ALLOWED_*` mirrors the server's list rather than being laxer, so the two passes cannot
 * disagree in the direction that matters.
 *
 * `ADD_URI_SAFE_ATTR` is not optional here, and the reason is unobvious: DOMPurify applies
 * `ALLOWED_URI_REGEXP` to EVERY attribute it does not consider URI-safe, not only to
 * `href`/`src`. Without this line the regexp is handed `_blank` and `noopener noreferrer`,
 * neither of which is a URI, so it silently strips `target` and `rel` from every link the
 * editor marked as opening in a new tab. Listing them exempts those two from the URL check
 * while `href` and `src` are still validated — verified against `javascript:` and `data:`
 * payloads, which remain stripped. Neither attribute is fetched or executed, so exempting
 * them costs nothing: `target` only names a browsing context.
 */
export const ALLOWED_HTML_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div",
];


export const ALLOWED_HTML_ATTR = [
  "href", "title", "target", "rel",
  "src", "alt", "width", "height", "loading",
  "class",
];

/**
 * Close DOMPurify's `data:` exemption for `<img>`.
 *
 * `ALLOWED_URI_REGEXP` does NOT cover it: DOMPurify keeps a separate DATA_URI_TAGS
 * allowance (img, video, audio, source, track) that lets a `data:` URL through whatever
 * the regexp says, and it never inspects the media type. Verified: a
 * `data:image/svg+xml;base64,…` src survived this pass before this hook existed.
 *
 * An `<img>` renders SVG in a non-scripting context, so that payload was inert rather
 * than an XSS — but nothing we author needs a data: URL at all. The editor inserts
 * uploaded http(s) URLs (Tiptap's Image extension runs with `allowBase64: false`) and
 * the API's own pass already restricts img to http/https. Dropping the attribute costs
 * nothing and removes the one place where the two passes disagreed.
 *
 * Registered at module scope: DOMPurify hooks are global and cumulative, so adding this
 * inside `renderSafeHtml` would stack a fresh copy on every render.
 */
DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  if ((data.attrName === "src" || data.attrName === "href") && /^data:/i.test(data.attrValue)) {
    data.keepAttr = false;
  }
});


export function renderSafeHtml(html: string): { __html: string } {
  return {
    __html: DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ALLOWED_HTML_TAGS,
      ALLOWED_ATTR: ALLOWED_HTML_ATTR,
      // Belt and braces against `javascript:` / `data:` payloads surviving in an href.
      ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):|^[/#]/i,
      ADD_URI_SAFE_ATTR: ["target", "rel"],
    }),
  };
}
