import type {Metadata} from 'next';
import './globals.css';
import { AppContent } from '@/components/app-content';
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/contexts/theme-context';

export const metadata: Metadata = {
  title: 'MemoIQ',
  description: 'Your intelligent assistant for memos, tasks, and more.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
          <Providers>
            <AppContent>
              {children}
            </AppContent>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
