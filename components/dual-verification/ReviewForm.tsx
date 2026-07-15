'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Send } from 'lucide-react';

export interface ReviewFormData {
  vegetation_score: number | null;
  carbon_estimate: number | null;
  boundary_area_hectares: number | null;
  evidence_quality_score: number | null;
  monitoring_notes: string;
  recommendation: 'approved' | 'rejected' | 'changes_requested' | 'pending';
  findings: Record<string, unknown> | null;
  overall_confidence: number | null;
  reviewer_remarks: string;
}

interface ReviewFormProps {
  reviewId: string;
  onSubmit: (data: ReviewFormData) => void;
  loading?: boolean;
}

export function ReviewForm({ reviewId, onSubmit, loading = false }: ReviewFormProps) {
  const [vegetationScore, setVegetationScore] = React.useState('');
  const [carbonEstimate, setCarbonEstimate] = React.useState('');
  const [boundaryArea, setBoundaryArea] = React.useState('');
  const [evidenceQuality, setEvidenceQuality] = React.useState('');
  const [confidence, setConfidence] = React.useState('');
  const [monitoringNotes, setMonitoringNotes] = React.useState('');
  const [remarks, setRemarks] = React.useState('');
  const [recommendation, setRecommendation] = React.useState<string>('pending');

  const handleSubmit = () => {
    onSubmit({
      vegetation_score: vegetationScore ? Number(vegetationScore) / 100 : null,
      carbon_estimate: carbonEstimate ? Number(carbonEstimate) : null,
      boundary_area_hectares: boundaryArea ? Number(boundaryArea) : null,
      evidence_quality_score: evidenceQuality ? Number(evidenceQuality) : null,
      overall_confidence: confidence ? Number(confidence) : null,
      monitoring_notes: monitoringNotes,
      recommendation: recommendation as ReviewFormData['recommendation'],
      findings: null,
      reviewer_remarks: remarks,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Submit Verification Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Vegetation Score (0-100%)</Label>
            <Input
              type="number" min={0} max={100}
              placeholder="e.g. 75"
              value={vegetationScore}
              onChange={(e) => setVegetationScore(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Carbon Estimate (tonnes)</Label>
            <Input
              type="number" min={0} step={0.1}
              placeholder="e.g. 150.5"
              value={carbonEstimate}
              onChange={(e) => setCarbonEstimate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Boundary Area (hectares)</Label>
            <Input
              type="number" min={0} step={0.1}
              placeholder="e.g. 45.2"
              value={boundaryArea}
              onChange={(e) => setBoundaryArea(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Evidence Quality (0-100%)</Label>
            <Input
              type="number" min={0} max={100}
              placeholder="e.g. 80"
              value={evidenceQuality}
              onChange={(e) => setEvidenceQuality(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Overall Confidence (0-100%)</Label>
            <Input
              type="number" min={0} max={100}
              placeholder="e.g. 85"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Recommendation</Label>
            <Select value={recommendation} onValueChange={setRecommendation}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approve</SelectItem>
                <SelectItem value="changes_requested">Request Changes</SelectItem>
                <SelectItem value="rejected">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Monitoring Notes</Label>
          <Textarea
            placeholder="Detailed observations from the verification review..."
            value={monitoringNotes}
            onChange={(e) => setMonitoringNotes(e.target.value)}
            className="mt-1 min-h-20"
          />
        </div>
        <div>
          <Label className="text-xs">Reviewer Remarks</Label>
          <Textarea
            placeholder="Additional remarks or justification..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="mt-1 min-h-16"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading || recommendation === 'pending'}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </CardContent>
    </Card>
  );
}
