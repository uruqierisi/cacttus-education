/// <reference types="vite/client" />

/**
 * Typed build-time configuration.
 *
 * Declared as a required `string` rather than `string | undefined` because
 * `marketing/lib/config.ts` validates it at module load and throws when it is
 * missing — by the time any caller reads it, it is guaranteed present.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
