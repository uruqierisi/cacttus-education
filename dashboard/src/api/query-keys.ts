/**
 * Centralised react-query cache keys.
 *
 * Keeping them in one place is what makes targeted invalidation possible: a mutation
 * can invalidate `queryKeys.forms.all` without guessing how a list key was built.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  forms: {
    all: ['forms'] as const,
    list: (filters: Record<string, unknown>) => ['forms', 'list', filters] as const,
    archived: (filters: Record<string, unknown>) => ['forms', 'archived', filters] as const,
    detail: (id: string) => ['forms', 'detail', id] as const,
    fieldTypes: ['forms', 'field-types'] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    list: (filters: Record<string, unknown>) => ['submissions', 'list', filters] as const,
    detail: (id: string) => ['submissions', 'detail', id] as const,
    stats: ['submissions', 'stats'] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: (filters: Record<string, unknown>) => ['posts', 'list', filters] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    stats: ['posts', 'stats'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters: Record<string, unknown>) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (filters: Record<string, unknown>) => ['audit', 'list', filters] as const,
    actions: ['audit', 'actions'] as const,
  },
  stats: {
    all: ['stats'] as const,
    summary: ['stats', 'summary'] as const,
    timeseries: (granularity: string) => ['stats', 'timeseries', granularity] as const,
    byType: ['stats', 'by-type'] as const,
  },
  analytics: {
    /** Visitors + conversion. Null-tolerant by design — see `api/analytics.api.ts`. */
    overview: ['analytics', 'overview'] as const,
  },
} as const;
