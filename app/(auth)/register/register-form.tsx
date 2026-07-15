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
  Sprout,
  ShieldCheck,
  Building2,
  Check,
  User,
  MapPin,
  Landmark,
  Briefcase,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import type { AppRole } from '@/lib/types';
import { uploadFile } from '@/services/storage';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  mobile_number: z.string().min(10, 'Enter a valid mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  aadhaar_number: z.string().min(12, 'Aadhaar must be 12 digits'),
  pan_number: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  village: z.string().min(1, 'Village is required'),
  pin_code: z.string().min(6, 'PIN code must be 6 digits'),
  bank_name: z.string().min(1, 'Bank name is required'),
  account_number: z.string().min(9, 'Enter a valid account number'),
  ifsc_code: z.string().min(11, 'IFSC must be 11 characters'),
  upi_id: z.string().optional(),
  occupation: z.string().min(1, 'Occupation is required'),
  organization: z.string().optional(),
  experience: z.string().min(1, 'Experience is required'),
  primary_activity: z.string().min(1, 'Primary activity is required'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { id: 0, label: 'Personal', icon: User },
  { id: 1, label: 'Identity (KYC)', icon: ShieldCheck },
  { id: 2, label: 'Address', icon: MapPin },
  { id: 3, label: 'Bank Details', icon: Landmark },
  { id: 4, label: 'Professional', icon: Briefcase },
  { id: 5, label: 'Review', icon: FileCheck },
];

const ROLE_META: Record<string, { label: string; icon: React.ElementType }> = {
  project_owner: { label: 'Project Owner', icon: Sprout },
  verifier: { label: 'Verifier (NGO)', icon: ShieldCheck },
  sustainability_partner: { label: 'Sustainability Partner', icon: Building2 },
};

const ACTIVITIES = [
  'Mangrove Restoration',
  'Seagrass Restoration',
  'Salt Marsh Restoration',
  'Kelp Forest Restoration',
  'Wetland Conservation',
  'Afforestation',
  'Coastal Protection',
  'Other',
];

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get('role') as AppRole) || 'project_owner';
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [aadhaarFile, setAadhaarFile] = React.useState<File | null>(null);
  const [passportFile, setPassportFile] = React.useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
      mobile_number: '',
      password: '',
      confirm_password: '',
      aadhaar_number: '',
      pan_number: '',
      country: 'India',
      state: '',
      district: '',
      village: '',
      pin_code: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      upi_id: '',
      occupation: '',
      organization: '',
      experience: '',
      primary_activity: '',
    },
  });

  const meta = ROLE_META[role] ?? ROLE_META.project_owner;
  const RoleIcon = meta.icon;

  const stepFields: Record<number, (keyof FormValues)[]> = {
    0: ['full_name', 'email', 'mobile_number', 'password', 'confirm_password'],
    1: ['aadhaar_number', 'pan_number'],
    2: ['country', 'state', 'district', 'village', 'pin_code'],
    3: ['bank_name', 'account_number', 'ifsc_code', 'upi_id'],
    4: ['occupation', 'organization', 'experience', 'primary_activity'],
    5: [],
  };

  const validateStep = async (s: number): Promise<boolean> => {
    const fields = stepFields[s];
    if (fields.length === 0) return true;
    return await form.trigger(fields as any);
  };

  const handleNext = async () => {
    const valid = await validateStep(step);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: values.email,
          full_name: values.full_name,
          role: role,
          mobile_number: values.mobile_number,
          aadhaar_number: values.aadhaar_number,
          pan_number: values.pan_number || null,
          country: values.country,
          state: values.state,
          district: values.district,
          village: values.village,
          pin_code: values.pin_code,
          bank_name: values.bank_name,
          account_number: values.account_number,
          ifsc_code: values.ifsc_code,
          upi_id: values.upi_id || null,
          occupation: values.occupation,
          organization: values.organization || null,
          experience: values.experience,
          primary_activity: values.primary_activity,
          kyc_status: 'submitted',
          profile_completed: true,
        });

        if (profileError) {
          // Profile save may fail if trigger already created it — non-critical
        }

        await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        // Upload KYC documents if provided
        try {
          if (aadhaarFile) {
            await uploadFile(aadhaarFile, 'profile-documents', 'aadhaar');
          }
          if (passportFile) {
            await uploadFile(passportFile, 'profile-documents', 'passport_photo');
          }
        } catch (uploadErr) {
          // KYC upload failure is non-blocking — account is created
          // But warn the user so they can re-upload from their profile
          console.error('KYC upload error:', uploadErr);
          toast.warning('Account created, but document upload failed. You can re-upload from your profile page.');
        }
      }

      toast.success('Account created! Welcome to CarbonRush AI.');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('already registered')) {
        toast.error('This email is already registered. Try signing in.');
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
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-ocean text-white shadow-soft">
            <RoleIcon className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Registering as{' '}
            <span className="font-medium text-foreground">{meta.label}</span>
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
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <SIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'mx-1 h-0.5 flex-1 rounded-full transition-colors',
                        i < step ? 'bg-primary' : 'bg-border'
                      )}
                    />
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
              // Prevent Enter key from triggering form submission anywhere in the form.
              // The user must explicitly click the Submit button on the review step.
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          >
            {/* Step 0: Personal */}
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.org" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Min. 8 characters" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Repeat password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 1: KYC */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Identity verification (KYC) is required for all project owners
                    to ensure platform integrity and enable support payments.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="aadhaar_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input placeholder="XXXX XXXX XXXX" maxLength={14} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pan_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ABCDE1234F" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <div>
                    <Label>Aadhaar Upload</Label>
                    <input
                      type="file"
                      id="aadhaar-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAadhaarFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div 
                      onClick={() => document.getElementById('aadhaar-upload')?.click()}
                      className={cn(
                        "mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/40",
                        aadhaarFile && "border-primary bg-primary/5"
                      )}
                    >
                      <div>
                        <ShieldCheck className={cn("mx-auto h-8 w-8", aadhaarFile ? "text-primary" : "text-muted-foreground")} />
                        <p className="mt-2 text-sm font-medium">
                          {aadhaarFile ? aadhaarFile.name : 'Click to upload'}
                        </p>
                        {!aadhaarFile && <p className="text-[10px] text-muted-foreground/70">PDF, JPG, PNG up to 5MB</p>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Passport Photo</Label>
                    <input
                      type="file"
                      id="passport-upload"
                      className="hidden"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPassportFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div 
                      onClick={() => document.getElementById('passport-upload')?.click()}
                      className={cn(
                        "mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/40",
                        passportFile && "border-primary bg-primary/5"
                      )}
                    >
                      <div>
                        <User className={cn("mx-auto h-8 w-8", passportFile ? "text-primary" : "text-muted-foreground")} />
                        <p className="mt-2 text-sm font-medium">
                          {passportFile ? passportFile.name : 'Click to upload'}
                        </p>
                        {!passportFile && <p className="text-[10px] text-muted-foreground/70">JPG, PNG up to 2MB</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
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
                          <SelectItem value="Other">Other</SelectItem>
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
                        <FormControl>
                          <Input placeholder="e.g. Maharashtra" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ratnagiri" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="village"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Village</FormLabel>
                        <FormControl>
                          <Input placeholder="Village name" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="6-digit PIN" maxLength={6} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Bank */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Bank details are used for receiving support payments from
                    sustainability partners and carbon credit sales.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. State Bank of India" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ifsc_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SBIN0001234" maxLength={11} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="upi_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPI ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="yourname@bank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Professional */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Environmental Scientist" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Organization name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0-2 years">0-2 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="6-10 years">6-10 years</SelectItem>
                          <SelectItem value="10+ years">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primary_activity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Restoration Activity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACTIVITIES.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Please review your information before submitting. You can
                    edit any section by navigating back.
                  </p>
                </div>
                <div className="space-y-4">
                  <ReviewSection title="Personal Information" onEdit={() => setStep(0)}>
                    <ReviewItem label="Name" value={watchAll.full_name} />
                    <ReviewItem label="Email" value={watchAll.email} />
                    <ReviewItem label="Mobile" value={watchAll.mobile_number} />
                  </ReviewSection>
                  <ReviewSection title="Identity (KYC)" onEdit={() => setStep(1)}>
                    <ReviewItem label="Aadhaar" value={watchAll.aadhaar_number} />
                    <ReviewItem label="PAN" value={watchAll.pan_number || 'Not provided'} />
                  </ReviewSection>
                  <ReviewSection title="Address" onEdit={() => setStep(2)}>
                    <ReviewItem label="Country" value={watchAll.country} />
                    <ReviewItem label="State" value={watchAll.state} />
                    <ReviewItem label="District" value={watchAll.district} />
                    <ReviewItem label="Village" value={watchAll.village} />
                    <ReviewItem label="PIN" value={watchAll.pin_code} />
                  </ReviewSection>
                  <ReviewSection title="Bank Details" onEdit={() => setStep(3)}>
                    <ReviewItem label="Bank" value={watchAll.bank_name} />
                    <ReviewItem label="Account" value={watchAll.account_number} />
                    <ReviewItem label="IFSC" value={watchAll.ifsc_code} />
                    <ReviewItem label="UPI" value={watchAll.upi_id || 'Not provided'} />
                  </ReviewSection>
                  <ReviewSection title="Professional" onEdit={() => setStep(4)}>
                    <ReviewItem label="Occupation" value={watchAll.occupation} />
                    <ReviewItem label="Organization" value={watchAll.organization || 'Not provided'} />
                    <ReviewItem label="Experience" value={watchAll.experience} />
                    <ReviewItem label="Activity" value={watchAll.primary_activity} />
                  </ReviewSection>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0}
              >
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
                      Submit & Create Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
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
