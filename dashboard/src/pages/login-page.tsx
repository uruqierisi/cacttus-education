import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLogo } from '@/components/common/brand-logo';
import { useAuth } from '@/hooks/use-auth';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { describeApiError } from '@/lib/api-error';
import { ROUTES } from '@/lib/constants';
import { homeRouteForRole } from '@/components/layout/nav-items';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Emaili është i detyrueshëm.')
    .email('Shkruani një email të vlefshëm.'),
  password: z.string().min(1, 'Fjalëkalimi është i detyrueshëm.'),
});

type LoginValues = z.infer<typeof loginSchema>;

type LocationState = { from?: string } | null;

export default function LoginPage(): JSX.Element {
  useDocumentTitle('Kyçu');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues): Promise<void> => {
    setFormError(null);

    try {
      // `login` RETURNS the user rather than us reading `role` off the context: the
      // context value in this closure is still the pre-login render's, so an admin
      // would otherwise be sent to the editor's landing page.
      const signedIn = await login(values.email, values.password);
      const state = location.state as LocationState;
      navigate(state?.from ?? homeRouteForRole(signedIn.role), { replace: true });
    } catch (error) {
      setFormError(describeApiError(error));
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/*
        Brand panel. Hidden below `lg` so the phone shows the form immediately rather
        than making the user scroll past decoration to reach the password field.
      */}
      <aside className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        {/*
          h-14 (56px), up from h-9 (36px). "Education" is 16.8% of the lockup height,
          so h-9 rendered it at ~6px — legible only as a smudge. h-14 puts it at
          ~9.4px. Height only; `w-auto` in BrandLogo keeps the ratio locked.
        */}
        <BrandLogo on="dark" className="h-14" />

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Paneli i administrimit
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-muted">
            Menaxho aplikimet, format publike dhe lajmet e Cacttus Education nga një vend i
            vetëm.
          </p>
        </div>

        <p className="text-xs text-sidebar-muted">
          © {new Date().getFullYear()} Cacttus Education
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Black lockup on the light card — mirrored from the dark panel opposite.
              h-12 rather than the panel's h-14: narrower phone viewport, same reason
              for the bump (h-8 put "Education" at ~5.4px). */}
          <BrandLogo on="light" className="mb-10 h-12 lg:hidden" />

          <h1 className="text-2xl font-semibold tracking-tight">Kyçu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Përdor llogarinë tënde të Cacttus Education.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                placeholder="emri@cacttus.education"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Fjalëkalimi</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password ? (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {formError ? (
              <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Duke u kyçur…' : 'Kyçu'}
            </Button>
          </form>

          <p className="mt-8 text-xs text-muted-foreground">
            Ke harruar fjalëkalimin? Kërko nga një administrator ta rivendosë te{' '}
            <span className="font-medium">Përdoruesit</span>.
          </p>
        </div>
      </main>
    </div>
  );
}

/** Re-exported for the router's typed import; keeps ROUTES referenced in one place. */
export const LOGIN_ROUTE = ROUTES.LOGIN;
