'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';
import { ContactProvider } from '@/contexts/contact-context';
import { Toaster } from './ui/toaster';
import { CalendarProvider } from '@/contexts/calendar-context';
import { ScribeProvider } from '@/contexts/scribe-context';
import { StorageProvider } from '@/contexts/storage-context';
import { MemoProvider } from './memos-page';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <StorageProvider>
                <TaskProvider>
                    <ContactProvider>
                        <CalendarProvider>
                            <MemoProvider>
                                <ScribeProvider>
                                    {children}
                                    <Toaster />
                                </ScribeProvider>
                            </MemoProvider>
                        </CalendarProvider>
                    </ContactProvider>
                </TaskProvider>
            </StorageProvider>
        </AuthProvider>
    );
}
