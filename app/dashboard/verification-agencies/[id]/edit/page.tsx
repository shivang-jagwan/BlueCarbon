'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Save, Plus, X, Building2, Loader2, Check, Globe,
  Mail, Phone, MapPin, Briefcase, Award, Lightbulb, Image as ImageIcon,
  Camera, Link2, Shield, Trash2,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getVerificationAgency, updateAgencyProfile, getAgencyServices,
  createAgencyService, updateAgencyService, deleteAgencyService,
} from '@/lib/voc-services';
import type { VerificationAgency, AgencyService, AgencyServiceCategory, AgencyServicePriceUnit, AgencyAvailability, AgencyCertification } from '@/lib/voc-types';
import { uploadFile } from '@/services/storage';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

const EXPERTISE_OPTIONS = [
  'Mangrove Restoration', 'Blue Carbon', 'Wetlands', 'Coastal Restoration',
  'Seagrass', 'Biodiversity', 'Forest Restoration', 'Coral Reef Monitoring',
  'Salt Marsh', 'Drone Survey', 'Satellite Monitoring', 'GIS Mapping',
  'Carbon Certification', 'Environmental Impact Assessment',
  'Community Engagement', 'Community-Led Verification', 'Small-Scale Projects',
  'River Delta Systems', 'Coastal Resilience', 'Arid Coastal Restoration',
  'Hurricane Resilience', 'Cold-Water Ecosystems', 'Arctic Coastal',
  'Desalination Impact Assessment', 'Underwater Survey', 'Aerial Assessment',
  'Capacity Building', 'LiDAR Survey', 'Seagrass Mapping',
];

const ECOSYSTEM_OPTIONS = [
  'Mangroves', 'Wetlands', 'Blue Carbon', 'Coastal Restoration',
  'Seagrass', 'Coral Reefs', 'Coastal Forests', 'Salt Marshes',
  'Coastal Lagoons', 'River Deltas', 'Floodplain Wetlands', 'Peatlands',
  'Kelp Forests', 'Arctic Coastal Wetlands', 'Maquis Shrubland',
  'Coastal Dunes', 'Tidal Wetlands', 'Lagoons', 'Sabkha',
  'Seagrass Beds', 'Floodplain Forests',
];

const AVAILABILITY_OPTIONS = [
  { value: 'accepting', label: 'Accepting Applications' },
  { value: 'limited', label: 'Limited Capacity' },
  { value: 'fully_booked', label: 'Fully Booked' },
];

const SERVICE_CATEGORY_OPTIONS: { value: AgencyServiceCategory; label: string }[] = [
  { value: 'verification', label: 'Verification' },
  { value: 'audit', label: 'Field Audit' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'mapping', label: 'Mapping & Survey' },
  { value: 'training', label: 'Training' },
  { value: 'certification', label: 'Certification' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'other', label: 'Other' },
];

const CERTIFICATION_PRESETS = [
  'Government Registration', 'ISO 9001', 'ISO 14001', 'ISO 14064',
  'Blue Carbon Certification', 'Gold Standard', 'Verra VCS', 'CDM',
  'Climate Action Reserve', 'American Carbon Registry', 'Puro.earth',
  'IUCN Green List', 'MSC Certification', 'FSC Certification',
  'Rainforest Alliance', 'Fair Trade', 'B Corp',
];

const SOCIAL_LINK_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
];

export default function AgencyEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const agencyId = params.id as string;

  const [agency, setAgency] = React.useState<VerificationAgency | null>(null);
  const [services, setServices] = React.useState<AgencyService[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('basic');

  const [form, setForm] = React.useState({
    name: '', description: '', mission: '', vision: '',
    website: '', email: '', phone: '',
    headquarters: '', founded_year: 0,
    availability: 'accepting' as AgencyAvailability,
    accepts_new_applications: true,
    projects_certified: 0,
    active_applications: 0,
    avg_verification_days: 0,
    years_of_operation: 0,
    available_audit_teams: 0,
    estimated_review_days: 0,
    registration_number: '',
    logo_url: '',
    cover_image: '',
  });

  const [expertise, setExpertise] = React.useState<string[]>([]);
  const [supportedEcosystems, setSupportedEcosystems] = React.useState<string[]>([]);
  const [countriesServed, setCountriesServed] = React.useState<string[]>([]);
  const [statesCovered, setStatesCovered] = React.useState<string[]>([]);
  const [districts, setDistricts] = React.useState<string[]>([]);
  const [socialLinks, setSocialLinks] = React.useState<Record<string, string>>({});
  const [certifications, setCertifications] = React.useState<AgencyCertification[]>([]);
  const [newCountry, setNewCountry] = React.useState('');
  const [newState, setNewState] = React.useState('');
  const [newDistrict, setNewDistrict] = React.useState('');
  const [newExpertise, setNewExpertise] = React.useState('');
  const [newEcosystem, setNewEcosystem] = React.useState('');
  const [newCertName, setNewCertName] = React.useState('');

  const [showServiceForm, setShowServiceForm] = React.useState(false);
  const [editingService, setEditingService] = React.useState<AgencyService | null>(null);
  const [serviceForm, setServiceForm] = React.useState({
    name: '', description: '', category: 'verification' as AgencyServiceCategory,
    price: 0, currency: 'USD', price_unit: 'per_project' as AgencyServicePriceUnit,
    estimated_duration_days: null as number | null, is_active: true,
  });

  const isOwner = agency && user && agency.profile_id === user.id;

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [a, svc] = await Promise.all([
        getVerificationAgency(agencyId),
        getAgencyServices(agencyId),
      ]);
      if (cancelled) return;
      if (!a) { setLoading(false); return; }
      setAgency(a);
      setServices(svc);
      setForm({
        name: a.name, description: a.description, mission: a.mission,
        vision: a.vision, website: a.website, email: a.email, phone: a.phone,
        headquarters: a.headquarters, founded_year: a.founded_year,
        availability: a.availability, accepts_new_applications: a.accepts_new_applications,
        projects_certified: a.projects_certified, active_applications: a.active_applications,
        avg_verification_days: a.avg_verification_days,
        years_of_operation: a.years_of_operation,
        available_audit_teams: a.available_audit_teams,
        estimated_review_days: a.estimated_review_days,
        registration_number: a.registration_number || '',
        logo_url: a.logo_url || '',
        cover_image: a.cover_image || '',
      });
      setExpertise([...a.expertise]);
      setSupportedEcosystems([...a.supported_ecosystems]);
      setCountriesServed([...a.countries_served]);
      setStatesCovered([...a.states_covered]);
      setDistricts([...a.districts]);
      setSocialLinks({ ...a.social_links });
      setCertifications([...a.certifications]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [agencyId]);

  const handleUploadImage = async (file: File, field: 'logo_url' | 'cover_image') => {
    const isLogo = field === 'logo_url';
    const setter = isLogo ? setUploadingLogo : setUploadingCover;
    setter(true);
    try {
      const result = await uploadFile(file, 'agency-assets', isLogo ? 'logo' : 'cover', agencyId);
      const publicUrl = supabase.storage.from('agency-assets').getPublicUrl(result.path).data.publicUrl;
      setForm(f => ({ ...f, [field]: publicUrl }));
      toast.success(isLogo ? 'Logo uploaded' : 'Cover image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setter(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!isOwner) return;
    setSaving(true);
    try {
      const updated = await updateAgencyProfile(agencyId, {
        ...form,
        expertise,
        supported_ecosystems: supportedEcosystems,
        countries_served: countriesServed,
        states_covered: statesCovered,
        districts,
        social_links: socialLinks,
        certifications,
      });
      if (updated) setAgency(updated);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async () => {
    if (!isOwner) return;
    try {
      if (editingService) {
        const updated = await updateAgencyService(editingService.id, serviceForm);
        if (updated) setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
        toast.success('Service updated');
      } else {
        const created = await createAgencyService({
          agency_id: agencyId,
          ...serviceForm,
          display_order: services.length,
        });
        setServices(prev => [...prev, created]);
        toast.success('Service created');
      }
      setShowServiceForm(false);
      setEditingService(null);
      resetServiceForm();
    } catch {
      toast.error('Failed to save service');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      await deleteAgencyService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success('Service deleted');
    } catch {
      toast.error('Failed to delete service');
    }
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '', description: '', category: 'verification' as AgencyServiceCategory,
      price: 0, currency: 'USD', price_unit: 'per_project' as AgencyServicePriceUnit,
      estimated_duration_days: null, is_active: true,
    });
  };

  const startEditService = (svc: AgencyService) => {
    setEditingService(svc);
    setServiceForm({
      name: svc.name, description: svc.description, category: svc.category,
      price: svc.price, currency: svc.currency, price_unit: svc.price_unit,
      estimated_duration_days: svc.estimated_duration_days, is_active: svc.is_active,
    });
    setShowServiceForm(true);
  };

  const addToArray = (arr: string[], setArr: (v: string[]) => void, val: string, setVal: (v: string) => void) => {
    const trimmed = val.trim();
    if (trimmed && !arr.includes(trimmed)) {
      setArr([...arr, trimmed]);
      setVal('');
    }
  };

  const removeFromArray = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.filter(v => v !== val));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="text-center py-24">
        <p className="text-sm text-muted-foreground">Agency not found.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.back()}>Back</Button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="text-center py-24">
        <p className="text-sm text-muted-foreground">You don't have permission to edit this agency profile.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push(`/dashboard/verification-agencies/${agencyId}`)}>View Profile</Button>
      </div>
    );
  }

  const TABS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'expertise', label: 'Expertise' },
    { id: 'coverage', label: 'Coverage' },
    { id: 'contact', label: 'Contact' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'services', label: `Services (${services.length})` },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/verification-agencies/${agencyId}`)} className="mb-1 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Profile
          </Button>
          <h1 className="text-xl font-bold">Edit Agency Profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{agency.name}</p>
        </div>
        <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          {/* Cover Image */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.cover_image && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                  <img src={form.cover_image} alt="Cover" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive" size="sm"
                    className="absolute top-2 right-2 h-7"
                    onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="cover-upload"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'cover_image'); }}
                />
                <Button variant="outline" size="sm" disabled={uploadingCover} onClick={() => document.getElementById('cover-upload')?.click()}>
                  {uploadingCover ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Camera className="h-3 w-3 mr-1" />}
                  {form.cover_image ? 'Change Cover' : 'Upload Cover Image'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logo + Organization Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted border">
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'logo_url'); }}
                  />
                  <Button variant="outline" size="sm" className="mt-2 w-full" disabled={uploadingLogo} onClick={() => document.getElementById('logo-upload')?.click()}>
                    {uploadingLogo ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Camera className="h-3 w-3 mr-1" />}
                    Logo
                  </Button>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Agency Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Registration Number</Label>
                    <Input value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} placeholder="e.g. REG-2024-001" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Founded Year</Label>
                    <Input type="number" value={form.founded_year} onChange={e => setForm(f => ({ ...f, founded_year: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Mission</Label>
                <Textarea rows={2} value={form.mission} onChange={e => setForm(f => ({ ...f, mission: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Vision</Label>
                <Textarea rows={2} value={form.vision} onChange={e => setForm(f => ({ ...f, vision: e.target.value }))} placeholder="Your organization's vision statement..." />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Availability & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Availability</Label>
                <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v as AgencyAvailability }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Accept New Applications</p>
                  <p className="text-xs text-muted-foreground">Allow project owners to send verification requests</p>
                </div>
                <Switch checked={form.accepts_new_applications} onCheckedChange={v => setForm(f => ({ ...f, accepts_new_applications: v }))} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expertise */}
      {activeTab === 'expertise' && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Expertise Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {expertise.map(exp => (
                  <Badge key={exp} variant="secondary" className="text-xs gap-1 pr-1">
                    {exp}
                    <button onClick={() => removeFromArray(expertise, setExpertise, exp)} className="ml-1 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newExpertise}
                  onChange={e => setNewExpertise(e.target.value)}
                  placeholder="Add expertise..."
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray(expertise, setExpertise, newExpertise, setNewExpertise); }}}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => addToArray(expertise, setExpertise, newExpertise, setNewExpertise)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {EXPERTISE_OPTIONS.filter(e => !expertise.includes(e)).slice(0, 12).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setExpertise([...expertise, opt])}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + {opt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" /> Supported Ecosystems
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {supportedEcosystems.map(eco => (
                  <Badge key={eco} variant="outline" className="text-xs gap-1 pr-1">
                    {eco}
                    <button onClick={() => removeFromArray(supportedEcosystems, setSupportedEcosystems, eco)} className="ml-1 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newEcosystem}
                  onChange={e => setNewEcosystem(e.target.value)}
                  placeholder="Add ecosystem..."
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray(supportedEcosystems, setSupportedEcosystems, newEcosystem, setNewEcosystem); }}}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => addToArray(supportedEcosystems, setSupportedEcosystems, newEcosystem, setNewEcosystem)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {ECOSYSTEM_OPTIONS.filter(e => !supportedEcosystems.includes(e)).slice(0, 12).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSupportedEcosystems([...supportedEcosystems, opt])}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + {opt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coverage */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" /> Countries Served
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {countriesServed.map(c => (
                  <Badge key={c} variant="secondary" className="text-xs gap-1 pr-1">
                    {c}
                    <button onClick={() => removeFromArray(countriesServed, setCountriesServed, c)} className="ml-1 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCountry}
                  onChange={e => setNewCountry(e.target.value)}
                  placeholder="Add country..."
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray(countriesServed, setCountriesServed, newCountry, setNewCountry); }}}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => addToArray(countriesServed, setCountriesServed, newCountry, setNewCountry)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> States / Regions Covered
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {statesCovered.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs gap-1 pr-1">
                    {s}
                    <button onClick={() => removeFromArray(statesCovered, setStatesCovered, s)} className="ml-1 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newState}
                  onChange={e => setNewState(e.target.value)}
                  placeholder="Add state/region..."
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray(statesCovered, setStatesCovered, newState, setNewState); }}}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => addToArray(statesCovered, setStatesCovered, newState, setNewState)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Districts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {districts.map(d => (
                  <Badge key={d} variant="secondary" className="text-xs gap-1 pr-1">
                    {d}
                    <button onClick={() => removeFromArray(districts, setDistricts, d)} className="ml-1 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {districts.length === 0 && <p className="text-xs text-muted-foreground">No districts added yet.</p>}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newDistrict}
                  onChange={e => setNewDistrict(e.target.value)}
                  placeholder="Add district..."
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray(districts, setDistricts, newDistrict, setNewDistrict); }}}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => addToArray(districts, setDistricts, newDistrict, setNewDistrict)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Headquarters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input value={form.headquarters} onChange={e => setForm(f => ({ ...f, headquarters: e.target.value }))} placeholder="City, State, Country" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Website</Label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@agency.org" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 890" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4" /> Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SOCIAL_LINK_FIELDS.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    value={socialLinks[field.key] || ''}
                    onChange={e => setSocialLinks(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certifications */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" /> Certifications & Registrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {certifications.length > 0 ? (
                <div className="space-y-2">
                  {certifications.map((cert, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{cert.name}</span>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-xs text-red-600 hover:text-red-700"
                        onClick={() => setCertifications(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No certifications added yet.</p>
              )}

              <Separator />

              <div>
                <Label className="text-xs mb-2 block">Add Certification</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCertName}
                    onChange={e => setNewCertName(e.target.value)}
                    placeholder="Certification name..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = newCertName.trim();
                        if (trimmed && !certifications.some(c => c.name === trimmed)) {
                          setCertifications(prev => [...prev, { name: trimmed }]);
                          setNewCertName('');
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="sm" variant="outline"
                    onClick={() => {
                      const trimmed = newCertName.trim();
                      if (trimmed && !certifications.some(c => c.name === trimmed)) {
                        setCertifications(prev => [...prev, { name: trimmed }]);
                        setNewCertName('');
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {CERTIFICATION_PRESETS.filter(c => !certifications.some(ac => ac.name === c)).map(preset => (
                  <button
                    key={preset}
                    onClick={() => setCertifications(prev => [...prev, { name: preset }])}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Capacity */}
      {activeTab === 'capacity' && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Capacity & Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Projects Certified</Label>
                  <Input type="number" value={form.projects_certified} onChange={e => setForm(f => ({ ...f, projects_certified: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Active Applications</Label>
                  <Input type="number" value={form.active_applications} onChange={e => setForm(f => ({ ...f, active_applications: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Avg Verification Days</Label>
                  <Input type="number" value={form.avg_verification_days} onChange={e => setForm(f => ({ ...f, avg_verification_days: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Years of Operation</Label>
                  <Input type="number" value={form.years_of_operation} onChange={e => setForm(f => ({ ...f, years_of_operation: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Available Audit Teams</Label>
                  <Input type="number" value={form.available_audit_teams} onChange={e => setForm(f => ({ ...f, available_audit_teams: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Estimated Review Days</Label>
                  <Input type="number" value={form.estimated_review_days} onChange={e => setForm(f => ({ ...f, estimated_review_days: Number(e.target.value) }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{services.length} service(s) in catalog</p>
            <Button size="sm" onClick={() => { resetServiceForm(); setEditingService(null); setShowServiceForm(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Add Service
            </Button>
          </div>

          {showServiceForm && (
            <Card className="shadow-sm border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">{editingService ? 'Edit Service' : 'New Service'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Service Name</Label>
                    <Input value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Land Verification" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Category</Label>
                    <Select value={serviceForm.category} onValueChange={v => setServiceForm(f => ({ ...f, category: v as AgencyServiceCategory }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea rows={2} value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Price</Label>
                    <Input type="number" value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Currency</Label>
                    <Select value={serviceForm.currency} onValueChange={v => setServiceForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Price Unit</Label>
                    <Select value={serviceForm.price_unit} onValueChange={v => setServiceForm(f => ({ ...f, price_unit: v as AgencyServicePriceUnit }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_project">Per Project</SelectItem>
                        <SelectItem value="per_hectare">Per Hectare</SelectItem>
                        <SelectItem value="per_day">Per Day</SelectItem>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="per_audit">Per Audit</SelectItem>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Estimated Duration (days)</Label>
                  <Input type="number" value={serviceForm.estimated_duration_days ?? ''} onChange={e => setServiceForm(f => ({ ...f, estimated_duration_days: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 14" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={serviceForm.is_active} onCheckedChange={v => setServiceForm(f => ({ ...f, is_active: v }))} />
                    <Label className="text-xs">Active</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setShowServiceForm(false); setEditingService(null); }}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveService} disabled={!serviceForm.name}>{editingService ? 'Update' : 'Create'}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {services.map(svc => (
            <Card key={svc.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{svc.name}</p>
                      <Badge variant="outline" className="text-[10px]">{svc.category}</Badge>
                      {!svc.is_active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>}
                    </div>
                    {svc.description && <p className="text-xs text-muted-foreground">{svc.description}</p>}
                    <p className="text-xs font-semibold text-primary">${svc.price.toLocaleString()} <span className="font-normal text-muted-foreground">{svc.currency} / {svc.price_unit.replace('_', ' ')}</span></p>
                    {svc.estimated_duration_days && <p className="text-[10px] text-muted-foreground">Est. {svc.estimated_duration_days} days</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditService(svc)} className="h-7 text-xs">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteService(svc.id)} className="h-7 text-xs text-red-600 hover:text-red-700">Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {services.length === 0 && !showServiceForm && (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No services in your catalog yet.</p>
              <p className="text-xs mt-1">Add services to let project owners know what you offer.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
