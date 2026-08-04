/**
 * Cilësimet — account and environment settings. ADMIN only.
 *
 * THIS PAGE IS WHY THE AXIOS INTERCEPTOR HAD TO BE FIXED. Changing your own password
 * bumps `passwordChangedAt` server-side, which invalidates every token issued before
 * that instant — the access token in memory AND the refresh cookie. So the moment this
 * mutation succeeds, the session is already dead:
 *
 *   next request -> 401 -> interceptor refreshes -> the refresh ALSO 401s
 *   -> `expireSession()` clears state and redirects to /login.
 *
 * That is the correct outcome and the form says so up front, rather than letting the
 * user discover it as a mysterious logout. The redirect is driven by the interceptor,
 * not by this component — which is exactly why it also works for the case where the
 * password is changed from another device.
 */
import { useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { changePassword } from '@/api/auth.api';
import { useAuth } from '@/hooks/use-auth';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { describeApiError } from '@/lib/api-error';
import { config } from '@/lib/config';
import { ROLE_LABELS } from '@/lib/constants';
import { isAnalyticsConfigured } from '@/api/analytics.api';

/** Mirrors the API's `MIN_PASSWORD_LENGTH`; the server validates it again. */
const MIN_PASSWORD_LENGTH = 12;

export default function SettingsPage(): JSX.Element {
  useDocumentTitle('Cilësimet');

  const { user, role } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): string | null => {
    if (currentPassword.length === 0) {
      return 'Shkruani fjalëkalimin aktual.';
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return `Fjalëkalimi i ri duhet të ketë së paku ${MIN_PASSWORD_LENGTH} karaktere.`;
    }
    if (newPassword !== confirmPassword) {
      return 'Fjalëkalimet e reja nuk përputhen.';
    }
    if (newPassword === currentPassword) {
      return 'Fjalëkalimi i ri duhet të jetë i ndryshëm nga ai aktual.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const problem = validate();
    setFormError(problem);

    if (problem) {
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({ currentPassword, newPassword });
      // No navigate() here on purpose — the interceptor owns the redirect, so this
      // path behaves identically to a password changed from another device.
      toast.success('Fjalëkalimi u ndryshua. Ju lutemi kyçuni sërish.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setFormError(describeApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Cilësimet" description="Llogaria juaj dhe konfigurimi i panelit." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ndrysho fjalëkalimin</CardTitle>
            <CardDescription>
              Për siguri, ndryshimi mbyll të gjitha sesionet — përfshirë këtë. Do të kyçeni
              sërish menjëherë pas ndryshimit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="max-w-md space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="current-password">Fjalëkalimi aktual</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Fjalëkalimi i ri</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Së paku {MIN_PASSWORD_LENGTH} karaktere.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmo fjalëkalimin e ri</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              {formError ? (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {formError}
                </p>
              ) : null}

              <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                <p className="text-muted-foreground">
                  Pas ndryshimit do të dilni automatikisht nga paneli në të gjitha pajisjet.
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Duke ndryshuar…' : 'Ndrysho fjalëkalimin'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Llogaria</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Emri</dt>
                  <dd className="font-medium">{user?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-all font-medium">{user?.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Roli</dt>
                  <dd>
                    <Badge variant="default">{role ? ROLE_LABELS[role] : '—'}</Badge>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sistemi</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Mjedisi</dt>
                  <dd className="font-medium">{config.appEnv}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">API</dt>
                  <dd className="break-all font-mono text-xs">{config.apiBaseUrl}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Analytics</dt>
                  <dd>
                    {isAnalyticsConfigured() ? (
                      <Badge variant="success">E konfiguruar</Badge>
                    ) : (
                      <Badge variant="muted">Jo ende e konfiguruar</Badge>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
