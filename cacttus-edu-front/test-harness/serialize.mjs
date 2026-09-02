/* Passed to page.evaluate as real functions (no string escaping). Each must be
   self-contained — Playwright ships the source into the page and evals it there. */

/* Canonical DOM serialiser. Normalises attribute order, whitespace runs, Vite asset
   content-hashes, React useId values and blob URLs. Everything else is a hard signal. */
export function serializeDom() {
  const normText = (s) =>
    s
      .replace(/\s+/g, " ")
      .replace(
        /\/assets\/([A-Za-z0-9._-]+?)-[A-Za-z0-9_-]{8}\.(js|css|png|jpe?g|webp|svg|woff2?|gif|avif)/g,
        "/assets/$1.$2",
      )
      .replace(/«r[0-9a-z]+»/g, "«rID»")
      .replace(/blob:[^\s"')]+/g, "blob:URL")
      .trim();

  const out = [];
  const walk = (node, depth) => {
    const pad = "  ".repeat(depth);
    if (node.nodeType === 3) {
      const t = normText(node.nodeValue || "");
      if (t) out.push(pad + "#" + t);
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === "script") return;
    const attrs = Array.from(node.attributes)
      .map((a) => [a.name, normText(a.value)])
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map((p) => p[0] + '="' + p[1] + '"')
      .join(" ");
    out.push(pad + "<" + tag + (attrs ? " " + attrs : "") + ">");
    for (const c of node.childNodes) walk(c, depth + 1);
  };
  walk(document.documentElement, 0);
  return out.join("\n");
}

/* Overflow scan. Deliberately does NOT exclude position:fixed subtrees — the drawer's
   fixed wrapper is exactly what an earlier scan missed and what the iOS fix guards. */
export function scanOverflow() {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1) {
      offenders.push({
        right: Math.round(r.right),
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute("class") || "").slice(0, 120),
        position: getComputedStyle(el).position,
      });
    }
  }
  offenders.sort((a, b) => b.right - a.right);
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: vw,
    bodyScrollWidth: document.body.scrollWidth,
    worstRight: offenders.length ? offenders[0].right : null,
    offenderCount: offenders.length,
    offenders: offenders.slice(0, 8),
  };
}

/* DOMPurify probe: what actually survived into the rendered article body. */
export function probeSanitizer() {
  const body = document.querySelector(".post-body");
  if (!body) return { found: false };
  const html = body.innerHTML;
  return {
    found: true,
    dataSrcCount: body.querySelectorAll('[src^="data:" i]').length,
    dataHrefCount: body.querySelectorAll('[href^="data:" i]').length,
    jsHrefCount: body.querySelectorAll('[href^="javascript:" i]').length,
    scriptCount: body.querySelectorAll("script").length,
    onerrorCount: body.querySelectorAll("[onerror]").length,
    xssFlag: Boolean(window.__PROBE_XSS),
    scriptFlag: Boolean(window.__PROBE_SCRIPT),
    keptSafeLink: Boolean(body.querySelector('a[href^="https://"]')),
    rawContainsData: /(?:src|href)\s*=\s*["']data:/i.test(html),
  };
}
