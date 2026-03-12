'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ToastContainer } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth.store';
import { useEvents } from '@/hooks/use-events';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Overview',
  '/send':         'Send Money',
  '/transactions': 'History',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, _hasHydrated } = useAuthStore();
  const pageTitle = PAGE_TITLES[pathname] ?? 'SenDT';

  useEvents();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) router.replace('/login');
  }, [user, _hasHydrated, router]);

  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/10 border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
        <h1 className="text-[15px] font-semibold tracking-tight text-foreground">{pageTitle}</h1>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-lg px-4 py-6">{children}</div>
      </main>

      <BottomNav />
      <ToastContainer />
    </div>
  );
}
