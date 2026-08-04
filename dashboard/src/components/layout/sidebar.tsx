import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/common/brand-logo';
import { useAuth } from '@/hooks/use-auth';
import { ROLE_LABELS } from '@/lib/constants';
import { navItemsForRole } from './nav-items';

type SidebarProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

/**
 * Fixed dark rail on desktop, off-canvas drawer under `lg`.
 *
 * z-index ladder for the shell: sidebar overlay 30 / sidebar 40 / topbar 30 /
 * Radix portals 50. Keeping it documented here prevents the classic "dropdown hides
 * behind the header" regression.
 *
 * The nav list is filtered by role. That is cosmetic only — see the note on
 * `NavItem.roles`.
 */
export function Sidebar({ isOpen, onClose }: SidebarProps): JSX.Element {
  const { user, role } = useAuth();
  const items = navItemsForRole(role);

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/50 lg:hidden"
          aria-label="Mbyll menynë"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground',
          'transition-transform duration-200 ease-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-5">
          {/* White lockup — this rail is the one dark surface in the app. */}
          <BrandLogo on="dark" className="h-7" />
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            onClick={onClose}
            aria-label="Mbyll menynë"
          >
            <X />
          </Button>
        </div>

        <nav aria-label="Menyja kryesore" className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                  {isActive ? (
                    <span className="ml-auto h-4 w-1 rounded-full bg-white/70" aria-hidden />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {user?.name ?? '—'}
          </p>
          <p className="truncate text-xs text-sidebar-muted">
            {role ? ROLE_LABELS[role] : '—'} · {config.appEnv}
          </p>
        </div>
      </aside>
    </>
  );
}
