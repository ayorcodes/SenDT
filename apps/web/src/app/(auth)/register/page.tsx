'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { FormField, FormErrorBanner } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await register({ name, email, phone, password });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-mono text-base font-bold tracking-tight text-foreground">SenDT</span>
        <Link
          href="/login"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[360px] animate-slide-up">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create account</h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Start spending your crypto in minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <FormField label="Full name">
              <Input
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ayo Ogundimu"
                hasError={!!error}
              />
            </FormField>

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

            <FormField label="Phone number" hint="We'll use this for account verification">
              <Input
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                hasError={!!error}
                mono
              />
            </FormField>

            <FormField label="Password" hint="Minimum 8 characters">
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
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
                Create account
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-foreground underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-[11px] text-muted-foreground/60 leading-relaxed">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
}
