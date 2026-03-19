'use client';

import { useState, useEffect } from 'react';
import { useAuth, GoogleAccount } from '@/contexts/auth-context';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Plus, Mail, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGoogleAuthUrl } from '@/services/google-oauth';
import { syncGoogleAccount } from '@/services/google-sync';

export default function GoogleAccountsManager() {
    const { user, removeGoogleAccount } = useAuth();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [syncingAccounts, setSyncingAccounts] = useState<Record<string, boolean>>({});

    // Listen for messages from the OAuth popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                toast({
                    title: 'Account Connected',
                    description: `Successfully connected ${event.data.email}`,
                });
                setIsAdding(false);
            } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
                toast({
                    variant: 'destructive',
                    title: 'Authentication Error',
                    description: event.data.message,
                });
                setIsAdding(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [toast]);

    const handleAddAccount = async () => {
        if (!user) return;
        setIsAdding(true);
        try {
            const state = user.uid; // Pass userId as state
            const authUrl = await getGoogleAuthUrl(state);
            
            // Open popup
            const width = 500;
            const height = 600;
            const left = window.screenX + (window.innerWidth - width) / 2;
            const top = window.screenY + (window.innerHeight - height) / 2;
            
            window.open(
                authUrl,
                'google-oauth-popup',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to start Google authentication flow.',
            });
            setIsAdding(false);
        }
    };

    const handleRemoveAccount = async (email: string) => {
        try {
            await removeGoogleAccount(email);
            toast({
                title: 'Account Removed',
                description: `${email} has been disconnected.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove account.',
            });
        }
    };

    const handleSyncAccount = async (email: string) => {
        if (!user) return;
        setSyncingAccounts(prev => ({ ...prev, [email]: true }));
        try {
            const result = await syncGoogleAccount(user.uid, email);
            
            if (result.success) {
                toast({
                    title: 'Sync Complete',
                    description: `Successfully synced ${email}. (${result.summary?.emails} emails, ${result.summary?.calendar} events)`,
                });
            } else {
                throw new Error(result.message || 'Sync failed');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Sync Error',
                description: error.message,
            });
        } finally {
            setSyncingAccounts(prev => ({ ...prev, [email]: false }));
        }
    };

    const googleAccounts = user?.integrations?.googleAccounts || {};
    const accountList = Object.values(googleAccounts);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Google Accounts</h3>
                    <p className="text-sm text-muted-foreground italic">Add and manage multiple Google accounts for mail and calendar.</p>
                </div>
                <Button onClick={handleAddAccount} disabled={isAdding} size="sm" className="gap-2">
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add Account
                </Button>
            </div>

            {accountList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/20 border-dashed">
                    <Mail className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                    <p className="text-muted-foreground text-sm italic">No Google accounts linked yet.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {accountList.map((account) => (
                        <div key={account.email} className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                {account.photoURL ? (
                                    <img src={account.photoURL} alt={account.displayName} className="h-10 w-10 rounded-full border" />
                                ) : (
                                    <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full border">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold">{account.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{account.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleSyncAccount(account.email)}
                                    disabled={syncingAccounts[account.email]}
                                    title="Manual Sync"
                                >
                                    {syncingAccounts[account.email] ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveAccount(account.email)}
                                    title="Remove Account"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
