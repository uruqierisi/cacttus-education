/**
 * The marketing site's ONLY route to the backend.
 *
 * CREDENTIAL-FREE BY CONSTRUCTION
 * ------------------------------
 * Plain `fetch` with `credentials: 'omit'` — no cookies sent, no cookies stored, no
 * axios, no interceptors, no auth state. This is not an oversight to be "fixed" later:
 * the API answers this origin WITHOUT `Access-Control-Allow-Credentials` (see
 * backend/src/config/cors.ts), so a credentialed request from here would be blocked by
 * the browser anyway. More importantly, the marketing site renders operator-authored
 * content and is the more exposed of the two frontends; an XSS here must not be able to
 * reach an admin session. It talks to `/api/public/*` and nothing else.
 *
 * `credentials: 'omit'` is stated explicitly rather than relying on the `same-origin`
 * default. The default happens to be safe today only because the API is cross-origin in
 * dev; if the two ever landed on one origin, the default would start attaching cookies
 * silently. Being explicit means that change can never happen by accident.
 *
 * NOTHING in this app may import the dashboard's axios client.
 */
import { config } from './config'

const REQUEST_TIMEOUT_MS = 15_000

/* ─── Wire types (mirrors the backend's response envelope) ─── */

/** One rendered input, as defined by an admin in the dashboard's form builder. */
export type PublicFormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'

export type PublicFormOption = {
  readonly value: string
  readonly label: string
}

export type PublicFormField = {
  /** Stable snake_case key; becomes the property name inside `data`. */
  readonly name: string
  readonly label: string
  readonly type: PublicFormFieldType
  readonly required: boolean
  readonly placeholder?: string
  readonly helpText?: string
  readonly order: number
  readonly options: readonly PublicFormOption[]
}

export type PublicForm = {
  readonly slug: string
  readonly title: string
  readonly type: string
  readonly fields: readonly PublicFormField[]
}

/**
 * `name` / `email` / `phone` are promoted to real columns server-side and are always
 * required; every other answer travels in `data`, keyed by field name.
 */
export type PublicSubmission = {
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly data: Record<string, unknown>
  /** Honeypot. Real users leave it empty; a filled value is accepted then discarded. */
  readonly website?: string
  /**
   * OPTIONAL provenance — set only by a training's detail page, so the inbox can show
   * which training a lead came from. Omitted everywhere else (a form link shared on
   * social media has no training), which is why the submit contract is unchanged for
   * every existing caller.
   */
  readonly trainingId?: string
}

export type SubmissionReceipt = {
  readonly id: string
  readonly receivedAt: string
}

/** Field-level complaint from the API, e.g. `{ field: 'school_name', message: '...' }`. */
export type ApiErrorDetail = {
  readonly field?: string
  readonly message: string
}

type SuccessEnvelope<T> = { readonly success: true; readonly data: T }

type ErrorEnvelope = {
  readonly success: false
  readonly error: {
    readonly code: string
    readonly message: string
    readonly details?: readonly ApiErrorDetail[]
  }
}

/* ─── Typed error ─── */

/**
 * Every failure path — non-2xx, unreachable API, timeout, unparseable body — arrives
 * as this one type, so callers never have to guess what `catch (e)` holds.
 */
export class PublicApiError extends Error {
  /** 0 when the request never produced an HTTP response (offline, DNS, CORS, timeout). */
  readonly status: number
  readonly code: string
  readonly details: readonly ApiErrorDetail[]

  constructor(
    message: string,
    status: number,
    code: string,
    details: readonly ApiErrorDetail[] = [],
  ) {
    super(message)
    this.name = 'PublicApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** True when the form no longer exists, was deactivated, or the slug is wrong. */
  get isNotFound(): boolean {
    return this.status === 404
  }

  /** True when the server rejected the answers themselves (see `details`). */
  get isValidation(): boolean {
    return this.status === 400 || this.status === 422
  }
}

function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as ErrorEnvelope).error?.message === 'string'
  )
}

/* ─── Transport ─── */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // AbortSignal.timeout would be terser, but an explicit controller lets the timer be
  // cleared on the success path instead of being left to fire into a settled request.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response

  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...init,
      // The two lines this whole module exists to guarantee.
      credentials: 'omit',
      mode: 'cors',
      signal: controller.signal,
      headers: { Accept: 'application/json', ...init?.headers },
    })
  } catch (cause) {
    // Network-level failure: no response, so no status and no envelope to read.
    const isTimeout = cause instanceof DOMException && cause.name === 'AbortError'
    throw new PublicApiError(
      isTimeout ? 'Kërkesa skadoi. Provo përsëri.' : 'Nuk u arrit lidhja me serverin.',
      0,
      isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeoutId)
  }

  // Read the body once, defensively: an error page from a proxy is not JSON.
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (isErrorEnvelope(body)) {
      throw new PublicApiError(
        body.error.message,
        response.status,
        body.error.code,
        body.error.details ?? [],
      )
    }

    throw new PublicApiError(
      `Kërkesa dështoi (${response.status}).`,
      response.status,
      'HTTP_ERROR',
    )
  }

  const envelope = body as SuccessEnvelope<T> | null

  if (!envelope || envelope.success !== true) {
    throw new PublicApiError('Përgjigje e papritur nga serveri.', response.status, 'BAD_ENVELOPE')
  }

  return envelope.data
}

/* ─── Public surface ─── */

/**
 * Field definitions for a form, so the site renders whatever the admin configured
 * rather than a hard-coded set of inputs.
 *
 * Throws `PublicApiError` with `isNotFound` when the slug is unknown or the form has
 * been deactivated.
 */
export function getPublicForm(slug: string): Promise<PublicForm> {
  return request<PublicForm>(`/api/public/forms/${encodeURIComponent(slug)}`)
}

/**
 * Submit an application. The server re-validates every answer against the form's own
 * field definitions and silently drops keys it does not recognise, so this client's
 * validation is purely for UX — the server remains the source of truth.
 */
export function submitPublicForm(
  slug: string,
  payload: PublicSubmission,
): Promise<SubmissionReceipt> {
  return request<SubmissionReceipt>(`/api/public/forms/${encodeURIComponent(slug)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/* ─── Trainings ─── */

export type TrainingCategory =
  | 'PROGRAMIM'
  | 'ADMINISTRIM'
  | 'SIGURI_KIBERNETIKE'
  | 'MARKETING_DIZAJN'
  | 'MENAXHIM_PROJEKTEVE'
  | 'AFTESI_TE_BUTA'

export type TrainingFormat = 'KLASE' | 'HIBRID' | 'ONLINE'

/** A catalogue card. `applyUrl` is a PATH into this same SPA, not the form's URL. */
export type TrainingCard = {
  readonly slug: string
  readonly title: string
  readonly category: TrainingCategory
  readonly startDate: string | null
  readonly format: TrainingFormat
  readonly hours: number | null
  readonly instructor: string | null
  readonly city: string | null
  readonly applyUrl: string
}

export type TrainingDetail = TrainingCard & {
  /** Sent back as `trainingId` when applying, so the lead records where it came from. */
  readonly id: string
  readonly description: string | null
  readonly strengths: readonly string[]
  readonly syllabusPdf: string | null
  readonly formSlug: string
  /** Null when the linked form was renamed or switched off — hide the apply section. */
  readonly form: { readonly slug: string; readonly title: string } | null
}

export type TrainingFilters = {
  readonly categories: readonly TrainingCategory[]
  readonly cities: readonly string[]
}

export type TrainingQuery = {
  readonly category?: TrainingCategory
  readonly city?: string
}

function toQueryString(query: TrainingQuery): string {
  const params = new URLSearchParams()

  if (query.category) params.set('category', query.category)
  if (query.city) params.set('city', query.city)

  const encoded = params.toString()
  return encoded === '' ? '' : `?${encoded}`
}

/** The catalogue grid. Filtering server-side keeps the payload proportional to the view. */
export function getPublicTrainings(query: TrainingQuery = {}): Promise<readonly TrainingCard[]> {
  return request<readonly TrainingCard[]>(`/api/public/trainings${toQueryString(query)}`)
}

/**
 * Filter chips, derived from what is actually on live cards rather than from the enum —
 * a chip that leads to an empty grid is worse than no chip.
 */
export function getTrainingFilters(): Promise<TrainingFilters> {
  return request<TrainingFilters>('/api/public/trainings/filters')
}

/** Everything a detail page renders. Throws with `isNotFound` for an unknown slug. */
export function getTraining(slug: string): Promise<TrainingDetail> {
  return request<TrainingDetail>(`/api/public/trainings/${encodeURIComponent(slug)}`)
}
