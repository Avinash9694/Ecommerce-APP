import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from './icons';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  link?: { to: string; label: string };
  actions?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  link,
  actions,
}: SectionHeadingProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {link && (
        <Link
          to={link.to}
          className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          {link.label}
          <ArrowRightIcon size={16} />
        </Link>
      )}
      {actions}
    </div>
  );
}
