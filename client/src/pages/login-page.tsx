import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { loginSchema, zodFieldErrors } from '@/features/auth/auth-schemas';
import { DEMO_ACCOUNTS, errorMessage, isDemoMode } from '@/api';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/field';
import { toast } from '@/store/toast-store';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (values: { email: string; password: string }) => {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const user = await login(parsed.data);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(errorMessage(err, 'Could not sign in'));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(form);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your cart and orders are tied to your account.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <InputField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            required
          />
          <InputField
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            required
          />
          {formError && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" isLoading={submitting}>
            Sign in
          </Button>
        </form>
        {isDemoMode && (
          <div className="mt-6 rounded-xl border border-dashed border-line-strong p-4">
            <p className="text-sm font-medium">Demo accounts</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              One click signs you in; nothing leaves your browser.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  onClick={() => {
                    setForm({ email: account.email, password: account.password });
                    void submit({ email: account.email, password: account.password });
                  }}
                  disabled={submitting}
                  className="h-auto flex-col items-start gap-0 py-2"
                >
                  <span className="text-sm">Sign in as {account.label}</span>
                  <span className="font-mono text-xs font-normal text-ink-muted">
                    {account.email}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-ink-muted">
          New here?{' '}
          <Link to="/register" state={{ from }} className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
