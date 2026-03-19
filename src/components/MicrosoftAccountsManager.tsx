'use client';

import * as React from 'react';
import { useAuth, MicrosoftAccount } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Plus, Mail, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MicrosoftAccountsManager() {
    const { user, removeMicrosoftAccount, addMicrosoftAccount } = useAuth();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = React.useState(false);
    const [syncingAccounts, setSyncingAccounts] = React.useState<Record<string, boolean>>({});

    const accounts = React.useMemo(() => {
        if (!user?.integrations?.microsoftAccounts) return [];
        return Object.values(user.integrations.microsoftAccounts);
    }, [user?.integrations?.microsoftAccounts]);

    React.useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data?.type === 'MS_AUTH_SUCCESS') {
                toast({
                    title: 'Account Connected',
                    description: `Successfully connected ${event.data.email}`,
                });
                setIsAdding(false);
            } else if (event.data?.type === 'MS_AUTH_ERROR') {
                toast({
                    variant: 'destructive',
                    title: 'Connection Failed',
                    description: event.data.message || 'An error occurred during authentication',
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
        const state = user.uid;
        // Fetch the OAuth URL from the server-side API route
        const res = await fetch(`/api/microsoft/auth-url?state=${encodeURIComponent(state)}`);
        const { url } = await res.json();
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
            url,
            'microsoft-oauth',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    const handleSyncAccount = async (email: string) => {
        if (!user) return;
        setSyncingAccounts(prev => ({ ...prev, [email]: true }));
        try {
            const res = await fetch('/api/microsoft/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, email }),
            });
            const result = await res.json();
            
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
                title: 'Sync Failed',
                description: error.message,
            });
        } finally {
            setSyncingAccounts(prev => ({ ...prev, [email]: false }));
        }
    };

    const handleRemoveAccount = async (email: string) => {
        try {
            await removeMicrosoftAccount(email);
            toast({
                title: 'Account Removed',
                description: `Successfully removed ${email}`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove account',
            });
        }
    };

    return (
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-300 dark:to-indigo-500">
                        Microsoft 365 Accounts
                    </CardTitle>
                    <CardDescription>
                        Manage multiple M365 accounts for Outlook and Calendar.
                    </CardDescription>
                </div>
                <Button 
                    onClick={handleAddAccount} 
                    disabled={isAdding}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                >
                    {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Account
                </Button>
            </CardHeader>
            <CardContent>
                {accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 border-2 border-dashed border-border/40 rounded-xl bg-muted/30">
                        <div className="relative">
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative p-3 rounded-full bg-background border border-border shadow-sm">
                                <Mail className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">No accounts connected</p>
                            <p className="text-xs text-muted-foreground max-w-[200px]">
                                Connect your M365 accounts to sync your mail and calendar.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {accounts.map((account) => (
                            <div 
                                key={account.email}
                                className="group relative flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background/80 hover:border-blue-500/30 transition-all duration-300"
                            >
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-blue-500/10">
                                        <AvatarImage src={account.photoURL} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 font-bold">
                                            {account.displayName?.[0] || 'M'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground leading-none">
                                            {account.displayName}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center">
                                            {account.email}
                                            {account.status === 'connected' ? (
                                                <span className="ml-2 flex items-center text-[10px] text-emerald-500 font-medium">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                                                </span>
                                            ) : (
                                                <span className="ml-2 flex items-center text-[10px] text-amber-500 font-medium">
                                                    <AlertCircle className="mr-1 h-3 w-3" /> Reconnect
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleSyncAccount(account.email)}
                                        disabled={syncingAccounts[account.email]}
                                        className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${syncingAccounts[account.email] ? 'animate-spin text-blue-500' : ''}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveAccount(account.email)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
