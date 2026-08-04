/**
 * Runtime configuration for the marketing site.
 *
 * Read once and validated at module load, so a missing `VITE_API_BASE_URL` fails
 * loudly at boot with an actionable message instead of surfacing later as a fetch
 * to the string "undefined/api/public/forms/...".
 */
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!rawApiBaseUrl) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env.local and restart the dev server.',
  )
}

export const config = Object.freeze({
  /** Trailing slashes stripped so `${apiBaseUrl}/api/...` never doubles up. */
  apiBaseUrl: rawApiBaseUrl.replace(/\/+$/, ''),
})
