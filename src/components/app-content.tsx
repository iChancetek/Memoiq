'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { MainLayout } from './main-layout';
import { Loader2 } from 'lucide-react';

const AUTH_ROUTES = ['/login', '/signup', '/auth'];
const PUBLIC_ROUTES = ['/']; // Landing page

export function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // While loading, if not on a public route, show a spinner.
  if (loading && !isPublicRoute) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // If it's a public route and user is not logged in, show page.
  if (isPublicRoute && !user) {
    return <>{children}</>;
  }

  // If on an auth route, show the page (login/signup forms).
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // If a user is logged in, wrap the content in the main application layout.
  if (user) {
    return (
        <MainLayout>
          {children}
        </MainLayout>
    );
  }

  // Fallback for any other case (e.g. protected route with no user)
  // The auth context will handle redirection.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
