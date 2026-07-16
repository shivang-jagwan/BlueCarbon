'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Award, Download, FileText, Stamp, Lock } from 'lucide-react';
import { getApplications } from '@/lib/voc-services';
import { type VerificationCertificate, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/lib/voc-types';

export default function VerificationCertificatesPage() {
  const certificates = React.useMemo(() => {
    return getApplications()
      .filter(a => a.status === 'approved' && a.verification_certificate)
      .map(a => a.verification_certificate!);
  }, []);
  const [previewCert, setPreviewCert] = React.useState<VerificationCertificate | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Certificates</h1>
          <p className="text-sm text-muted-foreground">Generated certificates for approved verifications.</p>
        </div>
      </div>

      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewCert(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
                  <Award className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold">Verification Certificate</h2>
                <p className="text-sm text-muted-foreground mt-1">CarbonRush AI — Blue Carbon MRV Platform</p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Certificate ID</p><p className="font-mono font-semibold">{previewCert.id.toUpperCase()}</p></div>
                  <div><p className="text-xs text-muted-foreground">Certificate Number</p><p className="font-mono font-semibold">{previewCert.certificate_number}</p></div>
                  <div><p className="text-xs text-muted-foreground">Decision</p><Badge className="bg-emerald-100 text-emerald-700">Approved</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Project</p><p className="font-medium">{previewCert.project_name}</p></div>
                  <div><p className="text-xs text-muted-foreground">Project Owner</p><p className="font-medium">{previewCert.project_owner}</p></div>
                  <div><p className="text-xs text-muted-foreground">NGO</p><p className="font-medium">{previewCert.ngo}</p></div>
                  <div><p className="text-xs text-muted-foreground">Verifier</p><p className="font-medium">{previewCert.verifier}</p></div>
                  <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(previewCert.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Verified Documents</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {previewCert.verified_documents.map((d, i) => <li key={i} className="text-xs">{d}</li>)}
                  </ul>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reviewer Notes</p>
                  <p className="text-xs bg-muted/50 p-3 rounded-lg">{previewCert.reviewer_notes || 'No notes provided.'}</p>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Digital Signature: <span className="font-mono">{previewCert.digital_signature}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stamp className="h-3.5 w-3.5" />
                    <span>Blockchain: <span className="font-mono">{previewCert.blockchain_hash}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <Button onClick={() => setPreviewCert(null)} variant="outline">Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {certificates.map((cert) => (
          <Card key={cert.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{cert.project_name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{cert.certificate_number}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div><span className="text-muted-foreground">Owner:</span> {cert.project_owner}</div>
                <div><span className="text-muted-foreground">Verifier:</span> {cert.verifier}</div>
                <div><span className="text-muted-foreground">NGO:</span> {cert.ngo}</div>
                <div><span className="text-muted-foreground">Date:</span> {new Date(cert.issued_date).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewCert(cert)}>
                  <FileText className="h-3.5 w-3.5 mr-1" /> View Certificate
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {certificates.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Award className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No certificates generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
