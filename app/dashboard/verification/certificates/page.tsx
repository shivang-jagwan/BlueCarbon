'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Award, Download, FileText, Stamp, Lock, Loader2 } from 'lucide-react';
import { getOfficialRecords } from '@/lib/voc-services';
import { type OfficialRecord } from '@/lib/voc-types';

export default function VerificationCertificatesPage() {
  const [records, setRecords] = React.useState<OfficialRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const allRecords = await getOfficialRecords();
      if (!cancelled) {
        setRecords(allRecords.filter(r => r.record_type === 'verification_certificate' || r.record_type === 'carbon_passport'));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const certificates = records.filter(r => r.record_type === 'verification_certificate');
  const passports = records.filter(r => r.record_type === 'carbon_passport');

  const [previewRecord, setPreviewRecord] = React.useState<OfficialRecord | null>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Certificates</h1>
            <p className="text-sm text-muted-foreground">Loading certificates...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Certificates</h1>
          <p className="text-sm text-muted-foreground">Generated certificates and carbon passports for approved verifications.</p>
        </div>
      </div>

      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewRecord(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
                  <Award className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold">{previewRecord.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">CarbonRush AI — Blue Carbon MRV Platform</p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Record ID</p>
                    <p className="font-mono font-semibold">{previewRecord.id.toUpperCase().slice(0, 12)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{previewRecord.record_type === 'verification_certificate' ? 'Verification Certificate' : 'Carbon Passport'}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verifier / Agency</p>
                    <p className="font-medium">{previewRecord.verifier_name || previewRecord.ngo_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(previewRecord.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-xs bg-muted/50 p-3 rounded-lg">{previewRecord.description || 'No description provided.'}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">File</p>
                  <p className="font-mono text-xs">{previewRecord.file_name}</p>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Status: <span className="font-medium text-emerald-600">{previewRecord.status}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stamp className="h-3.5 w-3.5" />
                    <span className="font-mono">{previewRecord.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <Button onClick={() => setPreviewRecord(null)} variant="outline">Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {certificates.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600" /> Verification Certificates ({certificates.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((cert) => (
              <Card key={cert.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                      <Award className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{cert.title}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">{cert.file_name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cert.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{cert.verifier_name || cert.ngo_name}</span>
                    <span>{new Date(cert.created_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewRecord(cert)}>
                      <FileText className="h-3.5 w-3.5 mr-1" /> View Certificate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {passports.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-600" /> Carbon Passports ({passports.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {passports.map((passport) => (
              <Card key={passport.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{passport.title}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">{passport.file_name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{passport.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{passport.verifier_name || passport.ngo_name}</span>
                    <span>{new Date(passport.created_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewRecord(passport)}>
                      <FileText className="h-3.5 w-3.5 mr-1" /> View Passport
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {certificates.length === 0 && passports.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Award className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No certificates or carbon passports generated yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Certificates are generated when projects are approved.</p>
        </div>
      )}
    </div>
  );
}
