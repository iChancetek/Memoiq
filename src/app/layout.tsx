import type {Metadata} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { TaskProvider } from '@/contexts/task-context';
import { AuthProvider } from '@/contexts/auth-context';
import { AppContent } from '@/components/app-content';

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
    <html lang="en" className="dark">
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
      <body className="font-body antialiased">
        <AuthProvider>
            <TaskProvider>
                <AppContent>
                    {children}
                </AppContent>
                <Toaster />
            </TaskProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
