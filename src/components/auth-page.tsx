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

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 2.04-4.54 2.04-3.64 0-6.58-3-6.58-6.6s2.94-6.6 6.58-6.6c2.02 0 3.42.82 4.22 1.58l2.6-2.58C18.04 1.32 15.48 0 12.48 0 5.88 0 .04 5.84.04 12s5.84 12 12.44 12c3.28 0 5.74-1.14 7.6-3.04 1.94-1.9 2.6-4.56 2.6-7.38 0-.82-.1-1.46-.24-2.1H12.48z" />
    </svg>
);

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
                 <Button variant="default" className="w-full" onClick={loginWithGoogle} disabled={loading}>
                    <GoogleIcon className="mr-2 h-4 w-4 fill-current" />
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
