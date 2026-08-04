/**
 * Route table.
 *
 * Every page except the login screen is lazy-loaded, so the initial bundle contains
 * only the shell, the auth bootstrap and the login form. The heavy screens — the
 * Recharts overview and the Tiptap post editor — are the whole reason for that split:
 * neither belongs in the bundle an editor downloads to read the inbox.
 *
 * ADMIN-only sections sit under one `<RequireRole role="ADMIN">` layout route rather
 * than repeating the guard per screen. That still mirrors the API rather than
 * replacing it — every one of those endpoints is `requireAdmin`-gated server-side.
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingRows } from '@/components/common/state-views';
import { ProtectedRoute, PublicOnlyRoute, RequireRole } from './protected-route';
import LoginPage from '@/pages/login-page';

const DashboardPage = lazy(() => import('@/pages/dashboard-page'));
const FormsListPage = lazy(() => import('@/pages/forms/forms-list-page'));
const FormEditorPage = lazy(() => import('@/pages/forms/form-editor-page'));
const TrainingsPage = lazy(() => import('@/pages/trainings-page'));
const TrainingEditorPage = lazy(() => import('@/pages/trainings/training-editor-page'));
const SubmissionsListPage = lazy(() => import('@/pages/submissions/submissions-list-page'));
const SubmissionDetailPage = lazy(() => import('@/pages/submissions/submission-detail-page'));
const PostsListPage = lazy(() => import('@/pages/posts/posts-list-page'));
const PostEditorPage = lazy(() => import('@/pages/posts/post-editor-page'));
const AuditLogPage = lazy(() => import('@/pages/audit/audit-log-page'));
const UsersPage = lazy(() => import('@/pages/users/users-page'));
const SettingsPage = lazy(() => import('@/pages/settings-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));

function withSuspense(element: JSX.Element): JSX.Element {
  return <Suspense fallback={<LoadingRows rows={4} />}>{element}</Suspense>;
}

const routes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          // --- BOTH roles -------------------------------------------------
          { path: 'aplikimet', element: withSuspense(<SubmissionsListPage />) },
          { path: 'aplikimet/:id', element: withSuspense(<SubmissionDetailPage />) },
          { path: 'trajnimet', element: withSuspense(<TrainingsPage />) },
          // `i-ri` MUST precede `:id`, or "create" is parsed as an id and 404s on load.
          { path: 'trajnimet/i-ri', element: withSuspense(<TrainingEditorPage />) },
          { path: 'trajnimet/:id', element: withSuspense(<TrainingEditorPage />) },
          { path: 'format', element: withSuspense(<FormsListPage />) },
          { path: 'format/e-re', element: withSuspense(<FormEditorPage />) },
          { path: 'format/:id', element: withSuspense(<FormEditorPage />) },
          { path: 'lajme', element: withSuspense(<PostsListPage />) },
          { path: 'lajme/i-ri', element: withSuspense(<PostEditorPage />) },
          { path: 'lajme/:id', element: withSuspense(<PostEditorPage />) },

          // --- ADMIN only -------------------------------------------------
          {
            element: <RequireRole role="ADMIN" />,
            children: [
              { index: true, element: withSuspense(<DashboardPage />) },
              { path: 'regjistri', element: withSuspense(<AuditLogPage />) },
              { path: 'perdoruesit', element: withSuspense(<UsersPage />) },
              { path: 'cilesimet', element: withSuspense(<SettingsPage />) },
            ],
          },

          { path: '*', element: withSuspense(<NotFoundPage />) },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
