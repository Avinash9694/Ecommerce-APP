import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { api, errorMessage, isDemoMode, resetDemoData } from '@/api';
import { Button } from '@/components/ui/button';
import { InputField, TextareaField } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/store/toast-store';
import { useQueryClient } from '@tanstack/react-query';

export function AccountPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // The profile query may resolve after first render on a cold load.
    if (user) setForm({ name: user.name, phone: user.phone ?? '', address: user.address ?? '' });
  }, [user]);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await api.auth.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      setUser(updated);
      toast.success('Profile saved');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    if (
      !window.confirm(
        'Reset all demo data? Accounts you created, carts and orders will be removed.',
      )
    )
      return;
    resetDemoData();
    queryClient.clear();
    logout();
    toast.info('Demo data reset');
    navigate('/');
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Account</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
          <span className="font-mono text-xs">{user?.email}</span>
          <Badge tone={user?.role === 'admin' ? 'accent' : 'neutral'}>{user?.role}</Badge>
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card"
        noValidate
      >
        <h2 className="text-lg font-semibold">Profile</h2>
        <InputField
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          autoComplete="name"
          required
        />
        <InputField
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          autoComplete="tel"
          hint="Used for delivery updates"
        />
        <TextareaField
          label="Default address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          autoComplete="street-address"
        />
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold">Session</h2>
        <p className="text-sm text-ink-muted">Signing out clears the token from this browser.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Sign out
          </Button>
          {isDemoMode && (
            <Button variant="danger" onClick={onReset}>
              Reset demo data
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
