'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { MainLayout } from './main-layout';
import { Loader2 } from 'lucide-react';
import { Toaster } from './ui/toaster';

const AUTH_ROUTES = ['/login', '/signup', '/auth'];
const PUBLIC_ROUTES = ['/']; // Landing page

export function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (loading && !isPublicRoute) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If it's a public route and the user is not logged in, show the content directly
  if (isPublicRoute && !user) {
    return <>{children}</>;
  }

  if (isAuthRoute) {
    return <>{children}</>;
  }
  
  if (isPublicRoute && user) {
      return (
        <MainLayout>
          {children}
        </MainLayout>
      )
  }

  // For authenticated users on protected routes
  if (user) {
    return (
        <MainLayout>
        {children}
        </MainLayout>
    );
  }

  return <>{children}</>;
}
