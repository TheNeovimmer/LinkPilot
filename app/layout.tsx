import type { Metadata } from 'next';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@/globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'LinkPilot',
  description: 'Your private AI career copilot',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-background text-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
