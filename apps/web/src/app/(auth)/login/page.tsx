'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { FormField, FormErrorBanner } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-mono text-base font-bold tracking-tight text-foreground">SenDT</span>
        <Link
          href="/register"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Create account
        </Link>
      </header>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[360px] animate-slide-up">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Sign in to your account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <FormField label="Email address">
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                hasError={!!error}
              />
            </FormField>

            <FormField label="Password">
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  hasError={!!error}
                  className="pr-11"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground active:scale-90"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            {error && <FormErrorBanner message={error} />}

            <div className="pt-1">
              <Button type="submit" loading={isLoading} size="lg">
                {!isLoading && <ArrowRight className="h-4 w-4" />}
                Sign in
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-foreground underline-offset-2 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
