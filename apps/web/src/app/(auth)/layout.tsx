'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && user) router.replace('/dashboard');
  }, [user, _hasHydrated, router]);

  if (!_hasHydrated) return null;
  if (user) return null;

  return <>{children}</>;
}
