'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Building2,
  Check,
  User,
  MapPin,
  FileCheck,
  Leaf,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { INDUSTRIES, SUSTAINABILITY_FOCUS_AREAS } from '@/lib/types';
import { uploadFile } from '@/services/storage';

const schema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  industry: z.string().min(1, 'Select an industry'),
  cin: z.string().min(1, 'CIN is required'),
  gst: z.string().min(1, 'GST is required'),
  website: z.string().optional(),
  email: z.string().min(1, 'Email is required'),
  contact_number: z.string().min(10, 'Enter a valid contact number'),
  rep_full_name: z.string().min(2, 'Representative name is required'),
  designation: z.string().min(1, 'Designation is required'),
  rep_email: z.string().min(1, 'Email is required'),
  rep_mobile: z.string().min(10, 'Enter a valid mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  esg_goals: z.string().min(10, 'Describe your ESG goals'),
  csr_objectives: z.string().min(10, 'Describe your CSR objectives'),
  net_zero_target_year: z.string().optional(),
  annual_csr_budget: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  office_address: z.string().min(5, 'Office address is required'),
  pin_code: z.string().min(6, 'PIN code must be 6 digits'),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { id: 0, label: 'Organization', icon: Building2 },
  { id: 1, label: 'Representative', icon: User },
  { id: 2, label: 'Sustainability', icon: Leaf },
  { id: 3, label: 'Address', icon: MapPin },
  { id: 4, label: 'Documents', icon: FileCheck },
  { id: 5, label: 'Review', icon: Check },
];

export default function PartnerRegisterForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [focusAreas, setFocusAreas] = React.useState<string[]>([]);
  const [verificationFiles, setVerificationFiles] = React.useState<{ file: File; label: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      company_name: '',
      industry: '',
      cin: '',
      gst: '',
      website: '',
      email: '',
      contact_number: '',
      rep_full_name: '',
      designation: '',
      rep_email: '',
      rep_mobile: '',
      password: '',
      esg_goals: '',
      csr_objectives: '',
      net_zero_target_year: '',
      annual_csr_budget: '',
      country: 'India',
      state: '',
      city: '',
      office_address: '',
      pin_code: '',
    },
  });

  const stepFields: Record<number, (keyof FormValues)[]> = {
    0: ['company_name', 'industry', 'cin', 'gst', 'website', 'email', 'contact_number', 'password'],
    1: ['rep_full_name', 'designation', 'rep_email', 'rep_mobile'],
    2: ['esg_goals', 'csr_objectives', 'net_zero_target_year', 'annual_csr_budget'],
    3: ['country', 'state', 'city', 'office_address', 'pin_code'],
    4: [],
    5: [],
  };

  const validateStep = async (s: number): Promise<boolean> => {
    const fields = stepFields[s];
    if (fields.length === 0) return true;
    return await form.trigger(fields as any);
  };

  const handleNext = async () => {
    if (step === 2 && focusAreas.length === 0) {
      toast.error('Select at least one sustainability focus area');
      return;
    }
    const valid = await validateStep(step);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const toggleFocus = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.rep_full_name,
            role: 'sustainability_partner',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: values.email,
          full_name: values.rep_full_name,
          role: 'sustainability_partner',
          organization: values.company_name,
          industry: values.industry,
          cin: values.cin,
          gst: values.gst,
          website: values.website || null,
          designation: values.designation,
          mobile_number: values.rep_mobile,
          phone: values.contact_number,
          esg_goals: values.esg_goals,
          csr_objectives: values.csr_objectives,
          net_zero_target_year: values.net_zero_target_year ? parseInt(values.net_zero_target_year) : null,
          sustainability_focus: focusAreas,
          annual_csr_budget: values.annual_csr_budget ? parseFloat(values.annual_csr_budget) : null,
          country: values.country,
          state: values.state,
          district: values.city,
          office_address: values.office_address,
          pin_code: values.pin_code,
          kyc_status: 'submitted',
          profile_completed: true,
        });
      }

      await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      // Upload verification documents if provided
      if (verificationFiles.length > 0) {
        toast.loading('Uploading verification documents...');
        for (const item of verificationFiles) {
          try {
            await uploadFile(item.file, 'profile-documents', item.label.toLowerCase().replace(/ /g, '_'));
          } catch (e) {
            // Upload failure is non-blocking — profile is already created
            console.error('Document upload error:', e);
          }
        }
        toast.dismiss();
      }

      toast.success('Account created! Welcome to CarbonRush AI.');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('already registered')) {
        toast.error('This email is already registered.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const watchAll = form.watch();

  return (
    <div className="w-full max-w-2xl">
      <Link
        href="/register"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to role selection
      </Link>

      <Card className="p-6 shadow-soft md:p-8">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-ocean text-white shadow-soft">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Register as Sustainability Partner</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Discover, fund, and monitor verified restoration projects
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
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
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          >
            {/* Step 0: Organization */}
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Green Corp Industries" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {INDUSTRIES.map((ind) => (
                              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl><Input placeholder="https://company.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CIN</FormLabel>
                        <FormControl><Input placeholder="Corporate Identity Number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST</FormLabel>
                        <FormControl><Input placeholder="GST Registration Number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Official Email</FormLabel>
                        <FormControl><Input type="email" placeholder="info@company.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Min. 8 characters" autoComplete="new-password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 1: Representative */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Provide details of the authorized representative who will manage this account.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="rep_full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="Authorized representative" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <FormControl><Input placeholder="e.g. CSR Head, ESG Director" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rep_mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="rep_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Representative Email</FormLabel>
                      <FormControl><Input type="email" placeholder="name@company.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Sustainability */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <FormField
                  control={form.control}
                  name="esg_goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ESG Goals</FormLabel>
                      <FormControl><Textarea placeholder="Describe your organization's ESG goals..." className="min-h-20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="csr_objectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSR Objectives</FormLabel>
                      <FormControl><Textarea placeholder="Describe your CSR objectives..." className="min-h-20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="net_zero_target_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Zero Target Year (Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g. 2050" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="annual_csr_budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual CSR Budget USD (Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g. 500000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Label>Sustainability Focus Areas</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {SUSTAINABILITY_FOCUS_AREAS.map((area) => {
                      const isSelected = focusAreas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleFocus(area)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium transition-colors',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          )}
                        >
                          <div className={cn(
                            'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                            isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl><Input placeholder="e.g. Maharashtra" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input placeholder="e.g. Mumbai" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="office_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Address</FormLabel>
                      <FormControl><Input placeholder="Full office address" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pin_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN Code</FormLabel>
                      <FormControl><Input placeholder="6-digit PIN" maxLength={6} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Upload verification documents for your organization.
                  </p>
                </div>
                {[
                  { label: 'Company Registration', hint: 'PDF up to 10MB', accept: '.pdf' },
                  { label: 'PAN Card', hint: 'PDF, JPG up to 5MB', accept: '.pdf,.jpg,.jpeg,.png' },
                  { label: 'GST Certificate', hint: 'PDF up to 5MB', accept: '.pdf' },
                  { label: 'CSR Registration (Optional)', hint: 'PDF up to 5MB', accept: '.pdf' },
                ].map((doc) => {
                  const existingFile = verificationFiles.find(f => f.label === doc.label);
                  return (
                  <div key={doc.label}>
                    <Label>{doc.label}</Label>
                    <input
                      type="file"
                      id={`upload-${doc.label}`}
                      className="hidden"
                      accept={doc.accept}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const newFiles = verificationFiles.filter(f => f.label !== doc.label);
                          newFiles.push({ file: e.target.files[0], label: doc.label });
                          setVerificationFiles(newFiles);
                        }
                      }}
                    />
                    <div 
                      onClick={() => document.getElementById(`upload-${doc.label}`)?.click()}
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
                        {!existingFile && <p className="text-[10px] text-muted-foreground/70">{doc.hint}</p>}
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Review your information before submitting.
                  </p>
                </div>
                <ReviewSection title="Organization" onEdit={() => setStep(0)}>
                  <ReviewItem label="Company" value={watchAll.company_name} />
                  <ReviewItem label="Industry" value={watchAll.industry} />
                  <ReviewItem label="CIN" value={watchAll.cin} />
                  <ReviewItem label="Email" value={watchAll.email} />
                </ReviewSection>
                <ReviewSection title="Representative" onEdit={() => setStep(1)}>
                  <ReviewItem label="Name" value={watchAll.rep_full_name} />
                  <ReviewItem label="Designation" value={watchAll.designation} />
                  <ReviewItem label="Email" value={watchAll.rep_email} />
                </ReviewSection>
                <ReviewSection title="Sustainability" onEdit={() => setStep(2)}>
                  <ReviewItem label="Net Zero Target" value={watchAll.net_zero_target_year || 'Not set'} />
                  <ReviewItem label="CSR Budget" value={watchAll.annual_csr_budget ? `$${watchAll.annual_csr_budget}` : 'Not specified'} />
                  <div className="col-span-2 flex flex-wrap gap-2">
                    {focusAreas.map((a) => (
                      <span key={a} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{a}</span>
                    ))}
                  </div>
                </ReviewSection>
                <ReviewSection title="Address" onEdit={() => setStep(3)}>
                  <ReviewItem label="Country" value={watchAll.country} />
                  <ReviewItem label="State" value={watchAll.state} />
                  <ReviewItem label="City" value={watchAll.city} />
                  <ReviewItem label="PIN" value={watchAll.pin_code} />
                </ReviewSection>
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
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
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}
