'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <TaskProvider>
                {children}
            </TaskProvider>
        </AuthProvider>
    );
}
