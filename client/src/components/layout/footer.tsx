import { Link } from 'react-router-dom';
import { GithubIcon, LinkedinIcon } from '@/components/ui/icons';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-lg font-semibold tracking-tight">Northline</p>
            <p className="mt-2 max-w-xs text-sm text-ink-muted">
              A full-stack storefront built to show how a real shop fits together: catalog, cart,
              checkout, orders and admin.
            </p>
          </div>
          <nav aria-label="Shop" className="text-sm">
            <p className="mb-2 font-medium">Shop</p>
            <ul className="flex flex-col gap-1.5 text-ink-muted">
              <li>
                <Link
                  className="inline-flex min-h-10 items-center hover:text-ink sm:min-h-0"
                  to="/catalog"
                >
                  All products
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-10 items-center hover:text-ink sm:min-h-0"
                  to="/catalog?sort=rating"
                >
                  Top rated
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-10 items-center hover:text-ink sm:min-h-0"
                  to="/orders"
                >
                  Your orders
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Account" className="text-sm">
            <p className="mb-2 font-medium">Account</p>
            <ul className="flex flex-col gap-1.5 text-ink-muted">
              <li>
                <Link
                  className="inline-flex min-h-10 items-center hover:text-ink sm:min-h-0"
                  to="/account"
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-10 items-center hover:text-ink sm:min-h-0"
                  to="/login"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-10 items-center hover:text-ink sm:min-h-0"
                  to="/register"
                >
                  Create account
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-sm text-ink-muted sm:flex-row sm:items-center">
          <p>
            Built by{' '}
            <a
              href="https://avinash9694.github.io"
              className="font-medium text-ink hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Avinash Sahu
            </a>
          </p>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/Avinash9694"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub profile"
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2 hover:text-ink"
            >
              <GithubIcon size={20} />
            </a>
            <a
              href="https://www.linkedin.com/in/A-v-i-n-a-s-h/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn profile"
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2 hover:text-ink"
            >
              <LinkedinIcon size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
