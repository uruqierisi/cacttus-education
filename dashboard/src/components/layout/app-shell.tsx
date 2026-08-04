import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/** Persistent chrome around every authenticated route. */
export function AppShell(): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  // Navigating on mobile must close the drawer. The NavLink handlers cover taps on the
  // links themselves, but not browser back/forward or a programmatic redirect, which
  // would otherwise leave the overlay covering the page the user just landed on.
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="lg:pl-64">
        <Topbar onOpenSidebar={openSidebar} />

        <main className="mx-auto w-full max-w-[88rem] px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
