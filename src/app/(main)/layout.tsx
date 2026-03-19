
'use client';

import { AppContent } from '@/components/app-content';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <AppContent>
        {children}
      </AppContent>
  );
}
