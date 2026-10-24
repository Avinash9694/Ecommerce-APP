import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { useCart } from '@/features/cart/queries';
import { useCartUiStore } from '@/store/cart-ui-store';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  CartIcon,
  CloseIcon,
  LogoutIcon,
  MenuIcon,
  PackageIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from '@/components/ui/icons';

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-surface-2',
    isActive ? 'text-ink' : 'text-ink-muted',
  );

function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 rounded-lg text-lg font-semibold tracking-tight"
      aria-label="Northline home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
        <CartIcon size={16} />
      </span>
      <span>Northline</span>
    </Link>
  );
}

function SearchForm({ className, onSubmitted }: { className?: string; onSubmitted?: () => void }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = value.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
    setValue('');
    onSubmitted?.();
  };
  return (
    <form role="search" onSubmit={onSubmit} className={cn('relative', className)}>
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <SearchIcon
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
      />
      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products"
        className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      />
    </form>
  );
}

function AccountMenu() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-surface-2"
      >
        <UserIcon size={18} />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const item = 'flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm hover:bg-surface-2';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-fg">
          {user?.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{user?.name.split(' ')[0]}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-pop animate-rise"
        >
          <p className="truncate px-3 py-2 text-xs text-ink-muted">{user?.email}</p>
          <Link role="menuitem" to="/orders" className={item} onClick={() => setOpen(false)}>
            <PackageIcon size={16} /> Orders
          </Link>
          <Link role="menuitem" to="/account" className={item} onClick={() => setOpen(false)}>
            <UserIcon size={16} /> Account
          </Link>
          {isAdmin && (
            <Link role="menuitem" to="/admin" className={item} onClick={() => setOpen(false)}>
              <SettingsIcon size={16} /> Admin
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            className={cn(item, 'text-danger')}
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/');
            }}
          >
            <LogoutIcon size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { isAdmin } = useAuth();
  const cart = useCart();
  const toggleDrawer = useCartUiStore((s) => s.toggleDrawer);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = cart.data?.itemCount ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-2 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Logo />
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 md:flex">
          <NavLink to="/catalog" className={navClass}>
            Shop
          </NavLink>
          <NavLink to="/orders" className={navClass}>
            Orders
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          )}
        </nav>
        <SearchForm className="ml-auto hidden w-full max-w-xs md:block" />
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={toggleDrawer}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-2"
            aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-fg tabular-nums">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
          <AccountMenu />
        </div>
      </div>
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-line bg-surface px-4 pb-4 pt-3 md:hidden animate-rise"
        >
          <SearchForm className="mb-3" onSubmitted={() => setMenuOpen(false)} />
          <div className="flex flex-col">
            <NavLink to="/catalog" className={navClass} onClick={() => setMenuOpen(false)}>
              Shop
            </NavLink>
            <NavLink to="/orders" className={navClass} onClick={() => setMenuOpen(false)}>
              Orders
            </NavLink>
            <NavLink to="/account" className={navClass} onClick={() => setMenuOpen(false)}>
              Account
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navClass} onClick={() => setMenuOpen(false)}>
                Admin
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
