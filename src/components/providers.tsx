
'use client';

import * as React from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';
import { ContactProvider } from '@/contexts/contact-context';
import { Toaster } from './ui/toaster';
import { CalendarProvider } from '@/contexts/calendar-context';
import { MediScribeProvider } from '@/contexts/mediscribe-context';
import { StorageProvider } from '@/contexts/storage-context';
import { MemoProvider } from './memos-page';
import { LanguageProvider } from '@/contexts/language-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';

function DataProviders({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    // Only render data providers if a user is logged in.
    // This prevents race conditions where providers try to access Firestore
    // before the user is authenticated.
    if (!user) {
        return <>{children}</>;
    }

    return (
        <StorageProvider>
            <TaskProvider>
                <ContactProvider>
                    <CalendarProvider>
                        <MemoProvider>
                            <MediScribeProvider>
                                {children}
                            </MediScribeProvider>
                        </MemoProvider>
                    </CalendarProvider>
                </ContactProvider>
            </TaskProvider>
        </StorageProvider>
    );
}


export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <AuthProvider>
                <LanguageProvider>
                    <DataProviders>
                        {children}
                    </DataProviders>
                    <Toaster />
                </LanguageProvider>
            </AuthProvider>
        </FirebaseClientProvider>
    );
}
