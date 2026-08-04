import {
  FileText,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES, type Role } from '@/lib/constants';

export type NavItem = {
  readonly label: string;
  readonly to: string;
  readonly icon: LucideIcon;
  /** `end` prevents "/" from matching every nested route. */
  readonly end: boolean;
  /**
   * Roles allowed to SEE this entry.
   *
   * This is navigation hygiene, not access control. The API enforces the same rules
   * with `requireAdmin` on the router, and `<RequireRole>` enforces them again on the
   * route — hiding a link has never stopped anyone from typing the URL.
   */
  readonly roles: readonly Role[];
};

const BOTH: readonly Role[] = ['ADMIN', 'EDITOR'];
const ADMIN_ONLY: readonly Role[] = ['ADMIN'];

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Përmbledhje',
    to: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    end: true,
    roles: ADMIN_ONLY,
  },
  { label: 'Aplikimet', to: ROUTES.SUBMISSIONS, icon: Inbox, end: false, roles: BOTH },
  { label: 'Trajnimet', to: ROUTES.TRAININGS, icon: GraduationCap, end: false, roles: BOTH },
  { label: 'Format', to: ROUTES.FORMS, icon: ListChecks, end: false, roles: BOTH },
  { label: 'Lajme', to: ROUTES.POSTS, icon: FileText, end: false, roles: BOTH },
  { label: 'Regjistri', to: ROUTES.AUDIT, icon: ScrollText, end: false, roles: ADMIN_ONLY },
  { label: 'Përdoruesit', to: ROUTES.USERS, icon: Users, end: false, roles: ADMIN_ONLY },
  { label: 'Cilësimet', to: ROUTES.SETTINGS, icon: Settings, end: false, roles: ADMIN_ONLY },
];

/** The entries a given role may see. An unauthenticated caller sees nothing. */
export function navItemsForRole(role: Role | null): readonly NavItem[] {
  if (!role) {
    return [];
  }
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/**
 * Landing route per role.
 *
 * An EDITOR has no Përmbledhje, so sending them to "/" after login would greet them
 * with the access-denied screen. They start in the inbox, which is their actual job.
 */
export function homeRouteForRole(role: Role | null): string {
  return role === 'ADMIN' ? ROUTES.DASHBOARD : ROUTES.SUBMISSIONS;
}
