'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginPage } from './login-page';
import { SignupPage } from './signup-page';
import { Logo } from './logo';

export function AuthPage() {
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
          <div className="mt-8 hidden md:block">
            <img src="https://placehold.co/400x300.png" data-ai-hint="abstract illustration" alt="MemoIQ Illustration" className="rounded-lg shadow-lg" />
          </div>
        </div>
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>Choose how you want to sign in to your workspace.</CardDescription>
            </CardHeader>
            <CardContent>
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
