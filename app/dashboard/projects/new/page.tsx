'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  FileText,
  Map as MapIcon,
  Landmark,
  Upload,
  ClipboardCheck,
} from 'lucide-react';
import { createProject } from '@/services/projects';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { uploadFile } from '@/services/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { BoundaryEditor } from '@/components/maps/BoundaryEditor';
import { cn } from '@/lib/utils';
import type { GeoJSON, ProjectType, OwnershipType } from '@/lib/types';

const schema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  project_type: z.string().min(1, 'Select a project type'),
  expected_duration_months: z.string().min(1, 'Duration is required'),
  objectives: z.string().min(10, 'Objectives must be at least 10 characters'),
  location_name: z.string().min(1, 'Location name is required'),
  country: z.string().min(1, 'Country is required'),
  ownership_type: z.string().min(1, 'Ownership type is required'),
  survey_number: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { id: 0, label: 'Project Info', icon: FileText },
  { id: 1, label: 'Location', icon: MapIcon },
  { id: 2, label: 'Land Info', icon: Landmark },
  { id: 3, label: 'Baseline', icon: Upload },
  { id: 4, label: 'Review', icon: ClipboardCheck },
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [geojson, setGeojson] = React.useState<GeoJSON.FeatureCollection | null>(null);
  const [area, setArea] = React.useState(0);
  const [perimeter, setPerimeter] = React.useState(0);
  const [center, setCenter] = React.useState<{ lat: number; lng: number } | null>(null);
  const [bbox, setBbox] = React.useState<number[] | null>(null);
  
  // File states
  const [baselineFiles, setBaselineFiles] = React.useState<{ file: File; label: string }[]>([]);
  const [landRegistryFile, setLandRegistryFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      project_type: 'mangrove',
      expected_duration_months: '12',
      objectives: '',
      location_name: '',
      country: 'India',
      ownership_type: 'private',
      survey_number: '',
    },
  });

  const stepFields: Record<number, (keyof FormValues)[]> = {
    0: ['name', 'description', 'project_type', 'expected_duration_months', 'objectives'],
    1: ['location_name', 'country'],
    2: ['ownership_type', 'survey_number'],
    3: [],
    4: [],
  };

  const validateStep = async (s: number): Promise<boolean> => {
    const fields = stepFields[s];
    if (fields.length === 0) return true;
    return await form.trigger(fields as any);
  };

  const handleNext = async () => {
    if (step === 1 && !geojson) {
      toast.error('Please draw a project boundary on the map');
      return;
    }
    const valid = await validateStep(step);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleMapChange = React.useCallback(
    (gj: GeoJSON.FeatureCollection | null, a: number, p: number, c: { lat: number; lng: number } | null, b: number[] | null) => {
      setGeojson(gj);
      setArea(a);
      setPerimeter(p);
      setCenter(c);
      setBbox(b);
    },
    []
  );

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('You must be signed in');
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      const slug = slugify(values.name);
      
      const insertData = {
        name: values.name,
        slug,
        description: values.description,
        project_type: values.project_type as ProjectType,
        status: 'registered',
        country: values.country,
        location_name: values.location_name,
        boundary_geojson: geojson as any,
        area_hectares: area || null,
        perimeter_km: perimeter || null,
        center_lat: center?.lat || null,
        center_lng: center?.lng || null,
        bounding_box: bbox || null,
        objectives: values.objectives,
        expected_duration_months: parseInt(values.expected_duration_months) || null,
        ownership_type: values.ownership_type as OwnershipType,
        survey_number: values.survey_number || null,
        verification_status: 'not_submitted',
        health_score: 0,
      };

      const projectData = await createProject(insertData);
      
      // Handle file uploads after project is created
      const allFiles = [...baselineFiles];
      if (landRegistryFile) {
        allFiles.push({ file: landRegistryFile, label: 'land_registry' });
      }

      if (allFiles.length > 0) {
        toast.loading('Uploading project files...');
        for (let i = 0; i < allFiles.length; i++) {
          const item = allFiles[i];
          try {
            const bucket = item.label === 'land_registry' ? 'project-documents' : 'evidence';
            const category = item.label === 'land_registry' ? 'land_registry' : 'baseline';
            await uploadFile(item.file, bucket, category, projectData.id);
            setUploadProgress(Math.round(((i + 1) / allFiles.length) * 100));
          } catch (e) {
            // Upload failure is non-blocking — project is already created
            console.error('File upload error:', e);
            toast.error(`Failed to upload ${item.label}. You can re-upload from the project page.`);
          }
        }
        toast.dismiss();
      }

      toast.success('Project registered successfully!');
      router.push(`/dashboard/projects/${projectData.id}`);
    } catch (err) {
      toast.dismiss();
      const message = err instanceof Error ? err.message : 'Failed to create project';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const watchAll = form.watch();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Register New Project
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the steps below to register your restoration project
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const SIcon = s.icon;
          const isComplete = i < step;
          const isActive = i === step;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                    isComplete && 'border-primary bg-primary text-primary-foreground',
                    isActive && 'border-primary bg-primary/10 text-primary',
                    !isComplete && !isActive && 'border-border text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <SIcon className="h-4 w-4" />}
                </div>
                <span className={cn('text-[10px] font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('mx-1 h-0.5 flex-1 rounded-full transition-colors', i < step ? 'bg-primary' : 'bg-border')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <Card className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Step 0: Project Info */}
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sundarbans Mangrove Restoration" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your restoration project..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="project_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mangrove">Mangrove</SelectItem>
                            <SelectItem value="seagrass">Seagrass</SelectItem>
                            <SelectItem value="salt_marsh">Salt Marsh</SelectItem>
                            <SelectItem value="kelp_forest">Kelp Forest</SelectItem>
                            <SelectItem value="mixed">Mixed Ecosystem</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expected_duration_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Duration (months)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="objectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objectives</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What are the goals of this restoration project?"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="mb-1 font-semibold">Project Location</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Draw your project boundary on the map by clicking to place points.
                    Connect at least 3 points to form a polygon.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="location_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ratnagiri Coast, Maharashtra" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="India">India</SelectItem>
                            <SelectItem value="Indonesia">Indonesia</SelectItem>
                            <SelectItem value="Philippines">Philippines</SelectItem>
                            <SelectItem value="Kenya">Kenya</SelectItem>
                            <SelectItem value="Madagascar">Madagascar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <BoundaryEditor geojson={geojson} onChange={handleMapChange} />
              </div>
            )}

            {/* Step 2: Land Info */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="mb-1 font-semibold">Land Information</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Provide ownership details and land registry information.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="ownership_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ownership Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ownership type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="government">Government</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                          <SelectItem value="leased">Leased</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="survey_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Land survey number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Label>Land Registry Document</Label>
                  <input
                    type="file"
                    id="land-registry-upload"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setLandRegistryFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div 
                    onClick={() => document.getElementById('land-registry-upload')?.click()}
                    className={cn(
                      "mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/40",
                      landRegistryFile && "border-primary bg-primary/5"
                    )}
                  >
                    <div>
                      <Upload className={cn("mx-auto h-8 w-8", landRegistryFile ? "text-primary" : "text-muted-foreground")} />
                      <p className="mt-2 text-sm font-medium">
                        {landRegistryFile ? landRegistryFile.name : 'Click to upload'}
                      </p>
                      {!landRegistryFile && <p className="text-[10px] text-muted-foreground/70">PDF, JPG, PNG up to 10MB</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Baseline */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="mb-1 font-semibold">Baseline Information</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Upload initial evidence to establish baseline conditions.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Ground Images', hint: 'JPG, PNG up to 10MB', accept: 'image/*' },
                    { label: 'Drone Images', hint: 'JPG, PNG, TIFF up to 50MB', accept: 'image/*' },
                    { label: 'Videos', hint: 'MP4, MOV up to 100MB', accept: 'video/*' },
                    { label: 'Initial Survey', hint: 'PDF up to 20MB', accept: '.pdf' },
                    { label: 'Water Report', hint: 'PDF up to 10MB', accept: '.pdf' },
                    { label: 'Soil Report', hint: 'PDF up to 10MB', accept: '.pdf' },
                  ].map((item) => {
                    const existingFile = baselineFiles.find(f => f.label === item.label);
                    
                    return (
                    <div key={item.label}>
                      <Label>{item.label}</Label>
                      <input
                        type="file"
                        id={`upload-${item.label}`}
                        className="hidden"
                        accept={item.accept}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const newFiles = baselineFiles.filter(f => f.label !== item.label);
                            newFiles.push({ file: e.target.files[0], label: item.label });
                            setBaselineFiles(newFiles);
                          }
                        }}
                      />
                      <div 
                        onClick={() => document.getElementById(`upload-${item.label}`)?.click()}
                        className={cn(
                          "mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition-colors",
                          existingFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        )}
                      >
                        <div>
                          <Upload className={cn("mx-auto h-6 w-6", existingFile ? "text-primary" : "text-muted-foreground")} />
                          <p className="mt-1.5 text-xs font-medium">
                            {existingFile ? existingFile.file.name : 'Click to upload'}
                          </p>
                          {!existingFile && <p className="text-[10px] text-muted-foreground/70">{item.hint}</p>}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    You can skip this step and upload baseline evidence later from
                    the project workspace Evidence Center.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Review your project details before submitting.
                  </p>
                </div>
                <div className="space-y-4">
                  <ReviewSection title="Project Information" onEdit={() => setStep(0)}>
                    <ReviewItem label="Name" value={watchAll.name} />
                    <ReviewItem label="Type" value={watchAll.project_type} />
                    <ReviewItem label="Duration" value={`${watchAll.expected_duration_months} months`} />
                    <ReviewItem label="Objectives" value={watchAll.objectives} />
                  </ReviewSection>
                  <ReviewSection title="Location" onEdit={() => setStep(1)}>
                    <ReviewItem label="Location" value={watchAll.location_name} />
                    <ReviewItem label="Country" value={watchAll.country} />
                    <ReviewItem label="Area" value={area ? `${area.toFixed(2)} ha` : 'Not drawn'} />
                    <ReviewItem label="Perimeter" value={perimeter ? `${perimeter.toFixed(2)} km` : 'Not drawn'} />
                  </ReviewSection>
                  <ReviewSection title="Land Information" onEdit={() => setStep(2)}>
                    <ReviewItem label="Ownership" value={watchAll.ownership_type} />
                    <ReviewItem label="Survey No." value={watchAll.survey_number || 'Not provided'} />
                  </ReviewSection>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 0}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Continue
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadProgress > 0 ? `Uploading files ${uploadProgress}%` : 'Creating project...'}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Register Project
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value || '—'}</p>
    </div>
  );
}
