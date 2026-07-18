'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Plus, Loader2, Trash2, GripVertical,
  Briefcase, DollarSign, Clock, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getVerificationAgency, getAgencyServices,
  createAgencyService, updateAgencyService, deleteAgencyService, toggleAgencyServiceActive,
} from '@/lib/voc-services';
import type { VerificationAgency, AgencyService, AgencyServiceCategory, AgencyServicePriceUnit } from '@/lib/voc-types';
import { AGENCY_SERVICE_CATEGORY_LABELS, AGENCY_SERVICE_PRICE_UNIT_LABELS } from '@/lib/voc-types';
import { toast } from 'sonner';

const CATEGORY_OPTIONS: { value: AgencyServiceCategory; label: string }[] =
  Object.entries(AGENCY_SERVICE_CATEGORY_LABELS).map(([value, label]) => ({ value: value as AgencyServiceCategory, label }));

const PRICE_UNIT_OPTIONS: { value: AgencyServicePriceUnit; label: string }[] =
  Object.entries(AGENCY_SERVICE_PRICE_UNIT_LABELS).map(([value, label]) => ({ value: value as AgencyServicePriceUnit, label }));

const INITIAL_FORM = {
  name: '', description: '', category: 'verification' as AgencyServiceCategory,
  price: 0, currency: 'USD', price_unit: 'per_project' as AgencyServicePriceUnit,
  estimated_duration_days: null as number | null, is_active: true,
};

export default function AgencyServicesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const agencyId = params.id as string;

  const [agency, setAgency] = React.useState<VerificationAgency | null>(null);
  const [services, setServices] = React.useState<AgencyService[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(INITIAL_FORM);
  const [saving, setSaving] = React.useState(false);
  const [filterCategory, setFilterCategory] = React.useState<string>('all');

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
      setAgency(a || null);
      setServices(svc);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [agencyId]);

  const filteredServices = React.useMemo(() => {
    if (filterCategory === 'all') return services;
    return services.filter(s => s.category === filterCategory);
  }, [services, filterCategory]);

  const resetForm = () => { setForm(INITIAL_FORM); setEditingId(null); setShowForm(false); };

  const startEdit = (svc: AgencyService) => {
    setEditingId(svc.id);
    setForm({
      name: svc.name, description: svc.description, category: svc.category,
      price: svc.price, currency: svc.currency, price_unit: svc.price_unit,
      estimated_duration_days: svc.estimated_duration_days, is_active: svc.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!isOwner || !form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateAgencyService(editingId, form);
        if (updated) setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
        toast.success('Service updated');
      } else {
        const created = await createAgencyService({
          agency_id: agencyId,
          ...form,
          display_order: services.length,
        });
        setServices(prev => [...prev, created]);
        toast.success('Service added');
      }
      resetForm();
    } catch {
      toast.error('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      await deleteAgencyService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Service deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleAgencyServiceActive(id, !current);
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    } catch {
      toast.error('Failed to toggle');
    }
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

  const totalRevenue = services.filter(s => s.is_active).reduce((sum, s) => sum + s.price, 0);
  const activeCount = services.filter(s => s.is_active).length;

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/verification-agencies/${agencyId}`)} className="mb-1 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Profile
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Service Catalog</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{agency.name}</p>
          </div>
          {isOwner && (
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Add Service
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{services.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Services</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-emerald-600">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground">Active Services</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{services.length > 0 ? `$${Math.round(totalRevenue / (activeCount || 1)).toLocaleString()}` : '$0'}</p>
            <p className="text-[10px] text-muted-foreground">Avg. Price</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* New/Edit Form */}
      {showForm && isOwner && (
        <Card className="shadow-sm border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{editingId ? 'Edit Service' : 'Add New Service'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Service Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mangrove Verification Audit" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as AgencyServiceCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what this service includes..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Price</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['USD', 'EUR', 'GBP', 'INR', 'BRL', 'AUD', 'SGD'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Price Unit</Label>
                <Select value={form.price_unit} onValueChange={v => setForm(f => ({ ...f, price_unit: v as AgencyServicePriceUnit }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICE_UNIT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Estimated Duration (days)</Label>
              <Input type="number" value={form.estimated_duration_days ?? ''} onChange={e => setForm(f => ({ ...f, estimated_duration_days: e.target.value ? Number(e.target.value) : null }))} placeholder="Optional" className="max-w-[200px]" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-xs">Active (visible to project owners)</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {editingId ? 'Update Service' : 'Add Service'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service List */}
      <div className="space-y-3">
        {filteredServices.map(svc => (
          <Card key={svc.id} className={`shadow-sm transition-opacity ${!svc.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{svc.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {AGENCY_SERVICE_CATEGORY_LABELS[svc.category]}
                    </Badge>
                    {!svc.is_active && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{svc.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <DollarSign className="h-3 w-3" />
                      {svc.price.toLocaleString()} {svc.currency}
                    </span>
                    <span>/ {AGENCY_SERVICE_PRICE_UNIT_LABELS[svc.price_unit]}</span>
                    {svc.estimated_duration_days && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> ~{svc.estimated_duration_days} days
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => handleToggle(svc.id, svc.is_active)}
                      title={svc.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {svc.is_active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEdit(svc)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" onClick={() => handleDelete(svc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredServices.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No services found.</p>
            <p className="text-xs mt-1">
              {filterCategory !== 'all' ? 'Try a different category filter.' : 'Add services to your catalog to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
