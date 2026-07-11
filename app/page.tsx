'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Logo } from '@/components/shared/logo';
import {
  ArrowRight, ShieldCheck, Leaf, Globe2, FileText,
  Map, BarChart3, Users, MessageSquare, Wallet, Bell,
  CheckCircle2, Menu, X, PlayCircle, Lock, Zap, Building2,
  TreePine, Fingerprint, Database, Check, Award
} from 'lucide-react';

// Animation variants
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1 }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/20">
      {/* 1. NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Logo showText={true} />
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
                <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it Works</Link>
                <Link href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">About</Link>
                <Link href="#contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full shadow-sm">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4">
            <Link href="#features" className="block text-sm font-medium text-slate-600">Features</Link>
            <Link href="#how-it-works" className="block text-sm font-medium text-slate-600">How it Works</Link>
            <Link href="#about" className="block text-sm font-medium text-slate-600">About</Link>
            <Link href="#contact" className="block text-sm font-medium text-slate-600">Contact</Link>
            <div className="pt-4 flex flex-col gap-2 border-t border-slate-100">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button className="w-full rounded-full" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* 2. HERO SECTION */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-32 lg:pb-40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <motion.div 
                initial="initial"
                animate="whileInView"
                variants={fadeIn}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  New Platform Release v2.0
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-6">
                  Building Trust for <span className="text-primary">Blue Carbon</span> Projects.
                </h1>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  CarbonRush AI helps project owners, verification organizations, and sustainability partners collaborate through a transparent Monitoring, Reporting and Verification platform.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button size="lg" className="w-full sm:w-auto rounded-full h-12 px-8 text-base shadow-sm" asChild>
                    <Link href="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-12 px-8 text-base">
                    <PlayCircle className="mr-2 h-5 w-5 text-slate-400" /> Watch Demo
                  </Button>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative lg:ml-auto w-full max-w-lg lg:max-w-none"
              >
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
                  <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 bg-slate-50/50 flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="w-64 h-24 bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Leaf className="h-4 w-4 text-primary" /></div>
                        <div className="h-2 w-24 bg-slate-200 rounded-full"></div>
                      </div>
                      <div className="flex-1 h-24 bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Globe2 className="h-4 w-4 text-blue-500" /></div>
                        <div className="h-2 w-32 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                      <div className="w-full h-48 bg-slate-100 rounded-lg animate-pulse mb-4"></div>
                      <div className="h-2 w-full max-w-[200px] bg-slate-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. TRUSTED BY */}
        <section className="py-12 border-y border-slate-100 bg-slate-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase mb-8">Trusted by global leaders in restoration</p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale">
              {['NGOs', 'Government', 'CSR', 'ESG', 'Universities', 'Companies'].map((name) => (
                <div key={name} className="flex items-center gap-2 font-bold text-xl text-slate-700">
                  <Building2 className="h-6 w-6" /> {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PROBLEM SECTION */}
        <section id="features" className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">The Challenge in Blue Carbon</h2>
              <p className="text-lg text-slate-600">The current carbon ecosystem is fragmented, manual, and lacks transparency.</p>
            </div>
            
            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={staggerItem}>
                <Card className="border-0 shadow-none bg-rose-50/50 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 text-rose-500">
                      <Leaf className="h-6 w-6" />
                    </div>
                    <CardTitle>Project Owners</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-600 space-y-3">
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-rose-400" /> Hard to access funding</p>
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-rose-400" /> Manual documentation</p>
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-rose-400" /> Verification delays</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={staggerItem}>
                <Card className="border-0 shadow-none bg-amber-50/50 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 text-amber-500">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <CardTitle>Verifiers</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-600 space-y-3">
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-amber-400" /> Fragmented workflow</p>
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-amber-400" /> Manual reports</p>
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-amber-400" /> No collaboration</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={staggerItem}>
                <Card className="border-0 shadow-none bg-slate-100/50 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 text-slate-700">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <CardTitle>Companies</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-600 space-y-3">
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-slate-400" /> Hard to discover projects</p>
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-slate-400" /> No transparency</p>
                    <p className="flex items-center gap-2"><X className="h-4 w-4 text-slate-400" /> Difficult ESG reporting</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 5. SOLUTION SECTION */}
        <section className="py-24 bg-slate-900 text-white rounded-[3rem] mx-4 sm:mx-6 lg:mx-8 mb-24 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-slate-900 to-slate-900 pointer-events-none"></div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">The Solution: CarbonRush AI</h2>
              <p className="text-lg text-slate-400">One transparent ecosystem connecting all stakeholders seamlessly.</p>
            </div>
            
            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={staggerItem}>
                <Card className="bg-white/5 border-white/10 text-white h-full backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Project Owners</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300 space-y-4">
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Register projects easily</p>
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Upload monitoring evidence</p>
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Track progress in real-time</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={staggerItem}>
                <Card className="bg-white/5 border-white/10 text-white h-full backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Verifiers</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300 space-y-4">
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Review projects efficiently</p>
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Approve evidence with AI</p>
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Issue Carbon Passports</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={staggerItem}>
                <Card className="bg-white/5 border-white/10 text-white h-full backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Sustainability Partners</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300 space-y-4">
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Discover verified projects</p>
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Support restoration directly</p>
                    <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-400" /> Monitor impact continuously</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 6. HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">How It Works</h2>
              <p className="text-lg text-slate-600">A seamless 6-step journey from registration to verified impact.</p>
            </div>
            
            <div className="relative">
              {/* Line connector */}
              <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
                {[
                  { icon: Users, title: 'Register', desc: 'Create account' },
                  { icon: Leaf, title: 'Create Project', desc: 'Define boundaries' },
                  { icon: Database, title: 'Upload Evidence', desc: 'Add field data' },
                  { icon: ShieldCheck, title: 'Verification', desc: 'Audit by experts' },
                  { icon: Wallet, title: 'Funding', desc: 'Partner support' },
                  { icon: BarChart3, title: 'Impact Reports', desc: 'Monitor progress' }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center mb-4 text-primary relative">
                      <step.icon className="h-6 w-6" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{i+1}</div>
                    </div>
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. PLATFORM FEATURES */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Enterprise-Grade Features</h2>
              <p className="text-lg text-slate-600">Everything you need to manage blue carbon projects at scale.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Map, title: 'Interactive GIS Maps', desc: 'Draw polygons and track geospatial data directly in the browser.' },
                { icon: BarChart3, title: 'Monthly Monitoring', desc: 'Log periodic evidence and track metrics over time automatically.' },
                { icon: ShieldCheck, title: 'Verification Workflow', desc: 'Streamlined approval process for certified organizations.' },
                { icon: Fingerprint, title: 'Carbon Passport', desc: 'Immutable records for every ton of carbon sequestered.' },
                { icon: Wallet, title: 'Funding Center', desc: 'Connect with sustainability partners for project financing.' },
                { icon: FileText, title: 'Automated Reports', desc: 'Generate compliance-ready PDF reports with one click.' },
                { icon: Bell, title: 'Smart Notifications', desc: 'Stay updated on project changes and verification statuses.' },
                { icon: Users, title: 'Role-Based Dashboards', desc: 'Customized interfaces tailored to each stakeholder.' },
                { icon: MessageSquare, title: 'Discussion Workspace', desc: 'Communicate directly with verifiers within the platform.' }
              ].map((feature, i) => (
                <Card key={i} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 8. LIVE PLATFORM PREVIEW */}
        <section className="py-24 bg-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Designed for clarity and efficiency.</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="mt-1"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Owner Dashboard</h4>
                      <p className="text-sm text-slate-600 mt-1">Get a high-level view of all your restoration sites, pending verifications, and funding metrics.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Verifier Workspace</h4>
                      <p className="text-sm text-slate-600 mt-1">Review evidence systematically, leave comments, and issue approvals securely.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1"><CheckCircle2 className="h-5 w-5 text-blue-500" /></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Sustainability Hub</h4>
                      <p className="text-sm text-slate-600 mt-1">Track your portfolio&apos;s impact, download ESG reports, and discover new opportunities.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-2xl border border-slate-200 shadow-2xl p-2 bg-slate-50 relative z-10 -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="h-8 bg-slate-100 flex items-center px-4 border-b border-slate-200">
                       <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div></div>
                    </div>
                    <div className="p-6">
                      <div className="h-6 w-1/3 bg-slate-100 rounded mb-6"></div>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="h-20 bg-slate-50 border border-slate-100 rounded-lg"></div>
                        <div className="h-20 bg-slate-50 border border-slate-100 rounded-lg"></div>
                        <div className="h-20 bg-slate-50 border border-slate-100 rounded-lg"></div>
                      </div>
                      <div className="h-32 bg-slate-50 border border-slate-100 rounded-lg mb-4"></div>
                      <div className="h-32 bg-slate-50 border border-slate-100 rounded-lg"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10 translate-x-10 translate-y-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. IMPACT STATISTICS */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center divide-x divide-primary-foreground/20">
              <div className="flex flex-col items-center justify-center border-none">
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-sm text-primary-foreground/80">Projects Registered</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold mb-1">2.4M</div>
                <div className="text-sm text-primary-foreground/80">Hectares Restored</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold mb-1">8.5M</div>
                <div className="text-sm text-primary-foreground/80">Tons CO₂ Captured</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold mb-1">120+</div>
                <div className="text-sm text-primary-foreground/80">Organizations</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold mb-1">45</div>
                <div className="text-sm text-primary-foreground/80">Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. WHY CARBONRUSH AI */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">A new standard for MRV</h2>
            </div>
            
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 bg-slate-50 border-b border-slate-200 p-4 md:p-6 text-sm font-semibold text-slate-900">
                <div className="hidden md:block">Capability</div>
                <div>Traditional Process</div>
                <div className="text-primary flex items-center gap-2"><Logo showText={false} iconClassName="w-5 h-5"/> CarbonRush AI</div>
              </div>
              
              {[
                { label: 'Documentation', old: 'Manual & Paper-based', new: 'AI-assisted & Digital' },
                { label: 'Communication', old: 'Scattered Emails', new: 'Centralized Workspace' },
                { label: 'Transparency', old: 'Black Box', new: 'Shared Timeline' },
                { label: 'Reporting', old: 'Fragmented Files', new: 'Unified Dashboards' },
                { label: 'Verification Speed', old: 'Months', new: 'Weeks' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-3 border-b last:border-0 border-slate-100 p-4 md:p-6 text-sm items-center">
                  <div className="hidden md:block font-medium text-slate-900">{row.label}</div>
                  <div className="text-slate-500 pr-4">{row.old}</div>
                  <div className="font-medium text-slate-900 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500"/> {row.new}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11. TESTIMONIALS */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Trusted by the community</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-1 text-amber-400 mb-4">★ ★ ★ ★ ★</div>
                  <p className="text-slate-700 italic mb-6">&quot;The platform has completely transformed how we document our mangrove restoration. What used to take weeks of formatting now happens automatically.&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">Sarah Jenkins</div>
                      <div className="text-xs text-slate-500">Project Owner, OceanSave NGO</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-1 text-amber-400 mb-4">★ ★ ★ ★ ★</div>
                  <p className="text-slate-700 italic mb-6">&quot;As verifiers, having all evidence geo-tagged and timestamped in one workspace makes our audits significantly faster and more accurate.&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">Dr. Michael Chen</div>
                      <div className="text-xs text-slate-500">Lead Auditor, VerifyCarbon</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-1 text-amber-400 mb-4">★ ★ ★ ★ ★</div>
                  <p className="text-slate-700 italic mb-6">&quot;We need absolute transparency for our ESG reporting. CarbonRush provides the immutable proof we require to confidently fund these projects.&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">Elena Rodriguez</div>
                      <div className="text-xs text-slate-500">CSR Director, GlobalTech</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 12. FAQ */}
        <section className="py-24 bg-white" id="about">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Frequently Asked Questions</h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-semibold">What is Blue Carbon?</AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  Blue carbon refers to the carbon captured by the world&apos;s ocean and coastal ecosystems, such as mangroves, salt marshes, and seagrasses. These ecosystems are highly efficient at sequestering carbon.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-semibold">How does the verification process work?</AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  Project owners upload evidence (photos, GIS data, documents). Certified verifiers then review this data within the platform, ask clarifying questions, and ultimately issue approvals which generate immutable Carbon Passports.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-semibold">Who can register on the platform?</AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  We welcome project developers (NGOs, local communities), accredited verification bodies, and corporate sustainability partners looking to fund verified restoration efforts.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-semibold">Is GIS data supported?</AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  Yes, our platform includes integrated map tools. You can draw project boundaries, upload shapefiles, and track precise geospatial coordinates for all field evidence.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left font-semibold">Can companies directly fund projects?</AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  Absolutely. Our Sustainability Partners portal allows companies to discover verified projects, monitor their ongoing impact, and channel funding directly to the project owners.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* 13. FINAL CTA */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-50/50"></div>
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">Ready to restore ecosystems with confidence?</h2>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Join the transparent MRV platform trusted by leading project developers, verifiers, and sustainability partners worldwide.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="rounded-full h-14 px-10 text-base" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-10 text-base bg-white" asChild>
                <Link href="/login">Login to Workspace</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* 14. FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-block mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Leaf className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-display text-xl font-bold text-white">CarbonRush AI</span>
                </div>
              </Link>
              <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
                The transparent Monitoring, Reporting & Verification (MRV) platform for Blue Carbon restoration projects.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-primary transition-colors">How it works</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="#contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} CarbonRush AI. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
