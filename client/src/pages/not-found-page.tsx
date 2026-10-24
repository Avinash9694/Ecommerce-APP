import { LinkButton } from '@/components/ui/button';

export function NotFoundPage({ title = 'Page not found' }: { title?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="font-mono text-sm text-ink-subtle">404</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="max-w-sm text-ink-muted">
        The link may be out of date, or the item may have been removed from the store.
      </p>
      <div className="mt-2 flex gap-3">
        <LinkButton to="/">Go home</LinkButton>
        <LinkButton to="/catalog" variant="outline">
          Browse products
        </LinkButton>
      </div>
    </div>
  );
}
