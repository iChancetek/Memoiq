'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginPage } from './login-page';
import { SignupPage } from './signup-page';
import { Logo } from './logo';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from './ui/separator';

export function AuthPage() {
  const { loginWithGoogle, loading } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center text-center md:text-left">
           <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
             <Logo className="h-12 w-12 text-primary" />
             <h1 className="text-5xl font-bold">MemoIQ</h1>
           </div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Welcome to MemoIQ
          </h2>
          <p className="mt-2 text-muted-foreground">
            With iSkylar, Your Friendly Companion.
          </p>
        </div>
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>Sign in with Google or use your email to continue.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button variant="outline" className="w-full" onClick={loginWithGoogle} disabled={loading}>
                    Sign In with Google
                </Button>
                <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-xs text-muted-foreground">OR</span>
                </div>
                 <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <LoginPage isCard={false} />
                    </TabsContent>
                    <TabsContent value="signup">
                        <SignupPage isCard={false} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
