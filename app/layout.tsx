import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@/globals.css';
import { Providers } from '@/components/providers';
import { themeScript } from '@/stores/theme';
import { localeScript } from '@/stores/locale';
import { ServiceWorkerRegister } from '@/components/common/service-worker-register';

export const metadata: Metadata = {
  title: 'LinkPilot',
  description: 'Your private AI career copilot',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  appleWebApp: {
    capable: true,
    title: 'LinkPilot',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-theme="dark" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `${themeScript()}${localeScript()}` }} />
      </head>
      <body className="h-full bg-background text-text">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
