
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Rocket, Mic, CheckSquare, CalendarCheck, Bot, ArrowLeft } from 'lucide-react';
import { Logo } from './logo';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string; }) => (
  <div className="p-6 bg-card rounded-lg shadow-md border border-border/50">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);


export function LearnMorePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">MemoIQ</span>
          </Link>
          <Button variant="outline" asChild>
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-muted/50">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">An Assistant for Every Part of Your Life</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From voice notes to smart scheduling, MemoIQ integrates seamlessly into your workflow.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Mic />}
                title="Voice Memos"
                description="Instantly capture your thoughts with your voice. Our AI transcribes and summarizes them for you."
              />
              <FeatureCard
                icon={<CheckSquare />}
                title="AI Task Management"
                description="Turn natural language into structured tasks with due dates, subtasks, and assigned contacts."
              />
              <FeatureCard
                icon={<CalendarCheck />}
                title="Intelligent Scheduling"
                description="Let your AI assistant find the perfect time for your appointments, checking for conflicts automatically."
              />
              <FeatureCard
                icon={<Bot />}
                title="iSkylar Companion"
                description="Get personalized briefings, strategic advice, and empathetic support from your friendly AI companion."
              />
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="py-20 md:py-28">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Seamless Integrations</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        MemoIQ includes native integration with Google services, allowing users to seamlessly connect their productivity workflow across platforms.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="p-8 bg-card rounded-lg border">
                        <h3 className="text-2xl font-bold mb-4">Currently Available</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Check className="h-6 w-6 text-green-500 mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Google Calendar Integration</h4>
                                    <p className="text-sm text-muted-foreground">Create, view, and manage appointments directly from MemoIQ. Sync events between MemoIQ and Google Calendar with user permission.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="h-6 w-6 text-green-500 mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Google Contacts Integration</h4>
                                    <p className="text-sm text-muted-foreground">Save, update, and manage contacts between MemoIQ and Google Contacts. Prevent duplicate contacts with intelligent matching.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                     <div className="p-8 bg-card rounded-lg border border-dashed">
                        <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Rocket className="h-6 w-6 text-primary mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Microsoft 365 Compatibility</h4>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                                        <li>Outlook Calendar integration</li>
                                        <li>Outlook Contacts integration</li>
                                        <li>Seamless cross-platform scheduling and contact sync</li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 md:py-28 bg-muted/50">
            <div className="container text-center">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Organized?</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Start your journey towards a more productive and mindful life today.
                </p>
                <div className="mt-8">
                    <Button size="lg" asChild>
                        <Link href="/auth">
                            Sign Up Now
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-8 text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} MemoIQ. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
