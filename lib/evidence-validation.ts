import * as turf from '@turf/turf';
import type {
  GpsCoordinates,
  ProjectBoundary,
  EvidenceValidationResult,
  EvidenceValidationStatus,
  VerificationEvidence,
} from '@/lib/types';

const DEFAULT_ALLOWED_RADIUS_METERS = 100;

// ============================================================
// FILE HASH (Web Crypto API)
// ============================================================
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// EXIF EXTRACTION
// ============================================================
export async function extractExifData(file: File): Promise<Record<string, unknown>> {
  try {
    const exifr = await import('exifr');
    const data = await exifr.parse(file, {
      gps: true,
      exif: true,
      xmp: false,
      icc: false,
      iptc: false,
      jfif: false,
      ihdr: false,
    });
    return data || {};
  } catch {
    return {};
  }
}

export function extractGpsFromExif(exifData: Record<string, unknown>): GpsCoordinates | null {
  const lat = exifData.GPSLatitude;
  const lng = exifData.GPSLongitude;
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return {
      latitude: lat,
      longitude: lng,
      accuracy: typeof exifData.GPSAccuracy === 'number' ? exifData.GPSAccuracy : undefined,
    };
  }
  return null;
}

export function extractDeviceFromExif(exifData: Record<string, unknown>): {
  deviceName?: string;
  deviceModel?: string;
  platform?: string;
} {
  return {
    deviceName: (exifData.Make as string) || undefined,
    deviceModel: (exifData.Model as string) || undefined,
    platform: (exifData.Software as string) || undefined,
  };
}

export function extractCaptureTimestamp(exifData: Record<string, unknown>): string | null {
  const dateStr = exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate;
  if (typeof dateStr === 'string') {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

// ============================================================
// BROWSER GPS
// ============================================================
export function requestBrowserGps(): Promise<GpsCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(new Error(`GPS error: ${error.message}`));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// ============================================================
// BOUNDARY CHECK
// ============================================================
export function isPointInsideBoundary(
  gps: GpsCoordinates,
  boundary: ProjectBoundary
): { inside: boolean; distanceFromCenter: number } {
  const point = turf.point([gps.longitude, gps.latitude]);

  // If polygon exists, check containment
  if (boundary.boundary_geojson?.features?.[0]?.geometry) {
    const geom = boundary.boundary_geojson.features[0].geometry;
    if (geom.type === 'Polygon') {
      const poly = turf.polygon(geom.coordinates);
      const inside = turf.booleanPointInPolygon(point, poly);
      const center = turf.center(boundary.boundary_geojson);
      const distance = turf.distance(point, center, { units: 'meters' });
      return { inside, distanceFromCenter: distance };
    }
  }

  // Fallback: center + radius
  if (boundary.center_lat != null && boundary.center_lng != null) {
    const center = turf.point([boundary.center_lng, boundary.center_lat]);
    const distance = turf.distance(point, center, { units: 'meters' });
    const radius = boundary.allowed_radius_meters || DEFAULT_ALLOWED_RADIUS_METERS;
    return { inside: distance <= radius, distanceFromCenter: distance };
  }

  // No boundary info — allow but flag
  return { inside: true, distanceFromCenter: 0 };
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================
export function isDuplicateHash(
  fileHash: string,
  existingEvidence: VerificationEvidence[]
): boolean {
  return existingEvidence.some((e) => e.file_hash === fileHash);
}

// ============================================================
// GPS VARIATION CHECK (multi-photo)
// ============================================================
export function checkGpsVariation(
  gpsList: GpsCoordinates[],
  minUniquePositions: number = 3
): { sufficient: boolean; uniquePositions: number } {
  if (gpsList.length === 0) return { sufficient: false, uniquePositions: 0 };

  const threshold = 0.0001; // ~11 meters
  const unique: GpsCoordinates[] = [];

  for (const gps of gpsList) {
    const isNearExisting = unique.some(
      (u) =>
        Math.abs(u.latitude - gps.latitude) < threshold &&
        Math.abs(u.longitude - gps.longitude) < threshold
    );
    if (!isNearExisting) unique.push(gps);
  }

  return {
    sufficient: unique.length >= minUniquePositions,
    uniquePositions: unique.length,
  };
}

// ============================================================
// METADATA CONSISTENCY CHECK
// ============================================================
export function checkMetadataConsistency(
  exifData: Record<string, unknown>,
  captureTimestamp: string | null,
  uploadTimestamp: string
): { consistent: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check if capture time is in the future
  if (captureTimestamp) {
    const capture = new Date(captureTimestamp);
    const upload = new Date(uploadTimestamp);
    if (capture > upload) {
      issues.push('Capture timestamp is after upload timestamp');
    }

    // Check if capture is too old (> 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (capture < thirtyDaysAgo) {
      issues.push('Capture timestamp is more than 30 days old');
    }

    // Check timestamp mismatch (> 5 minute diff between EXIF and capture)
    if (exifData.DateTimeOriginal) {
      const exifDate = new Date(exifData.DateTimeOriginal as string);
      const diffMs = Math.abs(capture.getTime() - exifDate.getTime());
      if (diffMs > 5 * 60 * 1000) {
        issues.push('EXIF timestamp and capture timestamp differ by more than 5 minutes');
      }
    }
  }

  // Check for editing software
  const software = (exifData.Software as string) || '';
  const editingTools = ['photoshop', 'gimp', 'lightroom', 'snapseed', 'vsco', 'afterlight'];
  if (editingTools.some((tool) => software.toLowerCase().includes(tool))) {
    issues.push(`Image may have been edited with: ${software}`);
  }

  return { consistent: issues.length === 0, issues };
}

// ============================================================
// FRAUD SCORE CALCULATOR
// ============================================================
export function calculateFraudScore(params: {
  hasGps: boolean;
  insideBoundary: boolean;
  hasExif: boolean;
  isDuplicate: boolean;
  metadataConsistent: boolean;
  captureTimestampValid: boolean;
  gpsAccuracyValid: boolean;
  distanceFromCenter: number;
}): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  if (!params.hasGps) {
    score += 30;
    flags.push('Missing GPS coordinates');
  }

  if (!params.insideBoundary) {
    score += 50;
    flags.push('GPS outside project boundary');
  }

  if (!params.hasExif) {
    score += 20;
    flags.push('Missing EXIF metadata');
  }

  if (params.isDuplicate) {
    score += 40;
    flags.push('Duplicate image detected');
  }

  if (!params.metadataConsistent) {
    score += 30;
    flags.push('Suspicious metadata consistency');
  }

  if (!params.captureTimestampValid) {
    score += 20;
    flags.push('Invalid capture timestamp');
  }

  if (!params.gpsAccuracyValid) {
    score += 10;
    flags.push('Low GPS accuracy (> 50m)');
  }

  if (params.distanceFromCenter > 500) {
    score += 15;
    flags.push(`Far from project center (${Math.round(params.distanceFromCenter)}m)`);
  }

  return { score: Math.min(score, 100), flags };
}

// ============================================================
// VALIDATION STATUS FROM FRAUD SCORE
// ============================================================
export function validationStatusFromScore(fraudScore: number): EvidenceValidationStatus {
  if (fraudScore <= 10) return 'valid';
  if (fraudScore <= 40) return 'warning';
  return 'rejected';
}

// ============================================================
// FULL VALIDATION PIPELINE
// ============================================================
export async function validateEvidence(
  file: File,
  gps: GpsCoordinates | null,
  project: ProjectBoundary,
  existingEvidence: VerificationEvidence[],
  exifData: Record<string, unknown>
): Promise<EvidenceValidationResult> {
  const fileHash = await computeFileHash(file);
  const captureTimestamp = extractCaptureTimestamp(exifData);
  const uploadTimestamp = new Date().toISOString();

  const hasGps = gps !== null;
  let insideBoundary = true;
  let distanceFromCenter = 0;

  if (hasGps) {
    const result = isPointInsideBoundary(gps!, project);
    insideBoundary = result.inside;
    distanceFromCenter = result.distanceFromCenter;
  }

  const isDuplicate = isDuplicateHash(fileHash, existingEvidence);
  const metadataConsistency = checkMetadataConsistency(exifData, captureTimestamp, uploadTimestamp);

  const gpsAccuracyValid = gps?.accuracy == null || gps.accuracy <= 50;

  const captureTimestampValid = captureTimestamp !== null;

  const { score, flags } = calculateFraudScore({
    hasGps,
    insideBoundary,
    hasExif: Object.keys(exifData).length > 0,
    isDuplicate,
    metadataConsistent: metadataConsistency.consistent,
    captureTimestampValid,
    gpsAccuracyValid,
    distanceFromCenter,
  });

  const status = validationStatusFromScore(score);

  return {
    status,
    fraud_score: score,
    fraud_flags: flags,
    validation_notes: {
      has_gps: hasGps,
      inside_boundary: insideBoundary,
      distance_from_center: Math.round(distanceFromCenter),
      has_exif: Object.keys(exifData).length > 0,
      is_duplicate: isDuplicate,
      metadata_consistent: metadataConsistency.consistent,
      metadata_issues: metadataConsistency.issues,
      gps_accuracy: gps?.accuracy || null,
      capture_timestamp: captureTimestamp,
      file_hash: fileHash,
    },
  };
}
