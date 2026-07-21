'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  MapPin, TreePine, Camera, FileText, CheckCircle2, Loader2,
  Send, AlertTriangle, Leaf, Eye, ClipboardCheck, TreeDeciduous,
  Bug, Shield, FileWarning, AlertOctagon, Target, Activity, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitAuditReport, completeAgencyAudit } from '@/lib/voc-services';
import { GeospatialEvidenceSection } from './GeospatialEvidenceSection';
import type { AuditMediaItem } from '@/lib/voc-types';

interface FieldAuditFormProps {
  requestId: string;
  agencyRequestId: string;
  agencyId: string;
  projectId: string;
  projectName: string;
  auditorName: string;
  auditDate: string;
  onComplete: () => void;
}

interface AuditFormData {
  // Land Verification
  areaVerified: string;
  siteCondition: string;
  gpsCoordinates: string;
  gpsValidated: string;
  landOwnershipVerified: string;
  boundaryMatch: string;
  // Tree Assessment
  treeCount: string;
  speciesCount: string;
  dominantSpecies: string;
  avgTreeHeight: string;
  treeHealthCondition: string;
  // Carbon Assessment
  estimatedCarbonStock: string;
  biomassEstimate: string;
  soilCarbonSample: string;
  carbonMethodology: string;
  // Biodiversity
  biodiversityIndex: string;
  wildlifeObserved: string;
  invasiveSpeciesFound: string;
  ecosystemCondition: string;
  // Site Inspection
  accessRoadCondition: string;
  waterSourceNearby: string;
  nearbyLandUse: string;
  communityImpact: string;
  // Audit Evidence
  photosTaken: string;
  videosRecorded: string;
  samplesCollected: string;
  // Observations
  observations: string;
  // Recommendations
  recommendations: string;
  // Risks
  risks: string;
  // Corrective Actions
  correctiveActions: string;
}

interface FormErrors {
  [key: string]: string;
}

const SITE_CONDITIONS = ['excellent', 'good', 'fair', 'poor'] as const;
const YES_NO = ['yes', 'no'] as const;
const HEALTH_CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'dying'] as const;
const ECOSYSTEM_CONDITIONS = ['thriving', 'stable', 'stressed', 'degraded'] as const;

function validateForm(data: AuditFormData): FormErrors {
  const errors: FormErrors = {};
  const area = parseFloat(data.areaVerified);
  const trees = parseInt(data.treeCount, 10);
  const species = parseInt(data.speciesCount, 10);

  if (!data.areaVerified || isNaN(area) || area <= 0) errors.areaVerified = 'Area must be greater than 0 sqm';
  if (data.treeCount === '' || isNaN(trees) || trees < 0) errors.treeCount = 'Tree count must be 0 or greater';
  if (data.speciesCount === '' || isNaN(species) || species < 0) errors.speciesCount = 'Species count must be 0 or greater';
  if (!data.siteCondition) errors.siteCondition = 'Site condition is required';
  if (data.gpsValidated === 'yes' && !data.gpsCoordinates.trim()) errors.gpsCoordinates = 'GPS coordinates required when GPS is validated';
  if (!data.observations || data.observations.trim().length < 20) errors.observations = 'Observations must be at least 20 characters';
  if (!data.recommendations || data.recommendations.trim().length < 10) errors.recommendations = 'Recommendations must be at least 10 characters';
  return errors;
}

function Section({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function FieldAuditForm({
  requestId, agencyRequestId, agencyId, projectId, projectName,
  auditorName, auditDate, onComplete,
}: FieldAuditFormProps) {
  const [formData, setFormData] = React.useState<AuditFormData>({
    areaVerified: '', siteCondition: '', gpsCoordinates: '', gpsValidated: '',
    landOwnershipVerified: '', boundaryMatch: '',
    treeCount: '', speciesCount: '', dominantSpecies: '', avgTreeHeight: '', treeHealthCondition: '',
    estimatedCarbonStock: '', biomassEstimate: '', soilCarbonSample: '', carbonMethodology: '',
    biodiversityIndex: '', wildlifeObserved: '', invasiveSpeciesFound: '', ecosystemCondition: '',
    accessRoadCondition: '', waterSourceNearby: '', nearbyLandUse: '', communityImpact: '',
    photosTaken: '', videosRecorded: '', samplesCollected: '',
    observations: '', recommendations: '', risks: '', correctiveActions: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});

  function updateField(key: keyof AuditFormData, value: string) {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
  }

  async function handleSubmit() {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setSubmitting(true);
    try {
      await submitAuditReport({
        requestId, agencyRequestId, projectId, projectName, auditorName, auditDate,
        areaVerified: parseFloat(formData.areaVerified) || 0,
        treeCount: parseInt(formData.treeCount, 10) || 0,
        speciesCount: parseInt(formData.speciesCount, 10) || 0,
        siteCondition: formData.siteCondition,
        gpsValidated: formData.gpsValidated === 'yes',
        gpsCoordinates: formData.gpsCoordinates,
        photosCount: parseInt(formData.photosTaken, 10) || 0,
        videosCount: parseInt(formData.videosRecorded, 10) || 0,
        remarks: formData.observations,
        finalObservation: formData.recommendations,
        landOwnershipVerified: formData.landOwnershipVerified === 'yes',
        boundaryVerified: formData.boundaryMatch === 'yes',
        dominantSpecies: formData.dominantSpecies,
        avgTreeHeight: parseFloat(formData.avgTreeHeight) || 0,
        treeHealthCondition: formData.treeHealthCondition,
        estimatedCarbonStock: parseFloat(formData.estimatedCarbonStock) || 0,
        biomassEstimate: parseFloat(formData.biomassEstimate) || 0,
        soilCarbonSample: parseFloat(formData.soilCarbonSample) || 0,
        carbonMethodology: formData.carbonMethodology,
        biodiversityIndex: parseFloat(formData.biodiversityIndex) || 0,
        wildlifeObserved: formData.wildlifeObserved,
        invasiveSpeciesFound: formData.invasiveSpeciesFound === 'yes',
        ecosystemCondition: formData.ecosystemCondition,
        accessRoadCondition: formData.accessRoadCondition,
        waterSourceNearby: formData.waterSourceNearby,
        nearbyLandUse: formData.nearbyLandUse,
        communityImpact: formData.communityImpact,
        samplesCollected: parseInt(formData.samplesCollected, 10) || 0,
        risks: formData.risks,
        correctiveActions: formData.correctiveActions,
      });

      await completeAgencyAudit(requestId, agencyId);
      toast.success('Audit report submitted successfully');
      onComplete();
    } catch (err) {
      toast.error('Failed to submit audit report. Please try again.');
      console.error('[FieldAuditForm]', err);
    } finally {
      setSubmitting(false);
    }
  }

  const errorFor = (key: string) => errors[key] ? (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" /> {errors[key]}
    </p>
  ) : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-display font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Field Audit Form
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projectName} &middot; {auditorName} &middot; {auditDate}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">Digital Inspection</Badge>
      </div>

      {/* 1. Land Verification */}
      <Section icon={MapPin} title="Land Verification" color="text-primary">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Area Verified (sqm)</Label>
            <Input type="number" placeholder="e.g. 5000" value={formData.areaVerified} onChange={e => updateField('areaVerified', e.target.value)} className={cn(errors.areaVerified && 'border-destructive')} />
            {errorFor('areaVerified')}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">GPS Coordinates</Label>
            <Input placeholder="e.g. 28.6139 N, 77.2090 E" value={formData.gpsCoordinates} onChange={e => updateField('gpsCoordinates', e.target.value)} className={cn(errors.gpsCoordinates && 'border-destructive')} />
            {errorFor('gpsCoordinates')}
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-sm">Site Condition</Label>
          <RadioGroup value={formData.siteCondition} onValueChange={v => updateField('siteCondition', v)} className="flex flex-wrap gap-4">
            {SITE_CONDITIONS.map(c => (
              <div key={c} className="flex items-center gap-2">
                <RadioGroupItem value={c} id={`cond-${c}`} />
                <Label htmlFor={`cond-${c}`} className="text-sm font-normal cursor-pointer capitalize">{c}</Label>
              </div>
            ))}
          </RadioGroup>
          {errorFor('siteCondition')}
        </div>
        <div className="space-y-3">
          <Label className="text-sm">GPS Validated</Label>
          <RadioGroup value={formData.gpsValidated} onValueChange={v => updateField('gpsValidated', v)} className="flex gap-4">
            {YES_NO.map(v => (
              <div key={v} className="flex items-center gap-2">
                <RadioGroupItem value={v} id={`gps-${v}`} />
                <Label htmlFor={`gps-${v}`} className="text-sm font-normal cursor-pointer capitalize">{v}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-3">
          <Label className="text-sm">Land Ownership Verified</Label>
          <RadioGroup value={formData.landOwnershipVerified} onValueChange={v => updateField('landOwnershipVerified', v)} className="flex gap-4">
            {YES_NO.map(v => (
              <div key={v} className="flex items-center gap-2">
                <RadioGroupItem value={v} id={`land-${v}`} />
                <Label htmlFor={`land-${v}`} className="text-sm font-normal cursor-pointer capitalize">{v}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-3">
          <Label className="text-sm">Boundary Matches Claimed Area</Label>
          <RadioGroup value={formData.boundaryMatch} onValueChange={v => updateField('boundaryMatch', v)} className="flex gap-4">
            {YES_NO.map(v => (
              <div key={v} className="flex items-center gap-2">
                <RadioGroupItem value={v} id={`boundary-${v}`} />
                <Label htmlFor={`boundary-${v}`} className="text-sm font-normal cursor-pointer capitalize">{v}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </Section>

      {/* 2. Tree Assessment */}
      <Section icon={TreePine} title="Tree Assessment" color="text-emerald-600">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Tree Count</Label>
            <Input type="number" placeholder="0" min={0} value={formData.treeCount} onChange={e => updateField('treeCount', e.target.value)} className={cn(errors.treeCount && 'border-destructive')} />
            {errorFor('treeCount')}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Species Count</Label>
            <Input type="number" placeholder="0" min={0} value={formData.speciesCount} onChange={e => updateField('speciesCount', e.target.value)} className={cn(errors.speciesCount && 'border-destructive')} />
            {errorFor('speciesCount')}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Dominant Species</Label>
            <Input placeholder="e.g. Rhizophora mucronata" value={formData.dominantSpecies} onChange={e => updateField('dominantSpecies', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Average Tree Height (m)</Label>
            <Input type="number" placeholder="e.g. 4.5" value={formData.avgTreeHeight} onChange={e => updateField('avgTreeHeight', e.target.value)} />
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-sm">Tree Health Condition</Label>
          <RadioGroup value={formData.treeHealthCondition} onValueChange={v => updateField('treeHealthCondition', v)} className="flex flex-wrap gap-4">
            {HEALTH_CONDITIONS.map(c => (
              <div key={c} className="flex items-center gap-2">
                <RadioGroupItem value={c} id={`health-${c}`} />
                <Label htmlFor={`health-${c}`} className="text-sm font-normal cursor-pointer capitalize">{c}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </Section>

      {/* 3. Carbon Assessment */}
      <Section icon={Leaf} title="Carbon Assessment" color="text-green-600">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Estimated Carbon Stock (tCO2e)</Label>
            <Input type="number" step="0.01" placeholder="e.g. 120.5" value={formData.estimatedCarbonStock} onChange={e => updateField('estimatedCarbonStock', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Biomass Estimate (tonnes)</Label>
            <Input type="number" step="0.01" placeholder="e.g. 85.2" value={formData.biomassEstimate} onChange={e => updateField('biomassEstimate', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Soil Organic Carbon Sample</Label>
            <Input placeholder="e.g. 2.3%" value={formData.soilCarbonSample} onChange={e => updateField('soilCarbonSample', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Methodology Used</Label>
            <Input placeholder="e.g. IPCC Tier 2" value={formData.carbonMethodology} onChange={e => updateField('carbonMethodology', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* 4. Biodiversity */}
      <Section icon={Bug} title="Biodiversity Assessment" color="text-amber-600">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Biodiversity Index (0-10)</Label>
            <Input type="number" min={0} max={10} step="0.1" placeholder="e.g. 7.5" value={formData.biodiversityIndex} onChange={e => updateField('biodiversityIndex', e.target.value)} />
          </div>
          <div className="space-y-3">
            <Label className="text-sm">Ecosystem Condition</Label>
            <RadioGroup value={formData.ecosystemCondition} onValueChange={v => updateField('ecosystemCondition', v)} className="flex flex-wrap gap-4">
              {ECOSYSTEM_CONDITIONS.map(c => (
                <div key={c} className="flex items-center gap-2">
                  <RadioGroupItem value={c} id={`eco-${c}`} />
                  <Label htmlFor={`eco-${c}`} className="text-sm font-normal cursor-pointer capitalize">{c}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Wildlife Observed</Label>
          <Textarea rows={2} placeholder="List any wildlife species observed during the audit..." value={formData.wildlifeObserved} onChange={e => updateField('wildlifeObserved', e.target.value)} />
        </div>
        <div className="space-y-3">
          <Label className="text-sm">Invasive Species Found</Label>
          <RadioGroup value={formData.invasiveSpeciesFound} onValueChange={v => updateField('invasiveSpeciesFound', v)} className="flex gap-4">
            {YES_NO.map(v => (
              <div key={v} className="flex items-center gap-2">
                <RadioGroupItem value={v} id={`invasive-${v}`} />
                <Label htmlFor={`invasive-${v}`} className="text-sm font-normal cursor-pointer capitalize">{v}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </Section>

      {/* 5. Site Inspection */}
      <Section icon={Target} title="Site Inspection" color="text-blue-600">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Access Road Condition</Label>
            <Input placeholder="e.g. Motorable, unpaved" value={formData.accessRoadCondition} onChange={e => updateField('accessRoadCondition', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Water Source Nearby</Label>
            <Input placeholder="e.g. River, 2km away" value={formData.waterSourceNearby} onChange={e => updateField('waterSourceNearby', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Nearby Land Use</Label>
            <Input placeholder="e.g. Agricultural, residential" value={formData.nearbyLandUse} onChange={e => updateField('nearbyLandUse', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Community Impact Assessment</Label>
            <Input placeholder="e.g. Positive, employment generated" value={formData.communityImpact} onChange={e => updateField('communityImpact', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* 6. Geospatial Evidence Collection */}
      <Section icon={Globe} title="Geospatial Evidence Collection" color="text-teal-600">
        <p className="text-xs text-muted-foreground -mt-2 mb-2">
          Upload geo-tagged photos, drone imagery, satellite captures, and capture GPS locations during the field audit.
        </p>
        <GeospatialEvidenceSection
          projectId={projectId}
          auditId={agencyRequestId}
          verificationId={requestId}
          auditorName={auditorName}
          onMediaUploaded={(item) => {
            if (item.media_type === 'photo') updateField('photosTaken', String(parseInt(formData.photosTaken || '0', 10) + 1));
            if (item.media_type === 'drone_video') updateField('videosRecorded', String(parseInt(formData.videosRecorded || '0', 10) + 1));
          }}
        />
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Total Photos</Label>
            <Input type="number" min={0} placeholder="0" value={formData.photosTaken} onChange={e => updateField('photosTaken', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Total Videos</Label>
            <Input type="number" min={0} placeholder="0" value={formData.videosRecorded} onChange={e => updateField('videosRecorded', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Samples Collected</Label>
            <Input type="number" min={0} placeholder="0" value={formData.samplesCollected} onChange={e => updateField('samplesCollected', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* 7. Observations */}
      <Section icon={Eye} title="Observations" color="text-indigo-600">
        <div className="space-y-2">
          <Label className="text-sm">Audit Observations</Label>
          <Textarea rows={4} placeholder="Provide detailed observations from the field audit..." value={formData.observations} onChange={e => updateField('observations', e.target.value)} className={cn(errors.observations && 'border-destructive')} />
          {errorFor('observations')}
          <p className="text-[10px] text-muted-foreground">{formData.observations.length}/20 characters minimum</p>
        </div>
      </Section>

      {/* 8. Recommendations */}
      <Section icon={CheckCircle2} title="Recommendations" color="text-emerald-600">
        <div className="space-y-2">
          <Label className="text-sm">Audit Recommendations</Label>
          <Textarea rows={3} placeholder="Provide recommendations for project improvement or next steps..." value={formData.recommendations} onChange={e => updateField('recommendations', e.target.value)} className={cn(errors.recommendations && 'border-destructive')} />
          {errorFor('recommendations')}
          <p className="text-[10px] text-muted-foreground">{formData.recommendations.length}/10 characters minimum</p>
        </div>
      </Section>

      {/* 9. Risks */}
      <Section icon={AlertOctagon} title="Risks" color="text-red-600">
        <div className="space-y-2">
          <Label className="text-sm">Identified Risks</Label>
          <Textarea rows={3} placeholder="Document any risks identified during the audit (environmental, operational, compliance)..." value={formData.risks} onChange={e => updateField('risks', e.target.value)} />
        </div>
      </Section>

      {/* 10. Corrective Actions */}
      <Section icon={FileWarning} title="Corrective Actions" color="text-orange-600">
        <div className="space-y-2">
          <Label className="text-sm">Required Corrective Actions</Label>
          <Textarea rows={3} placeholder="List any corrective actions required before approval..." value={formData.correctiveActions} onChange={e => updateField('correctiveActions', e.target.value)} />
        </div>
      </Section>

      {/* Summary & Submit */}
      <Card className="shadow-sm border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Summary & Submit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold font-display text-foreground">
                {formData.areaVerified ? parseFloat(formData.areaVerified).toLocaleString() : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Area (sqm)</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold font-display text-emerald-600">
                {formData.treeCount || '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Trees</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold font-display text-blue-600">
                {formData.speciesCount || '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Species</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold font-display text-amber-600">
                {formData.siteCondition || '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Condition</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {Object.keys(errors).length > 0 && (
                <span className="text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {Object.keys(errors).length} validation error(s)
                </span>
              )}
            </p>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Audit Report</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
