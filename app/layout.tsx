import type { Metadata } from 'next';
import './globals.css';
import { getServerSession } from 'next-auth';
import SessionProvider from '@/components/SessionProvider';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'HerSecure | Women\'s Safety Platform',
  description: 'Elite AI-powered personal security platform. Real-time protection, emergency SOS, safe routing, and intelligent threat detection.',
  keywords: ['women safety', 'SOS alert', 'personal security', 'emergency response', 'AI protection'],
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#F6F7FB" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0A0A0F" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="antialiased selection:bg-primary/20 selection:text-primary">
        <SessionProvider session={session}>
          <ThemeProvider>
            {/* Ambient layers */}
            <div className="mesh-bg" aria-hidden="true" />
            <div className="noise-overlay" aria-hidden="true" />

            {/* Main content */}
            <div className="relative z-10">
              {children}
            </div>

            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: 'var(--glass-strong)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--fg)',
                  borderRadius: '1rem',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '14px 20px',
                  boxShadow: 'var(--shadow-float)',
                },
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
