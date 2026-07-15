'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { IdentityStatusCard } from '@/components/identity/IdentityStatusCard';
import { IdentityDocumentCard } from '@/components/identity/IdentityDocumentCard';
import { FileUpload } from '@/components/shared/FileUpload';
import {
  Shield, Upload, Clock, CheckCircle, AlertTriangle, FileText, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { IdentityVerification, IdentityDocument, IdentityDocumentType } from '@/lib/types';
import { IDENTITY_DOC_TYPE_LABELS } from '@/lib/types';

export default function IdentityVerificationPage() {
  const { user, profile } = useAuth();
  const [verification, setVerification] = React.useState<IdentityVerification | null>(null);
  const [documents, setDocuments] = React.useState<IdentityDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [selectedDocType, setSelectedDocType] = React.useState<string>('');
  const [docNumber, setDocNumber] = React.useState('');
  const [issuingAuthority, setIssuingAuthority] = React.useState('');
  const [issuingCountry, setIssuingCountry] = React.useState('');

  const fetchVerification = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/identity?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setVerification(data.verification);
      }
    } catch {
      console.error('Failed to fetch identity verification');
    }
    try {
      const res = await fetch(`/api/identity/documents?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      console.error('Failed to fetch identity documents');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const handleInitializeVerification = async () => {
    if (!user || !profile) return;
    try {
      const res = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: profile.role }),
      });
      if (res.ok) {
        toast.success('Identity verification initialized');
        await fetchVerification();
      }
    } catch {
      toast.error('Failed to initialize verification');
    }
  };

  const handleUploadSuccess = async () => {
    setUploadOpen(false);
    setSelectedDocType('');
    setDocNumber('');
    setIssuingAuthority('');
    setIssuingCountry('');
    await fetchVerification();
    toast.success('Document uploaded successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Identity Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify your identity to unlock platform features
          </p>
        </div>
        {verification && (
          <Badge className={verification.status === 'fully_verified' ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'}>
            {verification.status.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Why verify your identity?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Identity verification is required to register projects, submit for verification,
              and receive carbon passports. Your documents are encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>

      {!verification ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Start Identity Verification</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Upload government-issued identity documents and verify your email and phone
              to complete the verification process.
            </p>
          </div>
          <Button onClick={handleInitializeVerification} size="lg">
            Begin Verification
          </Button>
        </Card>
      ) : (
        <>
          <IdentityStatusCard verification={verification} />

          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Documents</h2>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Identity Document</DialogTitle>
                  <DialogDescription>
                    Upload a government-issued identity document for verification.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Document Type</Label>
                    <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="government_id">Government ID</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                        <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                        <SelectItem value="pan_card">PAN Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Document Number</Label>
                    <Input
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="e.g. ABC123456"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Issuing Authority</Label>
                    <Input
                      value={issuingAuthority}
                      onChange={(e) => setIssuingAuthority(e.target.value)}
                      placeholder="e.g. Government of India"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Issuing Country</Label>
                    <Input
                      value={issuingCountry}
                      onChange={(e) => setIssuingCountry(e.target.value)}
                      placeholder="e.g. India"
                      className="mt-1"
                    />
                  </div>
                  {selectedDocType && (
                    <div>
                      <Label>Document File</Label>
                      <FileUpload
                        bucket="identity-documents"
                        projectId={user?.id || ''}
                        category="personal_identity"
                        allowedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                        maxSizeMB={10}
                        onUploadSuccess={handleUploadSuccess}
                      />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {documents.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No documents uploaded yet. Upload your identity documents to proceed.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <IdentityDocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}

          {verification.suspicious_activity_detected && (
            <Card className="border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Suspicious Activity Detected</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Our system has detected potential fraudulent activity on your account.
                    Please contact support for assistance.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
