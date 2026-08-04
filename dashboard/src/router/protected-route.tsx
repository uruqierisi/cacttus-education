import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES, type Role } from '@/lib/constants';
import { LoadingRows } from '@/components/common/state-views';
import { homeRouteForRole } from '@/components/layout/nav-items';

function BootstrapSkeleton({ rows }: { rows: number }): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <LoadingRows rows={rows} />
    </div>
  );
}

/**
 * Gate for authenticated routes.
 *
 * While the silent-refresh bootstrap is in flight the route renders a skeleton rather
 * than redirecting, otherwise every hard reload would flash the login screen.
 */
export function ProtectedRoute(): JSX.Element {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <BootstrapSkeleton rows={4} />;
  }

  if (status === 'unauthenticated') {
    // `from` lets the login page send the user back where they were heading.
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/** Inverse gate: keeps a signed-in user off the login screen. */
export function PublicOnlyRoute(): JSX.Element {
  const { status, role } = useAuth();

  if (status === 'loading') {
    return <BootstrapSkeleton rows={2} />;
  }

  if (status === 'authenticated') {
    return <Navigate to={homeRouteForRole(role)} replace />;
  }

  return <Outlet />;
}

/**
 * Role gate.
 *
 * A SECOND line of defence, never the only one. Every route wrapped here talks to an
 * endpoint that is already `requireAdmin`-gated server-side; this exists so an EDITOR
 * who types /perdoruesit gets a clear Albanian explanation instead of a screen full of
 * failed requests and red toasts.
 *
 * Usable two ways: as a layout route (`<Route element={<RequireRole role="ADMIN" />}>`)
 * when it has no children, or wrapped directly around an element.
 */
export function RequireRole({
  role,
  children,
}: {
  readonly role: Role;
  readonly children?: ReactNode;
}): JSX.Element {
  const { status, role: currentRole } = useAuth();

  if (status === 'loading') {
    return <BootstrapSkeleton rows={3} />;
  }

  if (currentRole !== role) {
    return <AccessDenied />;
  }

  return <>{children ?? <Outlet />}</>;
}

function AccessDenied(): JSX.Element {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-xl border border-border bg-background p-12 text-center"
    >
      <ShieldAlert className="h-7 w-7 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-semibold">Nuk keni qasje në këtë faqe</h1>
      <p className="text-sm text-muted-foreground">
        Kjo pjesë e panelit është vetëm për administratorët. Nëse mendoni se duhet ta keni
        qasjen, kontaktoni një administrator.
      </p>
    </div>
  );
}
