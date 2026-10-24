import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { registerSchema, zodFieldErrors } from '@/features/auth/auth-schemas';
import { errorMessage, fieldErrors } from '@/api';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/field';
import { toast } from '@/store/toast-store';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const { name, email, password } = parsed.data;
      const user = await register({ name, email, password });
      toast.success(`Welcome, ${user.name.split(' ')[0]}`);
      navigate(from, { replace: true });
    } catch (err) {
      const fields = fieldErrors(err);
      if (Object.keys(fields).length) setErrors(fields);
      else setFormError(errorMessage(err, 'Could not create your account'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-ink-muted">Takes about twenty seconds.</p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <InputField
            label="Full name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            required
          />
          <InputField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
          />
          <InputField
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="At least 8 characters"
            required
          />
          <InputField
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            required
          />
          {formError && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" isLoading={submitting}>
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" state={{ from }} className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
