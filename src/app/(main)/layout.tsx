
'use client';

import { AppContent } from '@/components/app-content';
import ChancellorAssistant from '@/components/chancellor-assistant';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <AppContent>
        {children}
        <ChancellorAssistant />
      </AppContent>
  );
}
