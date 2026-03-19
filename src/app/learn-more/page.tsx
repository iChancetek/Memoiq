
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  CheckSquare, 
  CalendarCheck, 
  Bot, 
  ArrowLeft, 
  PenSquare, 
  Calendar, 
  Users, 
  Briefcase, 
  Smile, 
  Mail,
  Sparkles,
  Zap,
  Globe,
  Layers,
  Shield
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const FeatureDetailCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any; title: string; description: string; delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className="group relative p-8 glass rounded-3xl ai-glow hover:bg-muted/50 transition-all border border-border/50"
  >
    <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="text-2xl font-bold mb-4 tracking-tight drop-shadow-md">{title}</h3>
    <p className="text-foreground/90 leading-relaxed font-medium drop-shadow-sm">{description}</p>
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <Zap className="h-4 w-4 text-primary animate-pulse" />
    </div>
  </motion.div>
);

export default function LearnMorePage() {
  return (
    <div className="relative flex flex-col min-h-screen text-foreground selection:bg-primary/30 overflow-x-hidden transition-colors duration-500">
      {/* Global Cinematic Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 -z-20 object-cover w-full h-full pointer-events-none opacity-20 dark:opacity-40"
      >
        <source src="/memoiq.mp4" type="video/mp4" />
      </video>

      <header className="fixed top-0 z-[100] w-full border-b border-border/40 bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tighter">MemoIQ</span>
          </Link>
          <Button variant="ghost" className="rounded-full px-6 hover:text-primary transition-colors" asChild>
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center py-24 overflow-hidden border-b border-border/40">
            <div className="container mx-auto px-4 text-center">
                <motion.div
                  {...fadeIn}
                  className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-10 border border-border/50"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  Experience The Vision
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] mb-10 max-w-5xl mx-auto"
                >
                  AI-Powered Productivity, <br />
                  <span className="bg-gradient-to-br from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent">
                    Seamlessly Connected.
                  </span>
                </motion.h1>
                
                <motion.p 
                  {...fadeIn}
                  transition={{ ...fadeIn.transition, delay: 0.2 }}
                  className="mt-8 max-w-3xl mx-auto text-xl md:text-2xl text-foreground/90 leading-relaxed font-semibold drop-shadow-lg"
                >
                    MemoIQ is a next-generation platform where AI is embedded across the entire experience—transforming voice, 
                    automation, and intelligent assistance into a unified, high-performance workflow.
                </motion.p>
            </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-40 relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto mb-32">
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="inline-flex items-center gap-3 text-primary mb-6"
              >
                <Zap className="h-6 w-6" />
                <span className="text-xs font-black tracking-[0.3em] uppercase">The Platform Features</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[1.1]">Precision Intelligence</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <FeatureDetailCard
                icon={Mic}
                title="Voice Memos"
                description="Capture thoughts naturally. AI automatically transcribes, organizes, and converts voice into actionable tasks or insights."
                delay={0.1}
              />
              <FeatureDetailCard
                icon={Mail}
                title="Intelligent Email"
                description="Connect Outlook or Gmail for full bidirectional sync. AI drafts context-aware replies and summarizes long threads."
                delay={0.2}
              />
              <FeatureDetailCard
                icon={PenSquare}
                title="MediScribe"
                description="An intelligent AI scribe that transforms voice into structured, accurate professional documentation with high speed."
                delay={0.3}
              />
              <FeatureDetailCard
                icon={CheckSquare}
                title="Tasks"
                description="Manage tasks using natural language. AI prioritizes, categorizes, and suggests deadlines to keep you moving."
                delay={0.4}
              />
              <FeatureDetailCard
                icon={Calendar}
                title="Calendar"
                description="Full integration with Google and M365. AI manages schedule, detects conflicts, and suggests optimal meeting times."
                delay={0.5}
              />
              <FeatureDetailCard
                icon={Users}
                title="Contacts"
                description="Unified contacts across Gmail and Outlook. AI helps organize, enrich, and keep your professional network up to date."
                delay={0.6}
              />
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="py-40 bg-muted/10 border-y border-border relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="max-w-4xl mx-auto"
                >
                    <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter italic">Seamless Ecosystem</h2>
                    <p className="text-2xl text-foreground/90 leading-relaxed mb-12 font-semibold">
                       MemoIQ features full, bidirectional integration with both Google Workspace and Microsoft 365. 
                       Connect your Gmail, Outlook, Calendars, and Contacts in seconds using secure, MFA-supported OAuth 2.0.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-12 mt-16">
                        <div className="flex flex-col items-center gap-4 glass p-8 rounded-3xl border-border/50 min-w-[200px]">
                            <Globe className="h-10 w-10 text-blue-400" />
                            <span className="text-sm font-black tracking-[0.2em] uppercase">Google Workspace</span>
                        </div>
                        <div className="flex flex-col items-center gap-4 glass p-8 rounded-3xl border-border/50 min-w-[200px]">
                            <svg className="h-10 w-10" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#f35325" d="M1 1h10v10H1z"/>
                                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                                <path fill="#ffba08" d="M12 12h10v10H12z"/>
                            </svg>
                            <span className="text-sm font-black tracking-[0.2em] uppercase">Microsoft 365</span>
                        </div>
                    </div>
                    
                    <p className="mt-16 text-sm text-muted-foreground italic font-medium">
                        "Apple-level" simplicity—secure, encrypted, and built for privacy.
                    </p>
                </motion.div>
            </div>
        </section>

        {/* Companions & Managers */}
        <section className="py-40 relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-32">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter">AI Management Layer</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
                     <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="glass p-10 rounded-[40px] border-border/50 ai-glow"
                     >
                        <div className="flex items-center gap-4 mb-8">
                            <Smile className="h-12 w-12 text-primary" />
                            <h3 className="text-3xl font-black tracking-tighter">AI Companion</h3>
                        </div>
                        <p className="text-xl text-foreground/90 font-medium leading-relaxed mb-6">
                            Your personal assistant that understands context and helps you navigate your day through natural conversation.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Context-aware memory",
                                "Strategic advice",
                                "Natural language support"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm font-semibold opacity-80">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                     </motion.div>

                     <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="glass p-10 rounded-[40px] border-border/50"
                     >
                        <div className="flex items-center gap-4 mb-8">
                            <Bot className="h-12 w-12 text-primary" />
                            <h3 className="text-3xl font-black tracking-tighter">AI Managers</h3>
                        </div>
                        <div className="space-y-8">
                            {[
                                { title: "Email Manager", desc: "Drafts replies and highlights action items." },
                                { title: "Tasks Manager", desc: "Prioritizes and organizes across platforms." },
                                { title: "Calendar Manager", desc: "Monitors availability and conflicts." }
                            ].map((manager, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                    <div className="h-10 w-10 glass rounded-xl flex items-center justify-center shrink-0 border-border/50">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold tracking-tight">{manager.title}</h4>
                                        <p className="text-muted-foreground font-medium">{manager.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </motion.div>
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="py-48 relative">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto glass p-20 rounded-[80px] ai-glow border-border"
            >
              <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter leading-[0.9]">Experience the <br /> New Standard.</h2>
              <p className="text-2xl text-foreground/90 mb-16 max-w-2xl mx-auto font-semibold leading-relaxed">
                Join thousands of professionals who have redefined their productivity with AI-native intelligence.
              </p>
              <Button size="lg" className="h-20 px-16 rounded-full text-2xl font-black group shadow-primary/40 shadow-2xl" asChild>
                <Link href="/auth">
                  Get Started Free
                  <Zap className="ml-3 h-6 w-6 fill-current" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-24 bg-muted/30 backdrop-blur-3xl">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <Logo className="h-10 w-10 text-primary" />
              <span className="text-3xl font-black tracking-tighter">MemoIQ</span>
            </Link>
            <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
              Operating at the speed of thought
            </p>
            <div className="pt-16 border-t border-border w-full text-muted-foreground/40 text-[10px] font-mono tracking-[0.5em] font-bold">
              <p>&copy; 2026 MEMOIQ SYSTEMS — iCHANCETEK ENGINEERING</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
