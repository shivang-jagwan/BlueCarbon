'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search, ShieldCheck, Building2, MapPin, Globe, Clock,
  CheckCircle2, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVerificationAgencies } from '@/lib/voc-services';
import type { VerificationAgency, AgencyAvailability } from '@/lib/voc-types';

const AVAILABILITY_CONFIG: Record<AgencyAvailability, { label: string; color: string; dot: string }> = {
  accepting: { label: 'Accepting Applications', color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
  limited: { label: 'Limited Capacity', color: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  fully_booked: { label: 'Fully Booked', color: 'text-red-700 bg-red-50', dot: 'bg-red-500' },
};

interface AgencySelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (agency: VerificationAgency) => void;
  selectedAgency: VerificationAgency | null;
}

export function AgencySelectorModal({ open, onOpenChange, onSelect, selectedAgency }: AgencySelectorModalProps) {
  const router = useRouter();
  const allAgencies = React.useMemo(() => getVerificationAgencies(), []);
  const [search, setSearch] = React.useState('');
  const [countryFilter, setCountryFilter] = React.useState('all');
  const [expertiseFilter, setExpertiseFilter] = React.useState('all');
  const [availabilityFilter, setAvailabilityFilter] = React.useState('all');

  const allCountries = React.useMemo(() => {
    const set = new Set<string>();
    allAgencies.forEach(a => a.countries_served.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [allAgencies]);

  const allExpertise = React.useMemo(() => {
    const set = new Set<string>();
    allAgencies.forEach(a => a.expertise.forEach(e => set.add(e)));
    return Array.from(set).sort();
  }, [allAgencies]);

  const filtered = React.useMemo(() => {
    return allAgencies.filter(a => {
      const matchesSearch = !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.expertise.some(e => e.toLowerCase().includes(search.toLowerCase()));
      const matchesCountry = countryFilter === 'all' || a.countries_served.includes(countryFilter);
      const matchesExpertise = expertiseFilter === 'all' || a.expertise.includes(expertiseFilter);
      const matchesAvailability = availabilityFilter === 'all' || a.availability === availabilityFilter;
      return matchesSearch && matchesCountry && matchesExpertise && matchesAvailability;
    });
  }, [allAgencies, search, countryFilter, expertiseFilter, availabilityFilter]);

  function handleSelect(agency: VerificationAgency) {
    onSelect(agency);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-display flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Choose Verification Agency
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select a certified agency to review and verify your project.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, expertise, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="h-8 w-auto text-xs"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {allCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
              <SelectTrigger className="h-8 w-auto text-xs"><SelectValue placeholder="Expertise" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expertise</SelectItem>
                {allExpertise.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="h-8 w-auto text-xs"><SelectValue placeholder="Availability" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="accepting">Accepting Applications</SelectItem>
                <SelectItem value="limited">Limited Capacity</SelectItem>
                <SelectItem value="fully_booked">Fully Booked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-3 py-4">
            {filtered.map(agency => {
              const avail = AVAILABILITY_CONFIG[agency.availability];
              const isSelected = selectedAgency?.id === agency.id;
              return (
                <div
                  key={agency.id}
                  className={cn(
                    'rounded-xl border-2 p-4 transition-all cursor-pointer',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 hover:border-primary/40 hover:bg-muted/30',
                  )}
                  onClick={() => handleSelect(agency)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{agency.name}</p>
                        {agency.verification_status === 'active' && (
                          <Badge variant="outline" className="text-[9px] border-emerald-200 bg-emerald-50 text-emerald-700 gap-0.5 px-1.5 py-0">
                            <ShieldCheck className="h-2.5 w-2.5" /> Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {agency.headquarters}</span>
                        <span>{agency.projects_certified} projects certified</span>
                        <span>{agency.avg_verification_days}d avg</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agency.expertise.slice(0, 4).map(exp => (
                          <Badge key={exp} variant="secondary" className="text-[9px] px-1.5 py-0">{exp}</Badge>
                        ))}
                      </div>
                      <div className={cn('flex items-center gap-1.5 text-[10px] font-medium mt-2 px-2 py-0.5 rounded-full w-fit', avail.color)}>
                        <div className={cn('h-1.5 w-1.5 rounded-full', avail.dot)} />
                        {avail.label}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No agencies match your filters.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
