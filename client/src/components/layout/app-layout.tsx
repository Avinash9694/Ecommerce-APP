import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './header';
import { Footer } from './footer';
import { DemoBanner } from './demo-banner';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { Toaster } from '@/components/ui/toaster';

export function AppLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
      >
        Skip to content
      </a>
      <DemoBanner />
      <Header />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <Toaster />
    </div>
  );
}
