/**
 * Runtime configuration, read once and validated at module load so a missing
 * `VITE_API_BASE_URL` fails loudly at boot instead of as a mystery network error.
 */
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawApiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set. Copy .env.example to .env.local.');
}

/**
 * Where the marketing site lives, for the links this dashboard hands an admin — the
 * form's shareable URL and a training's "Shiko faqen".
 *
 * Configurable rather than hard-coded because those links must be CLICKABLE in whatever
 * environment the admin is in: hard-coding the production host meant a local run offered
 * a link to the live site, which is both useless for checking your work and a good way to
 * confuse a staging edit with a production one. The default keeps production behaviour
 * unchanged when the variable is unset.
 */
const rawPublicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'https://cacttus.education';

export const config = Object.freeze({
  apiBaseUrl: rawApiBaseUrl.replace(/\/+$/, ''),
  publicSiteUrl: rawPublicSiteUrl.replace(/\/+$/, ''),
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
  isProduction: import.meta.env.PROD,
});
