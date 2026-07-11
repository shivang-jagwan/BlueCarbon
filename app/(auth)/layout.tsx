import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-dots opacity-30" />
      </div>

      <header className="relative z-10 flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>

      <footer className="relative z-10 px-4 py-6 text-center text-xs text-muted-foreground md:px-8">
        <p>
          CarbonRush AI — Blue Carbon MRV Platform. By continuing you agree to
          our Terms of Service and Privacy Policy.
        </p>
      </footer>
    </div>
  );
}
