/**
 * Visitor analytics — the ONE seam the overview screen reads traffic numbers through.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * No visitor source is wired up yet. Rather than scatter `?? '—'` and "not configured"
 * strings through the dashboard components, every traffic number the UI can display is
 * funnelled through a single `getAnalytics()` call that is allowed to return `null`.
 * The components already handle that null today, which means the day a real provider is
 * connected, NOT ONE COMPONENT CHANGES.
 *
 * HOW TO PLUG IN A REAL PROVIDER LATER
 * ------------------------------------
 * 1. Write an object satisfying `AnalyticsProvider` — a `name` and an `fetchTraffic()`
 *    returning `TrafficWindow | null`. It can call the Google Analytics Data API, an
 *    Umami `/api/websites/:id/stats` endpoint, a Plausible `/api/v1/stats/aggregate`,
 *    or a backend route of our own that proxies any of them (which is the right shape
 *    if the provider needs a secret — see the note on `fetchTraffic` below).
 * 2. Call `registerAnalyticsProvider(yourProvider)` once at startup, next to the other
 *    bootstrapping in `src/App.tsx`.
 * 3. Delete nothing. `getAnalytics()`, the query key, and every component stay as they
 *    are; `isConfigured` flips to true and the "—" placeholders fill themselves in.
 *
 * The provider contract is deliberately narrow — two monthly visitor counts — because
 * that is all the overview screen actually renders. Conversion rate is NOT part of it:
 * it is derived here from the application counts the API already returns, so a provider
 * can never disagree with our own submission numbers about how many leads we got.
 */

/** Raw traffic figures a provider is responsible for supplying. */
export type TrafficWindow = {
  readonly visitorsThisMonth: number;
  /** Null when the provider has no data that far back; MoM then renders as "—". */
  readonly visitorsPreviousMonth: number | null;
};

export type AnalyticsProvider = {
  /** Shown in the UI note, e.g. "Plausible". Keep it short. */
  readonly name: string;
  /**
   * Fetch the current and previous month's unique visitors.
   *
   * Return `null` — do not throw — for "configured but no data yet". Throwing is
   * reserved for genuine failures and is caught by `getAnalytics`, which degrades to
   * `null` as well, because a broken traffic widget must never take down the
   * application counts sitting next to it.
   *
   * NOTE ON SECRETS: a browser-side provider must never hold a GA service-account key
   * or a Plausible API key — anything in this bundle is public. Implement those as a
   * thin call to a backend route that holds the credential server-side.
   */
  readonly fetchTraffic: () => Promise<TrafficWindow | null>;
};

export type AnalyticsOverview = {
  readonly providerName: string;
  readonly visitorsThisMonth: number;
  readonly visitorsPreviousMonth: number | null;
  /** Month-over-month visitor change, null when it cannot be computed. */
  readonly visitorsChangePercent: number | null;
  /** Applications ÷ visitors, as a percentage. Null when visitors is 0 or unknown. */
  readonly conversionRate: number | null;
  readonly conversionChangePercent: number | null;
};

/** Application counts, supplied by the caller from `/api/admin/stats/summary`. */
export type ConversionInput = {
  readonly applicationsThisMonth: number;
  readonly applicationsPreviousMonth: number;
};

const PERCENT_FACTOR = 100;
const PERCENT_DECIMALS = 1;

function round(value: number): number {
  return Number(value.toFixed(PERCENT_DECIMALS));
}

/** Null rather than Infinity when the baseline is zero — see `formatPercentChange`. */
function percentChange(current: number, previous: number | null): number | null {
  if (previous === null || previous <= 0) {
    return null;
  }
  return round(((current - previous) / previous) * PERCENT_FACTOR);
}

function conversion(applications: number, visitors: number | null): number | null {
  if (visitors === null || visitors <= 0) {
    return null;
  }
  return round((applications / visitors) * PERCENT_FACTOR);
}

/**
 * The active provider. Null means "analytics not configured", which is the current
 * state of this project and a fully supported one — not an error.
 */
let provider: AnalyticsProvider | null = null;

export function registerAnalyticsProvider(next: AnalyticsProvider | null): void {
  provider = next;
}

/** Whether a provider has been registered. Drives the small "not configured" note. */
export function isAnalyticsConfigured(): boolean {
  return provider !== null;
}

/**
 * The single entry point the UI calls.
 *
 * Returns `null` in all three "we cannot show traffic" cases — no provider, provider
 * has no data, provider failed — so the caller has exactly one branch to write instead
 * of three. Every component that consumes this already renders an em dash for null.
 */
export async function getAnalytics(input: ConversionInput): Promise<AnalyticsOverview | null> {
  if (!provider) {
    return null;
  }

  let traffic: TrafficWindow | null = null;

  try {
    traffic = await provider.fetchTraffic();
  } catch {
    // Degrade, never propagate: the applications and inbox cards share this screen and
    // must keep rendering even when the traffic vendor is down. The failure is visible
    // to the user as a "—" plus the not-configured note, not as a blank dashboard.
    return null;
  }

  if (!traffic) {
    return null;
  }

  const currentConversion = conversion(input.applicationsThisMonth, traffic.visitorsThisMonth);
  const previousConversion = conversion(
    input.applicationsPreviousMonth,
    traffic.visitorsPreviousMonth,
  );

  return {
    providerName: provider.name,
    visitorsThisMonth: traffic.visitorsThisMonth,
    visitorsPreviousMonth: traffic.visitorsPreviousMonth,
    visitorsChangePercent: percentChange(traffic.visitorsThisMonth, traffic.visitorsPreviousMonth),
    conversionRate: currentConversion,
    conversionChangePercent:
      currentConversion === null || previousConversion === null
        ? null
        : percentChange(currentConversion, previousConversion),
  };
}
