/**
 * Per-route document metadata: <title>, description, canonical, Open Graph.
 *
 * NO DEPENDENCY. react-helmet and friends exist to solve this, and they are the wrong
 * size for it here: this app is a single SPA with a fixed route table and no SSR, so the
 * whole job is "write four strings into <head> when the route changes". A library would
 * add a provider, a bundle, and a rendering model to do it.
 *
 * NOTHING IS RESTORED ON UNMOUNT, deliberately. Every route calls this hook, so the next
 * page overwrites all of it on the very next render; a cleanup that reverted to the
 * index.html defaults would put those defaults on screen for one frame between routes,
 * which is exactly the flash a crawler or a bookmark-title could catch.
 *
 * THE TAGS ARE CREATED IF ABSENT, then reused. `index.html` ships the og:* defaults so a
 * crawler that does not run JavaScript still gets something sane; this updates them in
 * place rather than appending a second og:title, which is what a naive
 * `document.head.appendChild` per route would do — and two og:title tags is undefined
 * behaviour that different crawlers resolve differently.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * The production origin, hard-coded on purpose.
 *
 * A canonical URL must name the ONE address a page should be indexed at. Deriving it from
 * `window.location.origin` would emit `http://localhost:5174/...` from a dev build and,
 * worse, make a preview deployment declare itself canonical — the classic way a staging
 * copy ends up outranking production.
 */
export const SITE_ORIGIN = 'https://cacttus.education'

/** Find a meta tag by attribute, or create it in <head>. */
function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`
  let tag = document.head.querySelector<HTMLMetaElement>(selector)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function upsertCanonical(href: string): void {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', 'canonical')
    document.head.appendChild(tag)
  }

  tag.setAttribute('href', href)
}

/**
 * @param title       Full <title>. Already includes the "— Cacttus Education" suffix.
 * @param description ~150 characters, drafted from the page's own copy.
 * @param canonicalPath Overrides the live pathname. Used by the home page, which the
 *   catch-all route also renders: without it an unknown URL would declare ITSELF
 *   canonical and every typo'd link would become a duplicate of the home page.
 */
export function usePageMeta(title: string, description: string, canonicalPath?: string): void {
  const { pathname } = useLocation()
  const url = `${SITE_ORIGIN}${canonicalPath ?? pathname}`

  useEffect(() => {
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', url)
    upsertCanonical(url)
  }, [title, description, url])
}
