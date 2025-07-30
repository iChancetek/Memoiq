'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';
import { ContactProvider } from '@/contexts/contact-context';
import { Toaster } from './ui/toaster';
import { CalendarProvider } from '@/contexts/calendar-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <TaskProvider>
                <ContactProvider>
                    <CalendarProvider>
                        {children}
                        <Toaster />
                    </CalendarProvider>
                </ContactProvider>
            </TaskProvider>
        </AuthProvider>
    );
}
