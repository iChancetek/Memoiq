'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Bot, 
  CalendarCheck, 
  CheckSquare, 
  Mic, 
  Cpu, 
  Zap, 
  Layers, 
  Shield, 
  Globe,
  Waves
} from 'lucide-react';
import { Logo } from './logo';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const FeatureBlock = ({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  delay?: number;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className="group relative p-8 glass rounded-3xl ai-glow hover:bg-white/10 transition-all"
  >
    <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="text-2xl font-bold mb-4 tracking-tight">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <Zap className="h-4 w-4 text-primary animate-pulse" />
    </div>
  </motion.div>
);

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 z-[100] w-full border-b border-white/5 bg-background/60 backdrop-blur-2xl">
        <div className="container flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tighter">MemoIQ</span>
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
              <Link href="#features" className="hover:text-primary transition-colors">Intelligence</Link>
              <Link href="#integrations" className="hover:text-primary transition-colors">Ecosystem</Link>
              <Link href="/learn-more" className="hover:text-primary transition-colors">Vision</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-primary" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button className="rounded-full px-6 shadow-lg shadow-primary/20" asChild>
                <Link href="/auth">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-20">
        {/* Hero Section — Cinematic Experience */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Neural Background Animation Simulation */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 bg-violet-600/10 blur-[120px] rounded-full animate-slow-fade" />
          <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full animate-slow-fade [animation-delay:2s]" />
          
          <div className="container relative z-10 text-center">
            <motion.div
              {...fadeIn}
              className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-xs font-semibold tracking-widest uppercase mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              AI-Native Intelligence
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8 max-w-5xl mx-auto"
            >
              MemoIQ <br />
              <span className="bg-gradient-to-br from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent">
                Intelligent Productivity, <br className="hidden md:block" /> Reimagined.
              </span>
            </motion.h1>
            
            <motion.p 
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.2 }}
              className="mt-8 max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed"
            >
              AI transforms your voice, tasks, and time into a seamless, 
              intelligent workflow. The future of precision productivity is here.
            </motion.p>
            
            <motion.div 
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.4 }}
              className="mt-12 flex flex-col sm:flex-row justify-center gap-6"
            >
              <Button size="lg" className="h-14 px-10 rounded-full text-lg font-semibold group shadow-2xl shadow-primary/20" asChild>
                <Link href="/auth">
                  Get Started Free 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg font-semibold glass hover:bg-white/10" asChild>
                <Link href="/learn-more">
                  Explore Demo
                </Link>
              </Button>
            </motion.div>

            {/* Cinematic Focal Point - Mocking Veo 3 / Flow Flow */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-20 relative max-w-6xl mx-auto aspect-[21/9] rounded-[40px] overflow-hidden border border-white/10 glass float shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <Image 
                src="https://picsum.photos/seed/memoiq-hero/1920/1080" 
                alt="Cinematic Interface"
                fill
                className="object-cover opacity-40 mix-blend-luminosity grayscale hover:grayscale-0 transition-all duration-1000"
                data-ai-hint="futuristic workspace neural"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />
                <div className="absolute flex flex-col items-center">
                  <Waves className="h-12 w-12 text-primary animate-pulse mb-4" />
                  <span className="text-primary font-mono text-sm tracking-widest animate-pulse uppercase">Syncing Intelligence...</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid — AI-Driven Feature Sections */}
        <section id="features" className="py-32 relative">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-24">
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="inline-flex items-center gap-2 text-primary mb-4"
              >
                <Cpu className="h-5 w-5" />
                <span className="text-sm font-bold tracking-widest uppercase">The AI Engine</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">An Assistant for Every Part of Your Life</h2>
              <p className="text-xl text-muted-foreground">
                MemoIQ isn't just reacting to you — it is anticipating your needs, optimizing your schedule, and clarifying your thoughts.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureBlock
                icon={Mic}
                title="Voice → Intelligence"
                description="Live waveform analysis converts thoughts into structured data. Real-time transcription meets intelligent summarization."
                delay={0.1}
              />
              <FeatureBlock
                icon={CheckSquare}
                title="AI Task Engine"
                description="Tasks don't just sit there. They auto-prioritize, group by context, and suggest sub-steps based on your workflow."
                delay={0.2}
              />
              <FeatureBlock
                icon={CalendarCheck}
                title="Calendar Intuition"
                description="Dynamic timeline morphing detects conflicts before they happen. Smart suggestions optimize your busiest days."
                delay={0.3}
              />
              <FeatureBlock
                icon={Layers}
                title="Context Awareness"
                description="AI maps relationships between contacts and tasks, providing relevant reminders when they matter most."
                delay={0.4}
              />
              <FeatureBlock
                icon={Bot}
                title="iSkylar Companion"
                description="A personal, non-intrusive presence that offers strategic advice and empathetic support through your day."
                delay={0.5}
              />
              <FeatureBlock
                icon={Shield}
                title="Privacy First"
                description="Ultra-secure, edge-computed intelligence ensures your data is yours alone. Apple-level precision encryption."
                delay={0.6}
              />
            </div>
          </div>
        </section>

        {/* Ecosystem Section — Animated Integrations */}
        <section id="integrations" className="py-32 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 neural-mask pointer-events-none opacity-20">
             <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
          <div className="container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">Fluid Ecosystem Integration.</h2>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-10">
                    MemoIQ breathes with your existing tools. Seamless Google sync is just the beginning. 
                    M365 compatibility is evolving, bringing your entire digital life into one high-resolution focus.
                  </p>
                  <ul className="space-y-6">
                    <li className="flex items-center gap-4 text-lg font-medium">
                      <div className="h-10 w-10 glass rounded-full flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-400" />
                      </div>
                      Real-time Google Calendar & Contacts Sync
                    </li>
                    <li className="flex items-center gap-4 text-lg font-medium opacity-60">
                      <div className="h-10 w-10 glass rounded-full flex items-center justify-center">
                        <Layers className="h-5 w-5" />
                      </div>
                      Microsoft 365 Architecture (In Development)
                    </li>
                  </ul>
                </motion.div>
              </div>
              <div className="relative aspect-square glass rounded-[60px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[80%] h-[80%] border-2 border-dashed border-primary/20 rounded-full animate-[spin_20s_linear_infinite]" />
                  <div className="absolute w-[60%] h-[60%] border border-dashed border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="h-32 w-32 glass rounded-3xl flex items-center justify-center ai-glow"
                >
                  <Logo className="h-16 w-16 text-primary" />
                </motion.div>
              </div>
            </div>
          </div>
        </section>
        
        {/* PWA Section */}
        <section className="py-32 bg-background relative overflow-hidden">
          <div className="container text-center">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter italic">One App. Everywhere.</h2>
              <p className="text-2xl text-muted-foreground leading-relaxed mb-12">
                The PWA experience ensures zero friction. Install MemoIQ instantly on any device. 
                Full offline intelligence means your day never pauses.
              </p>
              <div className="flex flex-wrap justify-center gap-12 grayscale opacity-50">
                <div className="flex flex-col items-center gap-2">
                  <Globe className="h-8 w-8" />
                  <span className="text-xs font-bold tracking-widest uppercase">Desktop</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-5 border-2 border-current rounded-sm" />
                  <span className="text-xs font-bold tracking-widest uppercase">Mobile</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Shield className="h-8 w-8" />
                  <span className="text-xs font-bold tracking-widest uppercase">Offline</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="py-40 relative">
          <div className="absolute inset-0 bg-primary/5 -z-10 blur-3xl opacity-30" />
          <div className="container text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto glass p-16 rounded-[60px] ai-glow"
            >
              <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Ready to Experience <br /> the Future?</h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Join the elite circle of professionals using AI-native productivity to own their time.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button size="lg" className="h-16 px-12 rounded-full text-xl font-bold group" asChild>
                  <Link href="/auth">
                    Sign Up Now
                    <Zap className="ml-2 h-5 w-5 fill-current" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Futuristic Footer */}
      <footer className="border-t border-white/5 py-20 bg-black/40">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <Logo className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold tracking-tighter">MemoIQ</span>
              </Link>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                Building the interface for human-AI synergy. 
                Intelligent productivity, designed for precision.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm tracking-widest uppercase">Platform</h4>
              <ul className="space-y-4 text-muted-foreground text-sm">
                <li><Link href="#features" className="hover:text-primary transition-colors">Intelligence</Link></li>
                <li><Link href="#integrations" className="hover:text-primary transition-colors">Ecosystem</Link></li>
                <li><Link href="/auth" className="hover:text-primary transition-colors">Authentication</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm tracking-widest uppercase">Company</h4>
              <ul className="space-y-4 text-muted-foreground text-sm">
                <li><Link href="/learn-more" className="hover:text-primary transition-colors">The Vision</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 text-center text-muted-foreground text-xs font-mono tracking-widest">
            <p>© 2026 MEMOIQ SYSTEMS — OPERATING AT THE SPEED OF THOUGHT</p>
            <p className="mt-2 opacity-40 uppercase tracking-tighter">ChanceTEK // iChanceTEK Engineering</p>
          </div>
        </div>
      </footer>
    </div>
  );
}