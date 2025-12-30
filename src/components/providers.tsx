
'use client';

import * as React from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';
import { ContactProvider } from '@/contexts/contact-context';
import { Toaster } from './ui/toaster';
import { CalendarProvider } from '@/contexts/calendar-context';
import { MediScribeProvider } from '@/contexts/mediscribe-context';
import { StorageProvider } from '@/contexts/storage-context';
import { MemoProvider } from './memos-page';
import { LanguageProvider } from '@/contexts/language-context';
import { FirebaseClientProvider } from '@/firebase';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <AuthProvider>
                <LanguageProvider>
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
                    <Toaster />
                </LanguageProvider>
            </AuthProvider>
        </FirebaseClientProvider>
    );
}
