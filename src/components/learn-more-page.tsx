
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Rocket, Mic, CheckSquare, CalendarCheck, Bot, ArrowLeft, PenSquare, Calendar, Users, Briefcase, Smile } from 'lucide-react';
import { Logo } from './logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const FeatureDetailCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string; }) => (
  <div className="flex items-start gap-4">
    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary mt-1 shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
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
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MemoIQ — AI-Powered Productivity, Seamlessly Connected</h1>
                <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
                    MemoIQ is a next-generation productivity platform where every feature is powered by advanced Artificial Intelligence. AI is embedded across the entire experience to help users work faster, stay organized, and reduce manual effort—whether through voice, automation, or intelligent assistance.
                </p>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28">
          <div className="container max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">AI-Powered Features</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              <FeatureDetailCard
                icon={<Mic />}
                title="Voice Memos"
                description="Capture thoughts naturally using voice. AI automatically transcribes, organizes, summarizes, and converts voice memos into actionable insights, tasks, or appointments."
              />
              <FeatureDetailCard
                icon={<PenSquare />}
                title="MediScribe"
                description="An intelligent AI scribe that transforms voice or text into structured, accurate documentation—designed for clarity, speed, and professional workflows."
              />
              <FeatureDetailCard
                icon={<CheckSquare />}
                title="Tasks"
                description="Create and manage tasks using natural language. AI helps prioritize, categorize, suggest deadlines, and keep work moving forward."
              />
              <FeatureDetailCard
                icon={<Calendar />}
                title="Calendar"
                description="AI intelligently manages your calendar by understanding availability, detecting conflicts, and helping you schedule efficiently across connected services."
              />
              <FeatureDetailCard
                icon={<CalendarCheck />}
                title="Appointments"
                description="Schedule, reschedule, and manage appointments effortlessly. AI assists with time optimization, reminders, and conflict prevention."
              />
              <FeatureDetailCard
                icon={<Users />}
                title="Contacts"
                description="Manage contacts smarter. AI helps organize, deduplicate, and enrich contact information for faster access and stronger relationships."
              />
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="py-20 md:py-28 bg-muted/30">
            <div className="container max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Seamless Integrations</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        MemoIQ integrates with Google Calendar and Google Contacts, allowing users to synchronize schedules and contacts effortlessly across platforms. Microsoft 365 integration is coming soon, expanding compatibility with Outlook Calendar and Contacts for an even more connected productivity experience.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground italic">
                        All integrations are optional, secure, and fully controlled by the user.
                    </p>
                </div>
            </div>
        </section>

        {/* Companions & Managers Section */}
        <section className="py-20 md:py-28">
            <div className="container max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">AI Companions & Intelligent Managers</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <Smile className="h-8 w-8 text-primary" />
                                <CardTitle>AI Companion</CardTitle>
                            </div>
                            <CardDescription>Your personal AI assistant that understands context, remembers preferences, and helps you navigate tasks, schedules, and information through natural conversation.</CardDescription>
                        </CardHeader>
                     </Card>
                     <Card>
                        <CardHeader>
                           <div className="flex items-center gap-3 mb-2">
                                <Bot className="h-8 w-8 text-primary" />
                                <CardTitle>Managers (AI-Powered Automation Layer)</CardTitle>
                            </div>
                            <CardDescription>MemoIQ includes intelligent AI managers that work behind the scenes to automate and optimize your workflow:</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> <strong>Tasks Manager:</strong> AI prioritizes, tracks, and organizes tasks.</li>
                                <li className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> <strong>Calendar Manager:</strong> AI monitors availability, conflicts, and scheduling efficiency.</li>
                                <li className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> <strong>Appointment Manager:</strong> AI handles booking logic, reminders, and updates.</li>
                                <li className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> <strong>Contacts Manager:</strong> AI maintains clean, organized, and up-to-date contacts.</li>
                            </ul>
                        </CardContent>
                     </Card>
                </div>
            </div>
        </section>

        {/* Final Message Section */}
        <section className="py-20 md:py-24 bg-primary text-primary-foreground">
            <div className="container text-center max-w-4xl">
                 <h3 className="text-2xl font-semibold">The MemoIQ Difference</h3>
                 <p className="mt-4 text-lg text-primary-foreground/80">
                    All MemoIQ features are AI-powered by design, working together as a unified system to reduce friction, save time, and enhance productivity—while seamlessly integrating with the tools you already use.
                 </p>
                 <div className="mt-8">
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/auth">
                            Get Started Now
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
