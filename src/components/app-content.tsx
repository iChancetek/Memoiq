'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { MainLayout } from './main-layout';
import { Loader2 } from 'lucide-react';

const AUTH_ROUTES = ['/login', '/signup', '/auth'];

export function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
