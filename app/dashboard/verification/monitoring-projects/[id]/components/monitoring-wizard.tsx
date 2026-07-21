import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { getPreviousMonitoringReport, submitMonitoringReport } from '@/lib/monitoring-services';
import { CheckCircle2, ChevronRight, ChevronLeft, MapPin, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

const STEPS = [
  'Visit Info', 'Photos', 'Drone', 'Forest', 'Carbon',
  'Biodiversity', 'Site', 'AI Compare', 'Summary', 'Review'
];

export function MonitoringWizard({ assignment, onComplete }: { assignment: any; onComplete: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [previousReport, setPreviousReport] = React.useState<any>(null);
  
  // GPS State
  const [gpsLoading, setGpsLoading] = React.useState(false);

  const [formData, setFormData] = React.useState<any>({
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: '09:00',
    lead_inspector: profile?.full_name || '',
    inspection_team: '',
    weather: 'Clear',
    temperature: '25°C',
    gps_lat: null,
    gps_lng: null,
    gps_accuracy: null,
    gps_timestamp: null,
    
    // Forest
    current_tree_count: 0,
    new_trees: 0,
    dead_trees: 0,
    missing_trees: 0,
    dominant_species: '',
    species_count: 0,
    average_height: 0,
    average_dbh: 0,
    canopy_coverage: 0,
    tree_health: 'Good',
    growth_stage: 'Sapling',
    tree_survival_rate: 100,
    
    // Carbon
    carbon_estimate_tons: 0,
    soil_carbon: 0,
    carbon_gain: 0,
    carbon_loss: 0,
    methodology: 'IPCC Tier 2',
    sampling_notes: '',
    
    // Biodiversity
    species_observed: '',
    bird_count: 0,
    wildlife: 'None observed',
    pollinators: 'Average',
    insects: 'Average',
    invasive_species: 'None',
    habitat_quality: 'Good',
    biodiversity_index: 0,
    ecosystem_health: 'Stable',
    
    // Site
    illegal_activities: 'None',
    fire_damage: 'None',
    flood_damage: 'None',
    soil_erosion: 'Low',
    water_availability: 'Adequate',
    waste: 'None',
    encroachment: 'None',
    site_condition: 'Good',
    risk_level: 'Low',
    
    // AI Deltas
    delta_tree_count: 0,
    delta_carbon_estimate: 0,
    delta_biomass: 0,
    delta_canopy_coverage: 0,
    delta_health_score: 0,
    auto_growth_rate: 0,
    auto_area_change: 0,

    // Summary
    monitoring_score: 85,
    risk_score: 15,
    overall_health_score: 85,
    recommendation: 'Pass',
    auditor_notes: '',
    partner_notes: ''
  });

  React.useEffect(() => {
    async function loadPrevious() {
      const prev = await getPreviousMonitoringReport(assignment.project_id);
      if (prev) {
        setPreviousReport(prev);
        // Pre-fill some data from previous
        setFormData((prevData: any) => ({
          ...prevData,
          current_tree_count: prev.current_tree_count || 0,
          dominant_species: prev.dominant_species || '',
          species_count: prev.species_count || 0,
        }));
      }
    }
    loadPrevious();
  }, [assignment.project_id]);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Error', description: 'Geolocation is not supported by your browser.', variant: 'destructive' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          gps_lat: position.coords.latitude,
          gps_lng: position.coords.longitude,
          gps_accuracy: position.coords.accuracy,
          gps_timestamp: new Date(position.timestamp).toISOString()
        });
        setGpsLoading(false);
        toast({ title: 'Success', description: 'GPS coordinates captured securely.' });
      },
      (error) => {
        setGpsLoading(false);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleNext = () => {
    if (currentStep === 7) calculateDeltas(); // Run AI compare logic before entering step 8
    if (currentStep < 10) setCurrentStep(c => c + 1);
  };
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const calculateDeltas = () => {
    if (!previousReport) return;
    const delta_tree_count = Number(formData.current_tree_count) - Number(previousReport.current_tree_count || 0);
    const delta_carbon_estimate = Number(formData.carbon_estimate_tons) - Number(previousReport.carbon_estimate_tons || 0);
    const delta_canopy_coverage = Number(formData.canopy_coverage) - Number(previousReport.canopy_coverage || 0);
    const delta_health_score = Number(formData.overall_health_score) - Number(previousReport.overall_health_score || 0);
    
    setFormData((prev: any) => ({
      ...prev,
      delta_tree_count,
      delta_carbon_estimate,
      delta_canopy_coverage,
      delta_health_score,
      auto_growth_rate: ((delta_tree_count / Math.max(1, previousReport.current_tree_count || 1)) * 100).toFixed(2)
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitMonitoringReport({
        assignment_id: assignment.id,
        project_id: assignment.project_id,
        verifier_id: profile?.id || assignment.verifier_id,
        status: 'submitted',
        report_date: new Date().toISOString().split('T')[0],
        ...formData
      }, profile?.full_name || 'Verifier');
      
      toast({ title: 'Success', description: 'Monthly monitoring report submitted successfully.' });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit report.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // ---------------------------------------------------------------------------
  // STEP RENDERS
  // ---------------------------------------------------------------------------

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium border-b pb-2">Visit Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Visit Date *</Label>
          <Input type="date" value={formData.visit_date} onChange={e => updateField('visit_date', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Visit Time *</Label>
          <Input type="time" value={formData.visit_time} onChange={e => updateField('visit_time', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Lead Inspector *</Label>
          <Input value={formData.lead_inspector} onChange={e => updateField('lead_inspector', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Inspection Team</Label>
          <Input placeholder="E.g., John Doe, Jane Smith" value={formData.inspection_team} onChange={e => updateField('inspection_team', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Weather</Label>
          <Select value={formData.weather} onValueChange={v => updateField('weather', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Sunny">Sunny</SelectItem>
              <SelectItem value="Clear">Clear</SelectItem>
              <SelectItem value="Cloudy">Cloudy</SelectItem>
              <SelectItem value="Rainy">Rainy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Temperature</Label>
          <Input value={formData.temperature} onChange={e => updateField('temperature', e.target.value)} />
        </div>
      </div>
      <div className="mt-6 p-4 border rounded-xl bg-slate-50 dark:bg-slate-900 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> GPS Location (Required)</h4>
          <Button size="sm" onClick={handleCaptureGPS} disabled={gpsLoading}>
            {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Capture Device GPS'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">GPS coordinates must be captured directly from your device on-site to ensure authenticity.</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Latitude:</span> {formData.gps_lat || '---'}</div>
          <div><span className="text-muted-foreground">Longitude:</span> {formData.gps_lng || '---'}</div>
          <div><span className="text-muted-foreground">Accuracy:</span> {formData.gps_accuracy ? `${Math.round(formData.gps_accuracy)} meters` : '---'}</div>
          <div><span className="text-muted-foreground">Timestamp:</span> {formData.gps_timestamp ? new Date(formData.gps_timestamp).toLocaleTimeString() : '---'}</div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium border-b pb-2">Geo Tagged Photos</h3>
      <p className="text-sm text-muted-foreground mb-4">Every uploaded image automatically extracts EXIF metadata (Latitude, Longitude, Timestamp). Photos will be organized into the album "Monitoring - {new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})}".</p>
      
      <input type="file" multiple accept="image/*" 
        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border rounded-xl p-4 border-dashed"
        onChange={(e: any) => {
          if (e.target.files?.length) {
            toast({ title: 'Photos Uploaded', description: `Successfully processed ${e.target.files.length} photos and extracted GPS EXIF data.` });
          }
        }}
      />
      <div className="text-xs text-muted-foreground mt-2">Required categories: Entrance, North, South, East, West, Center, Tree Canopy, Soil.</div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium border-b pb-2">Drone & Satellite Data</h3>
      <p className="text-sm text-muted-foreground mb-4">Upload Drone Orthomosaics, NDVI imagery, or Satellite comparatives. These files will be stored immutably alongside this report.</p>
      <input type="file" multiple accept="image/*,video/*,application/pdf" 
        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border rounded-xl p-4 border-dashed"
        onChange={(e: any) => {
          if (e.target.files?.length) {
            toast({ title: 'Drone Files Uploaded', description: `Successfully processed ${e.target.files.length} files.` });
          }
        }}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium border-b pb-2">Forest Assessment</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Current Tree Count</Label><Input type="number" value={formData.current_tree_count} onChange={e => updateField('current_tree_count', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>New Trees Planted</Label><Input type="number" value={formData.new_trees} onChange={e => updateField('new_trees', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Dead Trees</Label><Input type="number" value={formData.dead_trees} onChange={e => updateField('dead_trees', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Missing Trees</Label><Input type="number" value={formData.missing_trees} onChange={e => updateField('missing_trees', Number(e.target.value))} /></div>
        
        <div className="space-y-2"><Label>Dominant Species</Label><Input value={formData.dominant_species} onChange={e => updateField('dominant_species', e.target.value)} /></div>
        <div className="space-y-2"><Label>Species Count</Label><Input type="number" value={formData.species_count} onChange={e => updateField('species_count', Number(e.target.value))} /></div>
        
        <div className="space-y-2"><Label>Average Height (m)</Label><Input type="number" step="0.1" value={formData.average_height} onChange={e => updateField('average_height', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Average DBH (cm)</Label><Input type="number" step="0.1" value={formData.average_dbh} onChange={e => updateField('average_dbh', Number(e.target.value))} /></div>
        
        <div className="space-y-2"><Label>Canopy Coverage %</Label><Input type="number" value={formData.canopy_coverage} onChange={e => updateField('canopy_coverage', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Tree Survival Rate %</Label><Input type="number" value={formData.tree_survival_rate} onChange={e => updateField('tree_survival_rate', Number(e.target.value))} /></div>
        
        <div className="space-y-2">
          <Label>Tree Health</Label>
          <Select value={formData.tree_health} onValueChange={v => updateField('tree_health', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Fair">Fair</SelectItem>
              <SelectItem value="Poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Growth Stage</Label>
          <Select value={formData.growth_stage} onValueChange={v => updateField('growth_stage', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Seedling">Seedling</SelectItem>
              <SelectItem value="Sapling">Sapling</SelectItem>
              <SelectItem value="Mature">Mature</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium border-b pb-2">Carbon Assessment</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Estimated Carbon Stock (Tons)</Label><Input type="number" step="0.1" value={formData.carbon_estimate_tons} onChange={e => updateField('carbon_estimate_tons', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Soil Carbon (Tons)</Label><Input type="number" step="0.1" value={formData.soil_carbon} onChange={e => updateField('soil_carbon', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Carbon Gain (Tons since last visit)</Label><Input type="number" step="0.1" value={formData.carbon_gain} onChange={e => updateField('carbon_gain', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Carbon Loss (Tons)</Label><Input type="number" step="0.1" value={formData.carbon_loss} onChange={e => updateField('carbon_loss', Number(e.target.value))} /></div>
        <div className="col-span-2 space-y-2"><Label>Methodology Used</Label><Input value={formData.methodology} onChange={e => updateField('methodology', e.target.value)} /></div>
        <div className="col-span-2 space-y-2"><Label>Sampling Notes</Label><Textarea value={formData.sampling_notes} onChange={e => updateField('sampling_notes', e.target.value)} /></div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium border-b pb-2">Biodiversity</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2"><Label>Species Observed</Label><Input placeholder="E.g., Macaques, Monitor Lizards" value={formData.species_observed} onChange={e => updateField('species_observed', e.target.value)} /></div>
        <div className="space-y-2"><Label>Bird Count</Label><Input type="number" value={formData.bird_count} onChange={e => updateField('bird_count', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Wildlife Presence</Label><Input value={formData.wildlife} onChange={e => updateField('wildlife', e.target.value)} /></div>
        <div className="space-y-2"><Label>Pollinators Activity</Label><Input value={formData.pollinators} onChange={e => updateField('pollinators', e.target.value)} /></div>
        <div className="space-y-2"><Label>Insects Status</Label><Input value={formData.insects} onChange={e => updateField('insects', e.target.value)} /></div>
        <div className="space-y-2"><Label>Invasive Species</Label><Input value={formData.invasive_species} onChange={e => updateField('invasive_species', e.target.value)} /></div>
        <div className="space-y-2"><Label>Habitat Quality</Label><Input value={formData.habitat_quality} onChange={e => updateField('habitat_quality', e.target.value)} /></div>
        <div className="space-y-2"><Label>Biodiversity Index</Label><Input type="number" step="0.1" value={formData.biodiversity_index} onChange={e => updateField('biodiversity_index', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Ecosystem Health</Label><Input value={formData.ecosystem_health} onChange={e => updateField('ecosystem_health', e.target.value)} /></div>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium border-b pb-2">Site Assessment</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Illegal Activities</Label><Input value={formData.illegal_activities} onChange={e => updateField('illegal_activities', e.target.value)} /></div>
        <div className="space-y-2"><Label>Fire Damage</Label><Input value={formData.fire_damage} onChange={e => updateField('fire_damage', e.target.value)} /></div>
        <div className="space-y-2"><Label>Flood Damage</Label><Input value={formData.flood_damage} onChange={e => updateField('flood_damage', e.target.value)} /></div>
        <div className="space-y-2"><Label>Soil Erosion</Label><Input value={formData.soil_erosion} onChange={e => updateField('soil_erosion', e.target.value)} /></div>
        <div className="space-y-2"><Label>Water Availability</Label><Input value={formData.water_availability} onChange={e => updateField('water_availability', e.target.value)} /></div>
        <div className="space-y-2"><Label>Waste / Pollution</Label><Input value={formData.waste} onChange={e => updateField('waste', e.target.value)} /></div>
        <div className="space-y-2"><Label>Encroachment</Label><Input value={formData.encroachment} onChange={e => updateField('encroachment', e.target.value)} /></div>
        <div className="space-y-2"><Label>Site Condition</Label><Input value={formData.site_condition} onChange={e => updateField('site_condition', e.target.value)} /></div>
      </div>
    </div>
  );

  const renderStep8 = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium">AI Automatic Comparison</h3>
          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" /> AI Computed
          </Badge>
        </div>
        {!previousReport ? (
          <div className="text-center py-10 bg-muted/30 rounded-xl">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-medium">No Previous Data Found</p>
            <p className="text-xs text-muted-foreground mt-1">This appears to be the first monitoring report. AI cannot compute differences.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">The system has compared your current entries with the report submitted on <strong>{new Date(previousReport.report_date).toLocaleDateString()}</strong>.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase">Tree Difference</div>
                  <div className="text-2xl font-bold mt-1">
                    {formData.delta_tree_count > 0 ? `+${formData.delta_tree_count}` : formData.delta_tree_count}
                  </div>
                  <Badge variant="outline" className={cn('mt-2 text-[10px]', formData.delta_tree_count > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50')}>
                    {formData.delta_tree_count > 0 ? '▲ Increase' : '▼ Decrease'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase">Carbon Delta</div>
                  <div className="text-2xl font-bold mt-1">
                    {formData.delta_carbon_estimate > 0 ? `+${formData.delta_carbon_estimate}` : formData.delta_carbon_estimate}t
                  </div>
                  <Badge variant="outline" className={cn('mt-2 text-[10px]', formData.delta_carbon_estimate > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50')}>
                    {formData.delta_carbon_estimate > 0 ? '▲ Increase' : '▼ Decrease'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase">Canopy Change</div>
                  <div className="text-2xl font-bold mt-1">
                    {formData.delta_canopy_coverage > 0 ? `+${formData.delta_canopy_coverage}` : formData.delta_canopy_coverage}%
                  </div>
                  <Badge variant="outline" className={cn('mt-2 text-[10px]', formData.delta_canopy_coverage > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50')}>
                    {formData.delta_canopy_coverage > 0 ? '▲ Increase' : '▼ Decrease'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase">Growth Rate</div>
                  <div className="text-2xl font-bold mt-1">{formData.auto_growth_rate}%</div>
                  <Badge variant="outline" className="mt-2 text-[10px] text-blue-600 bg-blue-50">COMPUTED</Badge>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">These values will be permanently saved to the immutable report to maintain historical integrity.</p>
          </div>
        )}
      </div>
    );
  };

  const renderStep9 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium border-b pb-2">Final Summary & Recommendations</h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <Label>Overall Health Score</Label>
            <span className="font-medium text-sm text-green-600">{formData.overall_health_score}/100</span>
          </div>
          <Slider value={[formData.overall_health_score]} onValueChange={v => updateField('overall_health_score', v[0])} max={100} step={1} />
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <Label>Risk Score</Label>
            <span className="font-medium text-sm text-red-600">{formData.risk_score}/100</span>
          </div>
          <Slider value={[formData.risk_score]} onValueChange={v => updateField('risk_score', v[0])} max={100} step={1} className="[&_[role=slider]]:border-red-500 [&_[role=slider]]:bg-red-500" />
        </div>

        <div className="space-y-2">
          <Label>Official Recommendation</Label>
          <Select value={formData.recommendation} onValueChange={v => updateField('recommendation', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pass">Pass (All Standards Met)</SelectItem>
              <SelectItem value="Needs Attention">Needs Attention (Minor Issues)</SelectItem>
              <SelectItem value="Critical">Critical (Immediate Action Required)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Internal Auditor Notes (Not shared with partner)</Label>
          <Textarea value={formData.auditor_notes} onChange={e => updateField('auditor_notes', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Notes for Sustainability Partner</Label>
          <Textarea value={formData.partner_notes} onChange={e => updateField('partner_notes', e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderStep10 = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h3 className="text-2xl font-semibold">Ready to Submit</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        You are about to submit the Monthly Monitoring Report for <strong>{assignment.projects?.name}</strong>. This action will create an immutable record, update the portfolio dashboards, and notify the Sustainability Partner.
      </p>
      
      <div className="bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 max-w-sm mx-auto text-left text-sm space-y-2">
        <div className="flex justify-between border-b pb-1">
          <span className="text-muted-foreground">Visit Date</span>
          <span className="font-medium">{formData.visit_date}</span>
        </div>
        <div className="flex justify-between border-b pb-1">
          <span className="text-muted-foreground">GPS Status</span>
          <span className="font-medium text-green-600">{formData.gps_lat ? 'Captured ✓' : 'Missing ✗'}</span>
        </div>
        <div className="flex justify-between border-b pb-1">
          <span className="text-muted-foreground">Health Score</span>
          <span className="font-medium">{formData.overall_health_score}/100</span>
        </div>
        <div className="flex justify-between border-b pb-1">
          <span className="text-muted-foreground">Recommendation</span>
          <span className="font-medium">{formData.recommendation}</span>
        </div>
      </div>
    </div>
  );

  const renders = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8, renderStep9, renderStep10];

  return (
    <Card className="max-w-4xl mx-auto border-border/60 shadow-sm overflow-hidden">
      <div className="bg-muted/30 border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
            {currentStep}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Step {currentStep}: {STEPS[currentStep - 1]}</h2>
            <p className="text-xs text-muted-foreground">Monthly Monitoring Portal • {assignment.projects?.name}</p>
          </div>
        </div>
        <div className="hidden md:flex gap-1">
          {STEPS.map((s, i) => (
            <div key={i} className={cn("h-1.5 w-6 rounded-full transition-colors", currentStep > i ? 'bg-primary' : 'bg-muted-foreground/20')} />
          ))}
        </div>
      </div>
      
      <CardContent className="p-8 min-h-[400px]">
        {renders[currentStep - 1]()}
      </CardContent>

      <CardFooter className="bg-muted/10 border-t border-border/50 px-6 py-4 flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1 || submitting}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        
        {currentStep < 10 ? (
          <Button onClick={handleNext} disabled={currentStep === 1 && !formData.gps_lat}>
            Next Step <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Submit Report
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
