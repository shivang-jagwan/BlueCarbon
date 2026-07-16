'use client';

import * as React from 'react';
import { User, Shield, Building2, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import type { Project } from '@/lib/types';

interface RelationshipCardProps {
  project: Project;
}

interface ActorInfo {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

export function ProjectRelationshipCard({ project }: RelationshipCardProps) {
  const [owner, setOwner] = React.useState<ActorInfo | null>(null);
  const [verifier, setVerifier] = React.useState<ActorInfo | null>(null);
  const [partner, setPartner] = React.useState<ActorInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!project?.id) return;

    const loadRelationships = async () => {
      const { data: partnership } = await supabase
        .from('project_partnerships')
        .select('company_id, verifier_id')
        .eq('project_id', project.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      const [ownerResult, verifierResult, partnerResult] = await Promise.all([
        project.owner_id
          ? supabase.from('profiles').select('full_name, organization').eq('id', project.owner_id).single()
          : Promise.resolve({ data: null }),
        partnership?.verifier_id
          ? supabase.from('profiles').select('full_name, organization').eq('id', partnership.verifier_id).single()
          : Promise.resolve({ data: null }),
        (partnership as any)?.company_id
          ? supabase.from('profiles').select('full_name, organization').eq('id', (partnership as any).company_id).single()
          : Promise.resolve({ data: null }),
      ]);

      if (ownerResult.data) {
        setOwner({
          id: project.owner_id,
          name: ownerResult.data.full_name || 'Project Owner',
          subtitle: ownerResult.data.organization || 'Owner',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 border-emerald-200',
          icon: <User className="h-5 w-5 text-emerald-600" />,
        });
      }

      if (verifierResult.data) {
        setVerifier({
          id: partnership!.verifier_id,
          name: verifierResult.data.full_name || 'Verifier',
          subtitle: verifierResult.data.organization || 'Verification Organization',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          icon: <Shield className="h-5 w-5 text-blue-600" />,
        });
      }

      if (partnerResult.data) {
        setPartner({
          id: (partnership as any).company_id,
          name: partnerResult.data.full_name || 'Partner Company',
          subtitle: partnerResult.data.organization || 'Sustainability Partner',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 border-purple-200',
          icon: <Building2 className="h-5 w-5 text-purple-600" />,
        });
      }

      setLoading(false);
    };

    loadRelationships();
  }, [project?.id, project?.owner_id]);

  const actors = [owner, verifier, partner].filter(Boolean) as ActorInfo[];

  if (loading) {
    return (
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Project Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-slate-100 rounded-lg" />
            <div className="h-8 w-4 mx-auto bg-slate-100 rounded" />
            <div className="h-16 bg-slate-100 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actors.length === 0) return null;

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Project Relationships</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-0">
          {actors.map((actor, index) => (
            <React.Fragment key={actor.id}>
              <div className={`w-full flex items-center gap-3 p-3 rounded-lg border ${actor.bgColor} transition-all`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${actor.color}`}>
                  {actor.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {actor.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {actor.subtitle}
                  </p>
                </div>
              </div>

              {index < actors.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-0.5 h-5 bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700" />
                  <ArrowDown className="h-3.5 w-3.5 text-slate-400 -mt-1" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
