import { forwardRef, useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-xl border bg-surface px-3 text-ink placeholder:text-ink-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60';
const stateClass = (invalid: boolean) =>
  invalid ? 'border-danger' : 'border-line-strong hover:border-ink-subtle';

interface FieldShellProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, hint, error, id, className, wrapperClassName, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        className={cn(control, 'h-11', stateClass(Boolean(error)), className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...props}
      />
    </FieldShell>
  );
});

export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, hint, error, id, className, ...props }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <FieldShell id={fieldId} label={label} hint={hint} error={error}>
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(control, 'min-h-24 py-2', stateClass(Boolean(error)), className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
      </FieldShell>
    );
  },
);

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, id, className, wrapperClassName, children, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select
        ref={ref}
        id={fieldId}
        className={cn(control, 'h-11', stateClass(Boolean(error)), className)}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export function CheckboxField({ label, id, className, ...props }: CheckboxFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label
      htmlFor={fieldId}
      className={cn('inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm', className)}
    >
      <input id={fieldId} type="checkbox" className="h-4 w-4 rounded accent-accent" {...props} />
      <span>{label}</span>
    </label>
  );
}
