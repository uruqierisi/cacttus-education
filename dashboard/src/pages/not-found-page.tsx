import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { homeRouteForRole } from '@/components/layout/nav-items';

export default function NotFoundPage(): JSX.Element {
  useDocumentTitle('Faqja nuk u gjet');

  const { role } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-5xl font-semibold text-primary">404</p>
      <h1 className="text-xl font-semibold">Kjo faqe nuk ekziston</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Linku mund të jetë i vjetruar, ose faqja mund të jetë zhvendosur.
      </p>
      {/* An EDITOR has no Përmbledhje, so "home" is role-dependent. */}
      <Button asChild>
        <Link to={homeRouteForRole(role)}>Kthehu në panel</Link>
      </Button>
    </div>
  );
}
