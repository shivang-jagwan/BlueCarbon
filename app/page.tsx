'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import mapImage from '@/assests/image1.png';
import heroImage from '@/assests/image2.png';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/shared/logo';
import {
  ArrowRight,
  Menu,
  X,
  Shield,
  FileText,
  Map,
  Users,
  CheckCircle2,
  Fingerprint,
  Play,
  HeartHandshake,
  Handshake,
  Eye,
  TrendingUp,
  MapPin,
  Calendar,
  Award,
  Lock,
  TreePine,
  Building2,
  Brain,
  Satellite,
  BarChart3,
  Leaf,
  Globe,
  ChevronDown,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-60px' },
  transition: { staggerChildren: 0.1 },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [previewTab, setPreviewTab] = React.useState('owner');

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#why' },
    { label: 'Contact', href: '#contact' },
  ];

  const workflowSteps = [
    { icon: FileText, title: 'Register Project', desc: 'Create account and register your blue carbon project.' },
    { icon: Shield, title: 'Verification Service', desc: 'Request verification from certified organizations.' },
    { icon: CheckCircle2, title: 'Project Published', desc: 'Approved projects become discoverable by partners.' },
    { icon: HeartHandshake, title: 'Partner Network', desc: 'Sustainability partners establish monitoring partnerships.' },
    { icon: Handshake, title: 'Monitoring Partnership', desc: 'Project owner and monitoring org finalize agreement.' },
    { icon: Fingerprint, title: 'Carbon Passport', desc: 'Verified carbon credits issued as immutable passports.' },
  ];

  const features = [
    { icon: Map, title: 'GIS Mapping', desc: 'Draw project boundaries with interactive polygon tools.' },
    { icon: Satellite, title: 'Satellite Monitoring', desc: 'Track restoration progress with satellite imagery.' },
    { icon: Shield, title: 'Verification Workflow', desc: 'Streamlined approval with certified organizations.' },
    { icon: Fingerprint, title: 'Carbon Passport', desc: 'Immutable digital certificates for sequestered carbon.' },
    { icon: FileText, title: 'Monitoring Reports', desc: 'Automated compliance-ready PDF reports.' },
    { icon: Brain, title: 'AI Insights', desc: 'Intelligent analysis of monitoring data and trends.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ─── FLOATING NAVIGATION ─── */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? 'glass-strong shadow-soft-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center">
                <Logo iconClassName="h-10 w-auto" />
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                      scrolled
                        ? 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Button variant="ghost" asChild className={`text-sm font-medium ${scrolled ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className={`rounded-xl px-5 h-10 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                scrolled
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20'
                  : 'bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/10'
              }`}>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>

            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? 'hover:bg-accent/10' : 'hover:bg-white/10 text-white'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 glass-strong px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
              <Button variant="outline" className="w-full rounded-xl border-border" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* ─── 1. HERO — Immersive Full-Screen ─── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* Background Image with Dark Overlay */}
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Coastal Restoration"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 gradient-forest-hero" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>

          {/* Animated Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-soft" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium mb-8">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  AI-Powered MRV Platform
                </div>

                <h1 className="font-display text-[2.5rem] sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] text-white mb-6">
                  Empowering Nature.
                  <br />
                  <span className="text-gradient-forest-bright">Enabling Impact.</span>
                </h1>

                <p className="text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl mb-10">
                  The transparent MRV platform connecting Project Owners, Verification Organizations, and Sustainability Partners for blue carbon ecosystems.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <Button asChild className="bg-white text-primary hover:bg-white/90 rounded-xl px-7 h-12 text-sm font-semibold shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
                    <Link href="/dashboard/discover">
                      Explore Platform <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl px-7 h-12 text-sm font-medium border-white/25 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5">
                    <Link href="/register">
                      Watch Demo <Play className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-5 text-xs text-white/50">
                  {[
                    { icon: Brain, label: 'AI Powered' },
                    { icon: Map, label: 'GIS Mapping' },
                    { icon: Fingerprint, label: 'Carbon Passport' },
                    { icon: Shield, label: 'Verified MRV' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <item.icon className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Hero KPI Cards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
                className="relative hidden lg:block"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/80 via-primary to-primary/90 relative overflow-hidden">
                    <Image
                      src={heroImage}
                      alt="Coastal Restoration Zone"
                      fill
                      className="object-cover opacity-80"
                      placeholder="blur"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white/90">
                        <TreePine className="h-20 w-20 mx-auto mb-3 text-white/60" />
                        <p className="text-sm font-medium text-white/80">Coastal Restoration Zone</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating KPI Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="absolute -bottom-8 -left-4 right-8 sm:right-auto sm:w-80 glass-strong rounded-2xl border border-white/15 p-5 shadow-2xl"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: '128+', label: 'Active Projects', color: 'text-emerald-400' },
                      { value: '45K+', label: 'CO₂ Verified (t)', color: 'text-emerald-300' },
                      { value: '12K+', label: 'Hectares Restored', color: 'text-emerald-400' },
                      { value: '56+', label: 'Verification Orgs', color: 'text-emerald-300' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className={`text-xl font-bold font-display ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-white/50 leading-tight mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <ChevronDown className="h-6 w-6 text-white/40" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ─── 2. TRUSTED BY ─── */}
        <section className="py-16 border-y border-border/50 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-10">
              Trusted by organizations driving restoration
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
              {['Universities', 'NGOs', 'CSR Companies', 'Government Agencies', 'Research Institutions'].map((name) => (
                <div key={name} className="flex items-center gap-2.5 font-semibold text-sm text-muted-foreground/50 select-none hover:text-muted-foreground transition-colors">
                  <Building2 className="h-4 w-4" /> {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 3. PLATFORM OVERVIEW (3 Roles) ─── */}
        <section id="platform" className="py-28 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="outline" className="border-primary/20 text-primary mb-4 text-xs font-medium">Platform</Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Built for every stakeholder
              </h2>
              <p className="text-muted-foreground text-lg">
                A unified ecosystem connecting project developers, auditors, and sustainability partners.
              </p>
            </motion.div>

            <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: TreePine,
                  title: 'Project Owners',
                  desc: 'Register projects, upload monitoring evidence, track health scores, and manage verification workflows.',
                  cta: 'Start a Project',
                },
                {
                  icon: Shield,
                  title: 'Verification & Monitoring',
                  desc: 'Review evidence systematically, issue approvals, conduct monitoring, and generate Carbon Passports.',
                  cta: 'Join as Verifier',
                },
                {
                  icon: HeartHandshake,
                  title: 'Sustainability Partners',
                  desc: 'Discover verified projects, establish monitoring partnerships, track impact, and download ESG reports.',
                  cta: 'Explore Projects',
                },
              ].map((role) => (
                <motion.div key={role.title} variants={staggerItem}>
                  <Card className="border-border/50 bg-card group cursor-pointer transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 h-full">
                    <CardContent className="p-7">
                      <div className="w-12 h-12 rounded-xl bg-primary/8 group-hover:bg-primary/15 transition-colors duration-500 flex items-center justify-center mb-5">
                        <role.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="font-display text-lg font-semibold mb-2">{role.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{role.desc}</p>
                      <a href="/register" className="inline-flex items-center text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                        {role.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── 4. HOW CARBONRUSH WORKS (Horizontal Timeline) ─── */}
        <section id="how-it-works" className="py-28 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="outline" className="border-primary/20 text-primary mb-4 text-xs font-medium">How it Works</Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                From registration to verified impact
              </h2>
              <p className="text-muted-foreground text-lg">
                A seamless journey powering transparent blue carbon restoration.
              </p>
            </motion.div>

            {/* Desktop: Horizontal Timeline */}
            <motion.div {...fadeUp} className="hidden md:block relative max-w-5xl mx-auto">
              <div className="absolute top-6 left-[8%] right-[8%] h-px bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10" />
              <div className="grid grid-cols-6 gap-4">
                {workflowSteps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center text-center relative z-10">
                    <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center mb-4 shadow-soft">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Step {i + 1}</p>
                    <p className="text-sm font-semibold mb-1">{step.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mobile: Vertical Timeline */}
            <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="md:hidden relative pl-10 space-y-8">
              <div className="absolute top-0 bottom-0 left-4 w-px bg-primary/20" />
              {workflowSteps.map((step, i) => (
                <motion.div key={i} variants={staggerItem} className="relative">
                  <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center shadow-soft">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Step {i + 1}</p>
                  <p className="text-sm font-semibold mb-1">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── 5. DASHBOARD PREVIEW ─── */}
        <section id="features" className="py-28 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className="border-primary/20 text-primary mb-4 text-xs font-medium">Preview</Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                See the platform in action
              </h2>
              <p className="text-muted-foreground text-lg">
                Explore each dashboard and discover how CarbonRush AI works for every role.
              </p>
            </motion.div>

            <motion.div {...fadeUp}>
              <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="bg-muted/50 border border-border/50 p-1 rounded-xl h-auto">
                    {[
                      { value: 'owner', label: 'Project Owner' },
                      { value: 'verifier', label: 'Verifier' },
                      { value: 'partner', label: 'Sustainability Partner' },
                      { value: 'admin', label: 'Admin' },
                    ].map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg px-4 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-soft data-[state=active]:text-foreground">
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {[
                  { value: 'owner', color: '#152 60% 28%', title: 'Project Owner Dashboard', desc: 'Manage projects, upload monitoring evidence, track health scores, and coordinate with verifiers.' },
                  { value: 'verifier', color: '#152 55% 36%', title: 'Verification Dashboard', desc: 'Review service requests, examine evidence, leave comments, and issue approvals.' },
                  { value: 'partner', color: '#142 55% 32%', title: 'Sustainability Partner Hub', desc: 'Discover projects, establish partnerships, monitor impact, and download ESG reports.' },
                  { value: 'admin', color: '#152 60% 30%', title: 'Admin Console', desc: 'Platform health monitoring, user management, verification queues, and activity logs.' },
                ].map((panel) => (
                  <TabsContent key={panel.value} value={panel.value} className="mt-0">
                    <div className="relative max-w-4xl mx-auto">
                      <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/5 overflow-hidden">
                        <div className="h-9 bg-muted/50 border-b border-border/50 flex items-center px-4 gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                            <div className="w-2.5 h-2.5 rounded-full bg-border" />
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div className="px-3 py-0.5 rounded-md bg-background text-[10px] text-muted-foreground/60 font-medium border border-border/50">
                              carbonrush.ai/dashboard
                            </div>
                          </div>
                        </div>
                        <div className="p-6 sm:p-8 bg-gradient-to-br from-background to-card">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <div className="w-5 h-5 rounded-md bg-primary" />
                            </div>
                            <div>
                              <h3 className="font-display text-sm font-semibold">{panel.title}</h3>
                              <p className="text-xs text-muted-foreground">{panel.desc}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-20 rounded-xl bg-background border border-border/50 p-3 shadow-soft">
                                <div className="h-2 w-16 bg-border/60 rounded-full mb-2" />
                                <div className="h-4 w-10 bg-primary/15 rounded-full" />
                              </div>
                            ))}
                          </div>
                          <div className="h-32 rounded-xl bg-background border border-border/50 p-4 shadow-soft">
                            <div className="h-2 w-24 bg-border/60 rounded-full mb-3" />
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="h-2 rounded-full bg-border/40" style={{ width: `${80 - i * 15}%` }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>

            {/* 6 Key Features */}
            <motion.div variants={stagger} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
              {features.map((feature) => (
                <motion.div key={feature.title} variants={staggerItem}>
                  <div className="border border-border/50 bg-card rounded-xl p-5 group cursor-pointer transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 h-full">
                    <div className="w-10 h-10 rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors duration-500 flex items-center justify-center mb-3">
                      <feature.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h3 className="font-display text-sm font-semibold mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── 6. GIS MONITORING ─── */}
        <section id="why" className="py-28 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div {...fadeUp} className="order-2 lg:order-1 relative">
                <div className="rounded-2xl border border-border/50 shadow-2xl overflow-hidden bg-card">
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={mapImage}
                      alt="Sundarbans Project Zone Map"
                      fill
                      className="object-cover"
                      placeholder="blur"
                    />
                    <div className="absolute top-4 left-4 glass-strong rounded-lg px-3 py-2 text-foreground text-xs font-medium flex items-center gap-2 shadow-lg">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Sundarbans Project Zone
                    </div>
                    <div className="absolute bottom-4 right-4 glass-strong rounded-lg px-3 py-2 text-xs shadow-lg">
                      <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Healthy: 78%</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Monitoring: 22%</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div {...fadeUp} className="order-1 lg:order-2">
                <Badge variant="outline" className="border-primary/20 text-primary mb-4 text-xs font-medium">Maps & Monitoring</Badge>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  See restoration in real time
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  Interactive GIS maps with satellite overlays and continuous health monitoring.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Map, title: 'Polygon Boundaries', desc: 'Draw and track project areas with precision GIS tools.' },
                    { icon: TrendingUp, title: 'Health Score', desc: 'Real-time ecosystem health monitoring with AI analysis.' },
                    { icon: Calendar, title: 'Monitoring Timeline', desc: 'Monthly evidence uploads and progress tracking.' },
                    { icon: FileText, title: 'Automated Reports', desc: 'Compliance-ready PDFs generated from monitoring data.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-3 -mx-3 rounded-xl group cursor-pointer transition-all duration-300 ease-out hover:bg-primary/5 hover:-translate-y-0.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors duration-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── 7. CARBON PASSPORT ─── */}
        <section className="py-28 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div {...fadeUp}>
                <Badge variant="outline" className="border-primary/20 text-primary mb-4 text-xs font-medium">Carbon Passport</Badge>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  Immutable proof of impact
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  Every verified ton of carbon sequestered receives a tamper-proof digital passport — transparent, auditable, and globally recognized.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, title: 'Verified', desc: 'Backed by certified auditors' },
                    { icon: Lock, title: 'Immutable', desc: 'Cannot be altered once issued' },
                    { icon: Eye, title: 'Transparent', desc: 'Publicly verifiable on the platform' },
                    { icon: Award, title: 'Globally Trusted', desc: 'Recognized by global standards' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 group cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
                      <div className="w-9 h-9 rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors duration-300 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div {...fadeUp} className="relative flex justify-center">
                <div className="w-72 rounded-2xl bg-card border border-border/50 shadow-2xl shadow-primary/5 p-6 relative">
                  <div className="absolute -top-3 -right-3 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-primary/30">
                    VERIFIED
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                      <Fingerprint className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">CARBON PASSPORT</p>
                      <p className="text-[10px] text-muted-foreground">CarbonRush AI Platform</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span className="font-medium">Sundarbans Mangrove</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Carbon Verified</span><span className="font-medium">2,450 tCO₂e</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Verifier</span><span className="font-medium">VerifyCarbon Inc.</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Issue Date</span><span className="font-medium">Jan 2026</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Valid Until</span><span className="font-medium">Jan 2031</span></div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="h-12 bg-muted/30 rounded-lg flex items-center justify-center">
                      <div className="flex gap-px">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} className="w-1 bg-foreground/60" style={{ height: `${12 + Math.sin(i * 0.8) * 8}px` }} />
                        ))}
                      </div>
                    </div>
                    <p className="text-center text-[9px] text-muted-foreground/60 mt-1 font-mono">CRSH-2026-MANGROVE-2450</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── 8. IMPACT NUMBERS ─── */}
        <section className="py-20 bg-muted/30 border-y border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: 128, suffix: '+', label: 'Active Projects', icon: TreePine },
                  { value: 45000, suffix: '+', label: 'Tonnes CO₂ Verified', icon: Leaf },
                  { value: 12000, suffix: '+', label: 'Hectares Monitored', icon: Globe },
                  { value: 56, suffix: '+', label: 'Countries', icon: Users },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center">
                    <stat.icon className="h-5 w-5 text-primary/40 mb-3" />
                    <p className="font-display text-3xl sm:text-4xl font-bold text-gradient-forest mb-1">
                      <CountUp target={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── 9. FINAL CTA ─── */}
        <section id="contact" className="py-28 bg-background">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <div className="rounded-3xl gradient-forest p-12 sm:p-16 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <svg viewBox="0 0 800 400" className="w-full h-full">
                    <circle cx="100" cy="100" r="200" fill="white" opacity="0.05" />
                    <circle cx="700" cy="300" r="150" fill="white" opacity="0.04" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                    Ready to restore the future?
                  </h2>
                  <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
                    Join the transparent MRV platform trusted by project developers, verifiers, and sustainability partners worldwide.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button asChild className="bg-white text-primary hover:bg-white/90 rounded-xl px-8 h-12 text-sm font-semibold shadow-xl shadow-black/20">
                      <Link href="/register">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 h-12 text-sm font-medium">
                      <Link href="/register">
                        Request Demo
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ─── 10. FOOTER ─── */}
      <footer className="bg-foreground text-muted-foreground border-t border-border/50 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Logo iconClassName="h-10 w-auto [&_img]:brightness-0 [&_img]:invert" />
              </Link>
              <p className="text-sm leading-relaxed max-w-xs mb-4 text-muted-foreground">
                The transparent MRV platform for blue carbon restoration projects.
              </p>
              <div className="flex gap-3 text-xs">
                {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
                  <span key={s} className="hover:text-foreground transition-colors cursor-pointer">{s}</span>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Platform',
                links: ['GIS Mapping', 'Carbon Passport', 'Verification', 'Monitoring', 'Reports'],
              },
              {
                title: 'Solutions',
                links: ['Project Owners', 'Verifiers', 'Sustainability Partners', 'Government', 'Research'],
              },
              {
                title: 'Resources',
                links: ['Documentation', 'API Reference', 'Case Studies', 'Blog', 'Help Center'],
              },
              {
                title: 'Company',
                links: ['About', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Service'],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-foreground transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p suppressHydrationWarning>&copy; {new Date().getFullYear()} CarbonRush AI. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
