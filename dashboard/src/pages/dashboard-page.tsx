/**
 * Përmbledhje — the ADMIN overview.
 *
 * The route is already wrapped in `<RequireRole role="ADMIN">` and every endpoint it
 * calls is `requireAdmin`-gated server-side.
 *
 * LAYOUT NOTE: the chart row is deliberately 5/3 rather than two equal halves. The
 * time series is the screen's subject and needs horizontal room to be readable; the
 * donut is a four-value summary and is legible small. Splitting them 50/50 would give
 * the less informative chart equal billing and squeeze the more informative one.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Inbox, MousePointerClick, TrendingUp, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingRows } from '@/components/common/state-views';
import { StatusBadge } from '@/components/common/status-badge';
import { StatCard } from '@/components/dashboard/stat-card';
import { ApplicationsChart } from '@/components/dashboard/applications-chart';
import { TypeDonut } from '@/components/dashboard/type-donut';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatsByType, getStatsSummary, getStatsTimeseries } from '@/api/stats.api';
import { getAnalytics, isAnalyticsConfigured } from '@/api/analytics.api';
import { listSubmissions } from '@/api/submissions.api';
import { listPosts } from '@/api/posts.api';
import { listForms } from '@/api/forms.api';
import { queryKeys } from '@/api/query-keys';
import { FORM_TYPE_LABELS, ROUTES } from '@/lib/constants';
import { formatNumber, formatPercent, formatRelative } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/use-document-title';
import type { StatsGranularity } from '@/api/types';

const RECENT_COUNT = 5;
const TOP_FORMS_COUNT = 5;
const ANALYTICS_NOTE = 'Analytics jo ende e konfiguruar';

export default function DashboardPage(): JSX.Element {
  useDocumentTitle('Përmbledhje');

  const [granularity, setGranularity] = useState<StatsGranularity>('day');

  const summaryQuery = useQuery({
    queryKey: queryKeys.stats.summary,
    queryFn: getStatsSummary,
  });

  const timeseriesQuery = useQuery({
    queryKey: queryKeys.stats.timeseries(granularity),
    queryFn: () => getStatsTimeseries(granularity),
  });

  const byTypeQuery = useQuery({
    queryKey: queryKeys.stats.byType,
    queryFn: getStatsByType,
  });

  /**
   * Visitors + conversion.
   *
   * Depends on the summary because conversion is applications ÷ visitors, and the
   * application half must come from OUR numbers, never the analytics vendor's. With no
   * provider registered this resolves to `null` immediately — a successful query with a
   * null result, not an error — so the cards below render "—" without a red state.
   */
  const analyticsQuery = useQuery({
    queryKey: queryKeys.analytics.overview,
    enabled: summaryQuery.isSuccess,
    queryFn: () =>
      getAnalytics({
        applicationsThisMonth: summaryQuery.data?.currentMonth ?? 0,
        applicationsPreviousMonth: summaryQuery.data?.previousMonth ?? 0,
      }),
  });

  const recentSubmissions = useQuery({
    queryKey: queryKeys.submissions.list({ recent: RECENT_COUNT }),
    queryFn: () => listSubmissions({ page: 1, pageSize: RECENT_COUNT, order: 'desc' }),
  });

  const recentPosts = useQuery({
    queryKey: queryKeys.posts.list({ recent: RECENT_COUNT }),
    queryFn: () => listPosts({ page: 1, pageSize: RECENT_COUNT, sort: 'updatedAt', order: 'desc' }),
  });

  const topForms = useQuery({
    queryKey: queryKeys.forms.list({ top: TOP_FORMS_COUNT }),
    queryFn: () => listForms({ page: 1, pageSize: 100 }),
  });

  const analytics = analyticsQuery.data ?? null;
  const analyticsNote = isAnalyticsConfigured() ? undefined : ANALYTICS_NOTE;

  return (
    <>
      <PageHeader
        title="Përmbledhje"
        description="Aplikimet, trafiku dhe përmbajtja në një vend."
        actions={
          <Button asChild variant="outline">
            <Link to={ROUTES.SUBMISSIONS}>Hap aplikimet</Link>
          </Button>
        }
      />

      {/* ------------------------------------------------------------ cards */}
      {summaryQuery.isPending ? (
        <LoadingRows rows={2} />
      ) : summaryQuery.isError ? (
        <ErrorState error={summaryQuery.error} onRetry={() => void summaryQuery.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Aplikime këtë muaj"
            value={summaryQuery.data.currentMonth}
            changePercent={summaryQuery.data.changePercent}
            icon={TrendingUp}
          />
          <StatCard
            label="Aplikime të patrajtuara"
            value={summaryQuery.data.newCount}
            icon={Inbox}
            isHighlighted
            note="Statusi ende «I ri»"
          />
          <StatCard
            label="Vizitorë këtë muaj"
            value={analytics?.visitorsThisMonth ?? null}
            changePercent={analytics?.visitorsChangePercent ?? null}
            icon={Users}
            note={analyticsNote}
          />
          <StatCard
            label="Rata e konvertimit"
            value={analytics?.conversionRate ?? null}
            displayValue={formatPercent(analytics?.conversionRate ?? null)}
            changePercent={analytics?.conversionChangePercent ?? null}
            icon={MousePointerClick}
            note={analyticsNote}
          />
        </div>
      )}

      {/* ----------------------------------------------------------- charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-8">
        <Card className="xl:col-span-5">
          <CardContent className="p-6">
            {timeseriesQuery.isPending ? (
              <LoadingRows rows={4} />
            ) : timeseriesQuery.isError ? (
              <ErrorState
                error={timeseriesQuery.error}
                onRetry={() => void timeseriesQuery.refetch()}
              />
            ) : (
              <ApplicationsChart
                points={timeseriesQuery.data.points}
                granularity={granularity}
                onGranularityChange={setGranularity}
                isFetching={timeseriesQuery.isFetching}
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Aplikimet sipas programit</CardTitle>
          </CardHeader>
          <CardContent>
            {byTypeQuery.isPending ? (
              <LoadingRows rows={4} />
            ) : byTypeQuery.isError ? (
              <ErrorState error={byTypeQuery.error} onRetry={() => void byTypeQuery.refetch()} />
            ) : (
              <TypeDonut items={byTypeQuery.data.items} total={byTypeQuery.data.total} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------- bottom */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aplikimet e fundit</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.isPending ? (
              <LoadingRows rows={RECENT_COUNT} />
            ) : recentSubmissions.isError ? (
              <ErrorState
                error={recentSubmissions.error}
                onRetry={() => void recentSubmissions.refetch()}
              />
            ) : recentSubmissions.data.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Ende nuk ka aplikime.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentSubmissions.data.items.map((submission) => (
                  <li key={submission.id} className="flex items-center gap-3 py-3">
                    <Link
                      to={ROUTES.SUBMISSION_DETAIL(submission.id)}
                      className="min-w-0 flex-1 text-sm font-medium hover:underline"
                    >
                      <span className="block truncate">{submission.name}</span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        {submission.formTitle} · {formatRelative(submission.createdAt)}
                      </span>
                    </Link>
                    <StatusBadge status={submission.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blogs të fundit</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.isPending ? (
              <LoadingRows rows={RECENT_COUNT} />
            ) : recentPosts.isError ? (
              <ErrorState error={recentPosts.error} onRetry={() => void recentPosts.refetch()} />
            ) : recentPosts.data.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Ende nuk ka artikuj.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentPosts.data.items.map((post) => (
                  <li key={post.id} className="flex items-center gap-3 py-3">
                    <Link
                      to={ROUTES.POST_EDIT(post.id)}
                      className="min-w-0 flex-1 text-sm font-medium hover:underline"
                    >
                      <span className="block truncate">{post.title}</span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        {post.author.name} · {formatRelative(post.updatedAt)}
                      </span>
                    </Link>
                    {post.published ? (
                      <Badge variant="success">Publikuar</Badge>
                    ) : (
                      <Badge variant="muted">Draft</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Format më aktive</CardTitle>
          </CardHeader>
          <CardContent>
            {topForms.isPending ? (
              <LoadingRows rows={TOP_FORMS_COUNT} />
            ) : topForms.isError ? (
              <ErrorState error={topForms.error} onRetry={() => void topForms.refetch()} />
            ) : topForms.data.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Ende nuk ka forma.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {[...topForms.data.items]
                  .sort((a, b) => b.submissionCount - a.submissionCount)
                  .slice(0, TOP_FORMS_COUNT)
                  .map((form) => (
                    <li key={form.id} className="flex items-center gap-3 py-3">
                      <Link
                        to={ROUTES.FORM_EDIT(form.id)}
                        className="min-w-0 flex-1 text-sm font-medium hover:underline"
                      >
                        <span className="block truncate">{form.title}</span>
                        <span className="block truncate text-xs font-normal text-muted-foreground">
                          {FORM_TYPE_LABELS[form.type]}
                        </span>
                      </Link>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatNumber(form.submissionCount)}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
