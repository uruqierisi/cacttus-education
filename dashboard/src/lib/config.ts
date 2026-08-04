/**
 * Runtime configuration, read once and validated at module load so a missing
 * `VITE_API_BASE_URL` fails loudly at boot instead of as a mystery network error.
 */
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawApiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set. Copy .env.example to .env.local.');
}

export const config = Object.freeze({
  apiBaseUrl: rawApiBaseUrl.replace(/\/+$/, ''),
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
  isProduction: import.meta.env.PROD,
});
