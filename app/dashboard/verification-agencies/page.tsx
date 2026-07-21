'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Search, ShieldCheck, Building2, MapPin, Globe, Clock,
  CheckCircle2, ArrowRight, Briefcase, Users, CalendarClock,
  Filter, ChevronDown, ChevronUp, DollarSign, Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVerificationAgencies, getActiveAgencyServices } from '@/lib/voc-services';
import type { VerificationAgency, AgencyAvailability, SortOption, AgencyService } from '@/lib/voc-types';
import { useAuth } from '@/components/providers/auth-provider';
import { RequestMonitoringModal } from '@/components/shared/RequestMonitoringModal';

const AVAILABILITY_CONFIG: Record<AgencyAvailability, { label: string; color: string; dot: string }> = {
  accepting: { label: 'Accepting Applications', color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
  limited: { label: 'Limited Capacity', color: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  fully_booked: { label: 'Fully Booked', color: 'text-red-700 bg-red-50', dot: 'bg-red-500' },
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'experience', label: 'Most Experienced' },
  { value: 'projects', label: 'Most Projects Certified' },
  { value: 'speed', label: 'Fastest Verification Time' },
  { value: 'newest', label: 'Newest Agencies' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

function AgencyCard({ agency, services, onOpen, isPartner, onRequestMonitoring }: { agency: VerificationAgency; services: AgencyService[]; onOpen: () => void; isPartner?: boolean; onRequestMonitoring?: () => void }) {
  const avail = AVAILABILITY_CONFIG[agency.availability];
  const currentYear = new Date().getFullYear();
  const activeServices = services.filter(s => s.is_active);
  const minPrice = activeServices.length > 0 ? Math.min(...activeServices.map(s => s.price)) : null;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-foreground">{agency.name}</h3>
                {agency.verification_status === 'active' && (
                  <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 gap-1">
                    <ShieldCheck className="h-3 w-3" /> Government Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">{agency.registration_number}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {agency.headquarters}</span>
                <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {agency.countries_served.length} countries</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Est. {agency.founded_year}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {agency.expertise.map((exp) => (
                <Badge key={exp} variant="secondary" className="text-[10px] px-2 py-0.5">{exp}</Badge>
              ))}
            </div>

            {/* Services preview */}
            {activeServices.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {activeServices.length} service{activeServices.length !== 1 ? 's' : ''}
                </span>
                {minPrice !== null && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> From ${minPrice.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-lg font-bold text-foreground font-display">{agency.projects_certified}</p>
                <p className="text-[10px] text-muted-foreground">Projects Certified</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-lg font-bold text-foreground font-display">{agency.active_applications}</p>
                <p className="text-[10px] text-muted-foreground">Active Applications</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-lg font-bold text-foreground font-display">{agency.avg_verification_days}d</p>
                <p className="text-[10px] text-muted-foreground">Avg Verification</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-lg font-bold text-foreground font-display">{agency.years_of_operation}y</p>
                <p className="text-[10px] text-muted-foreground">Years of Operation</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', avail.color)}>
                <div className={cn('h-2 w-2 rounded-full', avail.dot)} />
                {avail.label}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onOpen} className="gap-1.5 text-xs h-8">
                  View Organization <ArrowRight className="h-3 w-3" />
                </Button>
                {isPartner && onRequestMonitoring && (
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onRequestMonitoring(); }}
                    className="gap-1.5 text-xs h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Handshake className="h-3 w-3" /> Request Monitoring
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerificationAgenciesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const isPartner = profile?.role === 'sustainability_partner';
  const [allAgencies, setAllAgencies] = React.useState<VerificationAgency[]>([]);
  const [servicesMap, setServicesMap] = React.useState<Record<string, AgencyService[]>>({});
  const [monitoringModalOpen, setMonitoringModalOpen] = React.useState(false);
  const [selectedAgency, setSelectedAgency] = React.useState<{ id: string; name: string } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getVerificationAgencies();
      if (cancelled) return;
      setAllAgencies(data);

      // Load services for each agency in parallel
      const entries = await Promise.all(
        data.map(async (a) => {
          const svc = await getActiveAgencyServices(a.id);
          return [a.id, svc] as const;
        })
      );
      if (!cancelled) {
        setServicesMap(Object.fromEntries(entries));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [search, setSearch] = React.useState('');
  const [countryFilter, setCountryFilter] = React.useState('all');
  const [stateFilter, setStateFilter] = React.useState('all');
  const [expertiseFilter, setExpertiseFilter] = React.useState('all');
  const [availabilityFilter, setAvailabilityFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('experience');
  const [showFilters, setShowFilters] = React.useState(false);

  const allCountries = React.useMemo(() => {
    const set = new Set<string>();
    allAgencies.forEach(a => a.countries_served.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [allAgencies]);

  const allStates = React.useMemo(() => {
    const set = new Set<string>();
    allAgencies.forEach(a => a.states_covered.forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, [allAgencies]);

  const allExpertise = React.useMemo(() => {
    const set = new Set<string>();
    allAgencies.forEach(a => a.expertise.forEach(e => set.add(e)));
    return Array.from(set).sort();
  }, [allAgencies]);

  const filtered = React.useMemo(() => {
    let result = allAgencies.filter(a => {
      const matchesSearch = !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.expertise.some(e => e.toLowerCase().includes(search.toLowerCase())) ||
        a.headquarters.toLowerCase().includes(search.toLowerCase());
      const matchesCountry = countryFilter === 'all' || a.countries_served.includes(countryFilter);
      const matchesState = stateFilter === 'all' || a.states_covered.includes(stateFilter);
      const matchesExpertise = expertiseFilter === 'all' || a.expertise.includes(expertiseFilter);
      const matchesAvailability = availabilityFilter === 'all' || a.availability === availabilityFilter;
      return matchesSearch && matchesCountry && matchesState && matchesExpertise && matchesAvailability;
    });

    switch (sortBy) {
      case 'experience':
        result.sort((a, b) => b.years_of_operation - a.years_of_operation);
        break;
      case 'projects':
        result.sort((a, b) => b.projects_certified - a.projects_certified);
        break;
      case 'speed':
        result.sort((a, b) => a.avg_verification_days - b.avg_verification_days);
        break;
      case 'newest':
        result.sort((a, b) => b.founded_year - a.founded_year);
        break;
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return result;
  }, [allAgencies, search, countryFilter, stateFilter, expertiseFilter, availabilityFilter, sortBy]);

  const activeFilterCount = [countryFilter, stateFilter, expertiseFilter, availabilityFilter]
    .filter(f => f !== 'all').length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Agency Directory</h1>
        <p className="text-sm text-muted-foreground">
          Find certified organizations to verify and certify your Blue Carbon project.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agencies by name, expertise, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] ml-1">{activeFilterCount}</Badge>
            )}
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showFilters && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Country</Label>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Countries" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {allCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">State / Region</Label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All States" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {allStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Expertise</Label>
                  <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Expertise" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Expertise</SelectItem>
                      {allExpertise.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Availability</Label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="accepting">Accepting Applications</SelectItem>
                      <SelectItem value="limited">Limited Capacity</SelectItem>
                      <SelectItem value="fully_booked">Fully Booked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-xs text-muted-foreground"
                  onClick={() => { setCountryFilter('all'); setStateFilter('all'); setExpertiseFilter('all'); setAvailabilityFilter('all'); }}
                >
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'agency' : 'agencies'} found
      </p>

      <div className="space-y-4">
        {filtered.map(agency => (
          <AgencyCard
            key={agency.id}
            agency={agency}
            services={servicesMap[agency.id] || []}
            onOpen={() => router.push(`/dashboard/verification-agencies/${agency.id}`)}
            isPartner={isPartner}
            onRequestMonitoring={() => {
              setSelectedAgency({ id: agency.profile_id, name: agency.name });
              setMonitoringModalOpen(true);
            }}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No agencies match your filters.</p>
            <p className="text-xs mt-1">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {selectedAgency && (
        <RequestMonitoringModal
          verifierId={selectedAgency.id}
          verifierName={selectedAgency.name}
          isOpen={monitoringModalOpen}
          onClose={() => { setMonitoringModalOpen(false); setSelectedAgency(null); }}
        />
      )}
    </div>
  );
}
