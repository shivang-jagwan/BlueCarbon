import * as React from 'react';
import './globals.css';
import { Inter, Outfit } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/sonner';
import { SuppressFramerMotionErrors } from '@/components/providers/suppress-framer-errors';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap', preload: false });

export const metadata = {
  title: 'CarbonRush AI — Blue Carbon MRV Platform',
  description: 'Measurement, Reporting, and Verification platform for blue carbon projects',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${display.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SuppressFramerMotionErrors />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
