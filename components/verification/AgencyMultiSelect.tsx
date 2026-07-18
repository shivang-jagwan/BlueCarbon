'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, X, ShieldCheck, Building2, MapPin, Users, Clock, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVerificationAgencies } from '@/lib/voc-services';
import type { VerificationAgency, AgencyAvailability } from '@/lib/voc-types';

const AVAILABILITY_DOT: Record<AgencyAvailability, string> = {
  accepting: 'bg-emerald-500',
  limited: 'bg-amber-500',
  fully_booked: 'bg-red-500',
};

interface AgencyMultiSelectProps {
  selected: VerificationAgency[];
  onChange: (agencies: VerificationAgency[]) => void;
  maxSelections?: number;
}

export function AgencyMultiSelect({ selected, onChange, maxSelections = 5 }: AgencyMultiSelectProps) {
  const [allAgencies, setAllAgencies] = React.useState<VerificationAgency[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getVerificationAgencies();
      if (!cancelled) setAllAgencies(data);
    })();
    return () => { cancelled = true; };
  }, []);

  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const selectedIds = new Set(selected.map(a => a.id));
    let results = allAgencies.filter(a =>
      !selectedIds.has(a.id) && a.availability !== 'fully_booked'
    );
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.headquarters.toLowerCase().includes(q) ||
        a.expertise.some(e => e.toLowerCase().includes(q)) ||
        a.states_covered.some(s => s.toLowerCase().includes(q)) ||
        a.countries_served.some(c => c.toLowerCase().includes(q))
      );
    }
    return results;
  }, [allAgencies, selected, query]);

  function addAgency(agency: VerificationAgency) {
    if (selected.length >= maxSelections) return;
    if (selected.some(a => a.id === agency.id)) return;
    onChange([...selected, agency]);
    setQuery('');
    inputRef.current?.focus();
  }

  function removeAgency(agencyId: string) {
    onChange(selected.filter(a => a.id !== agencyId));
  }

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Verification Agencies</Label>
        <p className="text-xs text-muted-foreground">
          Search and select up to {maxSelections} agencies. Each will receive a separate verification request.
        </p>
      </div>

      {selected.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Selected Agencies ({selected.length}/{maxSelections})</p>
          <div className="flex flex-wrap gap-2">
            {selected.map(agency => {
              const availColor = AVAILABILITY_DOT[agency.availability];
              return (
                <div
                  key={agency.id}
                  className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 px-3 py-2"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/50">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate max-w-[160px]">{agency.name}</p>
                      <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', availColor)} />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                      {agency.projects_certified} certified &middot; {agency.avg_verification_days}d avg
                    </p>
                  </div>
                  <button
                    onClick={() => removeAgency(agency.id)}
                    className="shrink-0 ml-1 rounded-md p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative" ref={containerRef}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search agencies by name, expertise, state, or country..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="pl-9"
          disabled={selected.length >= maxSelections}
        />
        {open && filtered.length > 0 && selected.length < maxSelections && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg max-h-[320px] overflow-y-auto">
            {filtered.map(agency => {
              const availColor = AVAILABILITY_DOT[agency.availability];
              return (
                <button
                  key={agency.id}
                  onClick={() => addAgency(agency)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{agency.name}</p>
                        {agency.verification_status === 'active' && (
                          <Badge variant="outline" className="text-[9px] border-emerald-200 bg-emerald-50 text-emerald-700 gap-0.5 px-1.5 py-0">
                            <ShieldCheck className="h-2.5 w-2.5" /> Verified
                          </Badge>
                        )}
                        <div className={cn('flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ml-auto', availColor === 'bg-emerald-500' ? 'text-emerald-700 bg-emerald-50' : availColor === 'bg-amber-500' ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50')}>
                          <div className={cn('h-1.5 w-1.5 rounded-full', availColor)} />
                          {agency.availability === 'accepting' ? 'Available' : agency.availability === 'limited' ? 'Limited' : 'Full'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {agency.headquarters}</span>
                        <span>{agency.projects_certified} projects</span>
                        <span>{agency.avg_verification_days}d avg</span>
                        <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" /> {agency.available_audit_teams} teams</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {agency.expertise.slice(0, 3).map(exp => (
                          <Badge key={exp} variant="secondary" className="text-[9px] px-1.5 py-0">{exp}</Badge>
                        ))}
                        {agency.expertise.length > 3 && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{agency.expertise.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {open && filtered.length === 0 && query && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground">
            No agencies match &ldquo;{query}&rdquo;
          </div>
        )}
      </div>

      {selected.length === 0 && (
        <div className="rounded-lg border border-dashed border-muted-foreground/20 p-4 text-center">
          <Building2 className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">No agencies selected. Use the search above to find agencies.</p>
        </div>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm font-medium', className)}>{children}</p>;
}
