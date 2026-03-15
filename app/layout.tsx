import type { Metadata } from 'next';
import './globals.css';
import { getServerSession } from 'next-auth';
import SessionProvider from '@/components/SessionProvider';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import PWARegistration from '@/components/PWARegistration';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'HerSecure | Women\'s Safety Platform',
  description: 'Elite AI-powered personal security platform. Real-time protection, emergency SOS, safe routing, and intelligent threat detection.',
  keywords: ['women safety', 'SOS alert', 'personal security', 'emergency response', 'AI protection'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HerSecure',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: 'HerSecure – Women\'s Safety Platform',
    description: 'Elite AI-powered personal security platform.',
    url: '/',
    siteName: 'HerSecure',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'HerSecure Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HerSecure – Women\'s Safety Platform',
    description: 'Elite AI-powered personal security platform.',
    images: ['/icon-512.png'],
  },
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
        {/* Viewport & PWA core */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS PWA support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HerSecure" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased selection:bg-primary/20 selection:text-primary">
        <SessionProvider session={session}>
          <ThemeProvider>
            <PWARegistration />
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
