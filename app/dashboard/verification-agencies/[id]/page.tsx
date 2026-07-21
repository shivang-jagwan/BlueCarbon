'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, ShieldCheck, Building2, MapPin, Globe, Clock,
  CheckCircle2, Briefcase, Users, CalendarClock, Award,
  FileText, Map, Check, AlertCircle, ChevronRight,
  Edit, ExternalLink, Mail, Phone, DollarSign, Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getVerificationAgency, getActiveAgencyServices, getRecentProjectsForAgency,
} from '@/lib/voc-services';
import type { VerificationAgency, AgencyService } from '@/lib/voc-types';
import { AGENCY_SERVICE_CATEGORY_LABELS } from '@/lib/voc-types';
import { RequestMonitoringModal } from '@/components/shared/RequestMonitoringModal';

const AVAILABILITY_CONFIG = {
  accepting: { label: 'Accepting Applications', color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
  limited: { label: 'Limited Capacity', color: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  fully_booked: { label: 'Fully Booked', color: 'text-red-700 bg-red-50', dot: 'bg-red-500' },
} as const;

export default function OrganizationProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const agencyId = params.id as string;
  const [agency, setAgency] = React.useState<VerificationAgency | null>(null);
  const [services, setServices] = React.useState<AgencyService[]>([]);
  const [recentProjects, setRecentProjects] = React.useState<{ project_name: string; status: string; date: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [monitoringModalOpen, setMonitoringModalOpen] = React.useState(false);

  const isOwner = agency && user && agency.profile_id === user.id;
  const isPartner = profile?.role === 'sustainability_partner';

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [a, svc, projects] = await Promise.all([
        getVerificationAgency(agencyId),
        getActiveAgencyServices(agencyId),
        getRecentProjectsForAgency(agencyId),
      ]);
      if (cancelled) return;
      setAgency(a || null);
      setServices(svc);
      setRecentProjects(projects);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [agencyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Loading agency profile...</p>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Agency not found.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/dashboard/verification-agencies')}>
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  const avail = AVAILABILITY_CONFIG[agency.availability];
  const currentYear = new Date().getFullYear();
  const workloadPercent = Math.min(100, Math.round((agency.active_applications / Math.max(1, agency.active_applications + agency.available_audit_teams * 5)) * 100));

  return (
    <div className="space-y-6 pb-20">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/verification-agencies')} className="mb-3 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Directory
        </Button>

        {/* Cover Image */}
        {agency.cover_image && (
          <div className="h-40 rounded-xl overflow-hidden mb-4 bg-muted">
            <img src={agency.cover_image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 overflow-hidden">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{agency.name}</h1>
              {agency.verification_status === 'active' && (
                <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 gap-1">
                  <ShieldCheck className="h-3 w-3" /> Government Verified
                </Badge>
              )}
              {isOwner && (
                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 ml-2" onClick={() => router.push(`/dashboard/verification-agencies/${agencyId}/edit`)}>
                  <Edit className="h-3 w-3" /> Edit Profile
                </Button>
              )}
              {isPartner && (
                <Button
                  size="sm"
                  className="h-6 text-[10px] gap-1 ml-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setMonitoringModalOpen(true)}
                >
                  <Handshake className="h-3 w-3" /> Request Monitoring Partnership
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">{agency.registration_number}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {agency.headquarters}</span>
              <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {agency.countries_served.length} countries served</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Est. {agency.founded_year} ({currentYear - agency.founded_year} years)</span>
            </div>
            {/* Contact quick links */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {agency.website && (
                <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Website
                </a>
              )}
              {agency.email && (
                <a href={`mailto:${agency.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Mail className="h-3 w-3" /> {agency.email}
                </a>
              )}
              {agency.phone && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> {agency.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="about" className="space-y-6">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="projects">Recent Projects</TabsTrigger>
        </TabsList>

        {/* About */}
        <TabsContent value="about" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">About the Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Description</p>
                <p className="text-sm leading-relaxed">{agency.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Mission</p>
                <p className="text-sm leading-relaxed italic text-muted-foreground">{agency.mission}</p>
              </div>
              {agency.vision && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 font-medium">Vision</p>
                    <p className="text-sm leading-relaxed italic text-muted-foreground">{agency.vision}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agency.expertise.map(exp => (
                  <Badge key={exp} variant="secondary" className="text-xs px-3 py-1">{exp}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" /> Supported Ecosystems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agency.supported_ecosystems.map(eco => (
                  <Badge key={eco} variant="outline" className="text-xs px-3 py-1">{eco}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="space-y-6">
          {services.length > 0 ? (
            <div className="space-y-3">
              {services.map(svc => (
                <Card key={svc.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{svc.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {AGENCY_SERVICE_CATEGORY_LABELS[svc.category]}
                          </Badge>
                        </div>
                        {svc.description && (
                          <p className="text-xs text-muted-foreground">{svc.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-primary">
                          ${svc.price.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {svc.currency} / {svc.price_unit.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No services listed yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold font-display text-foreground">{agency.projects_certified}</p>
                <p className="text-xs text-muted-foreground mt-1">Projects Certified</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold font-display text-foreground">{agency.active_applications}</p>
                <p className="text-xs text-muted-foreground mt-1">Projects Under Review</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold font-display text-foreground">{agency.avg_verification_days}<span className="text-lg">d</span></p>
                <p className="text-xs text-muted-foreground mt-1">Average Verification Time</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold font-display text-foreground">{agency.years_of_operation}<span className="text-lg">y</span></p>
                <p className="text-xs text-muted-foreground mt-1">Years of Operation</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold font-display text-foreground">{agency.countries_served.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Countries Served</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold font-display text-foreground">{agency.states_covered.length}</p>
                <p className="text-xs text-muted-foreground mt-1">States Covered</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Verification Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Current Applications</p>
                  <p className="text-sm font-semibold">{agency.active_applications}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Available Audit Teams</p>
                  <p className="text-sm font-semibold">{agency.available_audit_teams}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Review Time</p>
                  <p className="text-sm font-semibold">{agency.estimated_review_days} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Workload</p>
                  <p className="text-sm font-semibold">{workloadPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage */}
        <TabsContent value="coverage" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Map className="h-4 w-4 text-muted-foreground" /> Geographic Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">States / Regions</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {agency.states_covered.map(s => (
                    <div key={s} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Countries Served</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {agency.countries_served.map(c => (
                    <div key={c} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications */}
        <TabsContent value="certifications" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" /> Certifications & Accreditations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agency.certifications.map(cert => (
                  <div key={cert.name} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{cert.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Projects */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Recent Certified Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map((proj, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{proj.project_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(proj.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                        </Badge>
                      </div>
                      {i < recentProjects.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              ) : agency.recent_projects.length > 0 ? (
                <div className="space-y-3">
                  {agency.recent_projects.map((proj, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{proj.project_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(proj.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                        </Badge>
                      </div>
                      {i < agency.recent_projects.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No recent projects yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {agency && isPartner && (
        <RequestMonitoringModal
          verifierId={agency.profile_id}
          verifierName={agency.name}
          isOpen={monitoringModalOpen}
          onClose={() => setMonitoringModalOpen(false)}
        />
      )}
    </div>
  );
}
