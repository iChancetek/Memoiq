'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';
import { ContactProvider } from '@/contexts/contact-context';
import { Toaster } from './ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <TaskProvider>
                <ContactProvider>
                    {children}
                    <Toaster />
                </ContactProvider>
            </TaskProvider>
        </AuthProvider>
    );
}
