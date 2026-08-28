import type { Metadata } from 'next';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@/globals.css';
import { Providers } from '@/components/providers';
import { themeScript } from '@/stores/theme';
import { localeScript } from '@/stores/locale';

export const metadata: Metadata = {
  title: 'LinkPilot',
  description: 'Your private AI career copilot',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-theme="dark" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `${themeScript()}${localeScript()}` }} />
      </head>
      <body className="h-full bg-background text-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
