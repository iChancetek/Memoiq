
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, CalendarCheck, CheckSquare, Mic } from 'lucide-react';
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

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">MemoIQ</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-background">
           <div className="absolute top-0 left-0 -z-10 h-full w-full animated-gradient" />
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-primary via-primary/80 to-accent-foreground bg-clip-text text-transparent">
              MemoIQ — Intelligent Productivity, Reimagined
            </h1>
            <div className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground space-y-4">
                <p>
                    MemoIQ is an AI-powered productivity platform where every feature is driven by advanced artificial intelligence. From voice to automation, AI works behind the scenes to turn ideas into action, schedules into clarity, and daily workflows into effortless organization.
                </p>
                <p>
                    With AI-powered voice memos, tasks, calendars, appointments, contacts, and a personal AI companion, MemoIQ delivers a unified, intelligent experience. Integrated with Google Calendar and Google Contacts, with Microsoft 365 compatibility coming soon, MemoIQ keeps everything in sync—so you can focus on what matters most.
                </p>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth">
                  Get Started Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/learn-more">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Short Features Section */}
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
        
        {/* Call to Action Section */}
        <section className="py-20 md:py-28">
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
            <p>© 2026 MemoIQ. All Rights Reserved. Developed by Chancellor Minus I ChanceTEK | iChanceTEK</p>
        </div>
      </footer>
    </div>
  );
}
