'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RequestVerificationModal } from '@/components/shared/RequestVerificationModal';
import { RequestMonitoringModal } from '@/components/shared/RequestMonitoringModal';
import { useAuth } from '@/components/providers/auth-provider';
import {
  Star,
  ShieldCheck,
  Award,
  Users,
  MapPin,
  Clock,
  Building2,
  Globe,
  Wallet,
  Calendar,
  Languages,
  CheckCircle2,
  FileText,
  MessageSquare,
} from 'lucide-react';
import type { Profile, Project } from '@/lib/types';
import Link from 'next/link';

export default function VerifierProfilePage() {
  const params = useParams();
  const verifierId = params.id as string;
  const { profile } = useAuth();

  const [verifier, setVerifier] = React.useState<Profile | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', verifierId)
        .single();
      
      if (profileData) {
        setVerifier(profileData as Profile);
      }

      // Fetch monitoring projects via partnerships
      const { data: partnershipRows } = await supabase
        .from('project_partnerships')
        .select('project_id')
        .eq('verifier_id', verifierId)
        .eq('status', 'active');

      const partnershipProjectIds = (partnershipRows || []).map((r: any) => r.project_id);

      if (partnershipProjectIds.length > 0) {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .in('id', partnershipProjectIds)
          .order('updated_at', { ascending: false })
          .limit(3);

        if (projectsData) {
          setProjects(projectsData as Project[]);
        }
      }

      setLoading(false);
    })();
  }, [verifierId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!verifier) {
    return (
      <div className="py-20 text-center">
        <h3 className="text-lg font-semibold">Verifier not found</h3>
      </div>
    );
  }

  const initials = (verifier.full_name || verifier.email)
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const services = verifier.services_offered || [];
  const teamMembers: any[] = verifier.team_members ? (verifier.team_members as any) : [];
  const pricing = verifier.pricing_info ? (verifier.pricing_info as any) : null;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-primary/10"></div>
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <Avatar className="-mt-12 h-24 w-24 border-4 border-background shadow-sm">
                <AvatarImage src={verifier.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                  {verifier.full_name || verifier.organization || 'Verifier'}
                  <Badge variant="secondary" className="gap-1 bg-success/10 text-success hover:bg-success/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Partner
                  </Badge>
                </h1>
                <p className="mt-1 text-muted-foreground flex items-center gap-4">
                  <span>{verifier.organization_type || 'Private Agency'}</span>
                  {verifier.country && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-4 w-4" /> {verifier.country}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="pb-1 flex gap-3">
              <Button size="lg" onClick={() => setModalOpen(true)}>
                {profile?.role === 'sustainability_partner' ? 'Request Project Monitoring' : 'Request Verification'}
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Rating</span>
              <span className="text-xl font-bold flex items-center gap-1.5">
                    {verifier.rating ? (
                  <>
                    <Star className="h-5 w-5 text-warning fill-warning" />
                    {verifier.rating}
                  </>
                ) : (
                  <span className="text-base text-muted-foreground">Not yet rated</span>
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Verified Projects</span>
              <span className="text-xl font-bold">{verifier.projects_verified_count ?? '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Experience</span>
              <span className="text-xl font-bold">{verifier.experience || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Availability</span>
              <span className="text-xl font-bold capitalize text-success">
                {verifier.availability_status || 'Accepting'}
              </span>
            </div>
          </div>
          
          {verifier.bio && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">About Organization</h3>
              <p className="text-muted-foreground leading-relaxed">
                {verifier.bio}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="md:col-span-2 space-y-6">
          {/* Services */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Services Offered
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {services.length > 0 ? services.map((service, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{service}</span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic col-span-2">No services listed yet.</p>
              )}
            </div>
          </Card>

          {/* Team */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Key Team Members
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {teamMembers.length > 0 ? teamMembers.map((member, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarFallback className="bg-primary/5">{member.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{member.experience}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic col-span-2">No team information available.</p>
              )}
            </div>
          </Card>

          {/* Recent Verified Projects */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Recently Verified Projects
            </h3>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No public verified projects available yet.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                      <div>
                        <h4 className="font-medium text-primary">{project.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Verified on {new Date(project.updated_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="bg-success/5 text-success border-success/20">Verified</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Content - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Organization Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Organization Details</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Registration Number</p>
                  <p className="text-sm font-medium">{verifier.registration_number || '—'}</p>
                </div>
              </div>
              {verifier.website && (
                <div className="flex gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Website</p>
                    <a href={verifier.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                      {(() => { try { return new URL(verifier.website).hostname; } catch { return verifier.website; } })()}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Office Address</p>
                  <p className="text-sm font-medium">
                    {verifier.office_address || 'Not provided'} <br />
                    {verifier.district && `${verifier.district}, `}{verifier.state && `${verifier.state}, `}{verifier.country || ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Languages className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Languages</p>
                  <p className="text-sm font-medium">{verifier.languages_spoken ? verifier.languages_spoken.join(', ') : 'Not specified'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg Response Time</p>
                  <p className="text-sm font-medium">{verifier.average_response_time || '< 24 Hours'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Standard Charges
            </h3>
            <div className="space-y-3">
              {pricing ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Land Verification</span>
                    <span className="font-medium">${pricing.land || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Project Verification</span>
                    <span className="font-medium">${pricing.project || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Monthly Monitoring</span>
                    <span className="font-medium">{pricing.monthly ? `$${pricing.monthly}/mo` : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Corporate Audit</span>
                    <span className="font-medium">${pricing.corporate || '—'}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Pricing information not available.</p>
              )}
            </div>
          </Card>
          
          <Button variant="outline" className="w-full" asChild>
            <Link href="mailto:contact@verifier.com">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Organization
            </Link>
          </Button>
        </div>
      </div>

      {profile?.role === 'sustainability_partner' ? (
        <RequestMonitoringModal
          verifierId={verifier.id}
          verifierName={verifier.full_name || verifier.organization || 'Verifier'}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      ) : (
        <RequestVerificationModal
          verifierId={verifier.id}
          verifierName={verifier.full_name || verifier.organization || 'Verifier'}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
