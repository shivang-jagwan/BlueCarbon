'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, ShieldCheck, Building2, ArrowRight } from 'lucide-react';

export default function RoleSelectionPage() {
  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold">Join CarbonRush AI</h1>
        <p className="mt-2 text-slate-600">
          Choose your role to get started with the platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Project Owner */}
        <Link href="/register/details?role=project_owner" className="group">
          <Card className="h-full border-slate-200 transition-all hover:border-primary hover:shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <Leaf className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl">Project Owner</CardTitle>
              <CardDescription className="mt-2">
                Register blue carbon projects, upload monitoring evidence, and track restoration progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <div className="flex items-center text-sm font-medium text-primary">
                Select Role <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Verifier */}
        <Link href="/register/details?role=verifier" className="group">
          <Card className="h-full border-slate-200 transition-all hover:border-primary hover:shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl">Verifier</CardTitle>
              <CardDescription className="mt-2">
                Review project evidence, conduct audits, and issue certified Carbon Passports.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <div className="flex items-center text-sm font-medium text-primary">
                Select Role <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Sustainability Partner */}
        <Link href="/register/details?role=sustainability_partner" className="group">
          <Card className="h-full border-slate-200 transition-all hover:border-primary hover:shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Building2 className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl">Sustainability Partner</CardTitle>
              <CardDescription className="mt-2">
                Discover verified projects, support restoration efforts, and track your ESG impact.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <div className="flex items-center text-sm font-medium text-primary">
                Select Role <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
