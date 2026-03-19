
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
  Waves,
  Sparkles
} from 'lucide-react';
import { Logo } from './logo';
import placeholderData from '@/app/lib/placeholder-images.json';

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
    className="group relative p-8 glass rounded-3xl ai-glow hover:bg-white/10 transition-all border border-white/5"
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
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
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
        <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden py-24">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_70%)]" />
          <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 bg-violet-600/10 blur-[120px] rounded-full animate-slow-fade" />
          <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full animate-slow-fade [animation-delay:2s]" />
          
          <div className="container mx-auto relative z-10 px-4 text-center">
            <motion.div
              {...fadeIn}
              className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-10 border border-white/10"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              AI-Native Intelligence
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-9xl font-black tracking-tight leading-[0.85] mb-10 max-w-6xl mx-auto"
            >
              MemoIQ <br />
              <span className="bg-gradient-to-br from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent">
                Intelligence, <br className="hidden md:block" /> Reimagined.
              </span>
            </motion.h1>
            
            <motion.p 
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.2 }}
              className="mt-8 max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium"
            >
              AI transforms your voice, tasks, and time into a seamless, 
              intelligent workflow. The future of precision productivity is here.
            </motion.p>
            
            <motion.div 
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.4 }}
              className="mt-14 flex flex-col sm:flex-row justify-center gap-6"
            >
              <Button size="lg" className="h-16 px-12 rounded-full text-xl font-bold group shadow-2xl shadow-primary/30" asChild>
                <Link href="/auth">
                  Get Started Free 
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-12 rounded-full text-xl font-bold glass hover:bg-white/10 border-white/10" asChild>
                <Link href="/learn-more">
                  Explore Demo
                </Link>
              </Button>
            </motion.div>

            {/* Cinematic Focal Point - Simulating VEO 3 / Flow Flow */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-24 relative max-w-7xl mx-auto aspect-[21/9] rounded-[48px] overflow-hidden border border-white/10 glass float shadow-[0_0_120px_rgba(0,0,0,0.6)]"
            >
              <Image 
                src={placeholderData.hero.url} 
                alt="Cinematic Interface in a sun-drenched loft"
                fill
                className="object-cover opacity-60 mix-blend-screen transition-all duration-1000 scale-105 hover:scale-100"
                data-ai-hint={placeholderData.hero.hint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-md" />
                <div className="absolute flex flex-col items-center">
                  <Waves className="h-16 w-16 text-primary animate-pulse mb-6" />
                  <span className="text-primary font-mono text-[10px] tracking-[0.4em] animate-pulse uppercase font-bold">Syncing Intelligence...</span>
                </div>
              </div>
              
              {/* Holographic Interface elements overlay */}
              <div className="absolute top-12 left-12 p-6 glass rounded-2xl hidden lg:block border-white/5 ai-glow animate-pulse">
                <CalendarCheck className="h-6 w-6 text-primary/60" />
              </div>
              <div className="absolute bottom-12 right-12 p-6 glass rounded-2xl hidden lg:block border-white/5 ai-glow animate-pulse [animation-delay:1s]">
                <Bot className="h-6 w-6 text-primary/60" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid — AI-Driven Feature Sections */}
        <section id="features" className="py-40 relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto mb-32">
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="inline-flex items-center gap-3 text-primary mb-6"
              >
                <Cpu className="h-6 w-6" />
                <span className="text-xs font-black tracking-[0.3em] uppercase">The AI Engine</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight leading-[1.1]">An Assistant for Every Part of Your Life</h2>
              <p className="text-2xl text-muted-foreground font-medium">
                MemoIQ isn't just reacting to you — it is anticipating your needs, optimizing your schedule, and clarifying your thoughts.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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

        {/* Integration Ecosystem */}
        <section id="integrations" className="py-40 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter leading-[1]">Fluid Ecosystem Integration.</h2>
                <p className="text-2xl text-muted-foreground leading-relaxed mb-12 font-medium">
                  MemoIQ breathes with your existing tools. Seamless Google sync is just the beginning. 
                  M365 compatibility is evolving, bringing your entire digital life into one high-resolution focus.
                </p>
                <ul className="space-y-8">
                  <li className="flex items-center gap-6 text-xl font-semibold">
                    <div className="h-14 w-14 glass rounded-2xl flex items-center justify-center border-white/5 shadow-inner">
                      <Globe className="h-7 w-7 text-blue-400" />
                    </div>
                    Real-time Google Calendar & Contacts Sync
                  </li>
                  <li className="flex items-center gap-6 text-xl font-semibold opacity-40">
                    <div className="h-14 w-14 glass rounded-2xl flex items-center justify-center border-white/5">
                      <Layers className="h-7 w-7" />
                    </div>
                    Microsoft 365 Architecture (In Development)
                  </li>
                </ul>
              </motion.div>
              
              <div className="relative aspect-square glass rounded-[80px] flex items-center justify-center overflow-hidden border-white/5">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[85%] h-[85%] border-2 border-dashed border-primary/20 rounded-full animate-[spin_25s_linear_infinite]" />
                  <div className="absolute w-[65%] h-[65%] border border-dashed border-primary/10 rounded-full animate-[spin_18s_linear_infinite_reverse]" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }} 
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="h-40 w-40 glass rounded-[40px] flex items-center justify-center ai-glow border-white/10"
                >
                  <Logo className="h-20 w-20 text-primary" />
                </motion.div>
              </div>
            </div>
          </div>
        </section>
        
        {/* PWA Section */}
        <section className="py-40 bg-background relative overflow-hidden">
          <div className="container mx-auto px-4 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto"
            >
              <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter italic">One App. Everywhere.</h2>
              <p className="text-3xl text-muted-foreground leading-relaxed mb-16 font-medium">
                The PWA experience ensures zero friction. Install MemoIQ instantly on any device. 
                Full offline intelligence means your day never pauses.
              </p>
              <div className="flex flex-wrap justify-center gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="flex flex-col items-center gap-4">
                  <Globe className="h-10 w-10" />
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase">Desktop</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-6 border-2 border-current rounded-md" />
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase">Mobile</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Shield className="h-10 w-10" />
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase">Offline</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="py-48 relative">
          <div className="absolute inset-0 bg-primary/5 -z-10 blur-[160px] opacity-40" />
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-5xl mx-auto glass p-20 rounded-[80px] ai-glow border-white/5"
            >
              <h2 className="text-6xl md:text-8xl font-black mb-10 tracking-tighter leading-[0.9]">Ready to <br /> Own Your Time?</h2>
              <p className="text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto font-medium leading-relaxed">
                Join the elite circle of professionals using AI-native productivity to redefine precision.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-8">
                <Button size="lg" className="h-20 px-16 rounded-full text-2xl font-black group shadow-primary/40 shadow-2xl" asChild>
                  <Link href="/auth">
                    Sign Up Now
                    <Zap className="ml-3 h-6 w-6 fill-current" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Futuristic Footer */}
      <footer className="border-t border-white/5 py-24 bg-black/60 backdrop-blur-3xl">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-8">
                <Logo className="h-10 w-10 text-primary" />
                <span className="text-3xl font-black tracking-tighter">MemoIQ</span>
              </Link>
              <p className="text-muted-foreground text-xl leading-relaxed max-w-md font-medium">
                Building the interface for human-AI synergy. 
                Intelligent productivity, designed for absolute precision.
              </p>
            </div>
            <div>
              <h4 className="font-black mb-8 text-xs tracking-[0.3em] uppercase text-primary">Platform</h4>
              <ul className="space-y-5 text-muted-foreground text-sm font-semibold">
                <li><Link href="#features" className="hover:text-primary transition-colors">Intelligence</Link></li>
                <li><Link href="#integrations" className="hover:text-primary transition-colors">Ecosystem</Link></li>
                <li><Link href="/auth" className="hover:text-primary transition-colors">Authentication</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-8 text-xs tracking-[0.3em] uppercase text-primary">Company</h4>
              <ul className="space-y-5 text-muted-foreground text-sm font-semibold">
                <li><Link href="/learn-more" className="hover:text-primary transition-colors">The Vision</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 text-center text-muted-foreground/40 text-[10px] font-mono tracking-[0.5em] font-bold">
            <p>© 2026 MEMOIQ SYSTEMS — OPERATING AT THE SPEED OF THOUGHT</p>
            <p className="mt-4 tracking-[0.2em] font-sans">ChanceTEK // iChanceTEK Engineering</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
