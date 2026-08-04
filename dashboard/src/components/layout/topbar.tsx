import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Settings, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { ROLE_LABELS, ROUTES } from '@/lib/constants';
import { describeApiError } from '@/lib/api-error';

type TopbarProps = {
  readonly onOpenSidebar: () => void;
};

export function Topbar({ onOpenSidebar }: TopbarProps): JSX.Element {
  const { user, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      toast.error(describeApiError(error));
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Hap menynë"
      >
        <Menu />
      </Button>

      <div className="ml-auto flex items-center gap-3">
        {role ? (
          <Badge variant="muted" className="hidden sm:inline-flex">
            {ROLE_LABELS[role]}
          </Badge>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <UserRound />
              <span className="hidden max-w-[12rem] truncate sm:inline">
                {user?.name ?? 'Llogaria'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-sm font-medium">{user?.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin ? (
              <DropdownMenuItem asChild>
                <Link to={ROUTES.SETTINGS}>
                  <Settings className="h-4 w-4" aria-hidden />
                  Cilësimet
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => void handleLogout()}>
              <LogOut className="h-4 w-4" aria-hidden />
              Dil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
