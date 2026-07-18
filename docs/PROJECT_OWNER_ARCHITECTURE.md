# Project Owner Module — Complete Architecture Document

> System analysis and documentation for the CarbonRush AI Project Owner module.
> Generated for Verification Operations Center integration planning.

---

## Table of Contents

1. [Project Owner Dashboard](#1-project-owner-dashboard)
2. [Project Registration](#2-project-registration)
3. [Project Workspace](#3-project-workspace)
4. [Verification Request Module](#4-verification-request-module)
5. [Verification Status Lifecycle](#5-verification-status-lifecycle)
6. [Documents & Official Records](#6-documents--official-records)
7. [Notifications](#7-notifications)
8. [Activity Timeline](#8-activity-timeline)
9. [State Management](#9-state-management)
10. [Database / Data Model](#10-database--data-model)
11. [Business Rules](#11-business-rules)
12. [UI Structure](#12-ui-structure)
13. [Current Workflow](#13-current-workflow)
14. [Integration Readiness](#14-integration-readiness)

---

## 1. Project Owner Dashboard

### Layout
- **File:** `app/dashboard/owner-dashboard.tsx` (114 lines)
- Two-column layout: Left 2/3 = projects, Right 1/3 = sidebar widgets

### KPI Cards (4)
| Card | Data Source | Formula |
|------|-----------|---------|
| Total Projects | `useProjects()` hook | `projects.length` where `status === 'active' \|\| 'verified'` |
| Pending Verifications | `useProjects()` hook | `projects.length` where `verification_status === 'pending' \|\| 'in_review'` |
| Carbon Passports | `useProjects()` hook | `projects.length` where `passport_issued_at` is truthy |
| Revenue | `useProjects()` hook | `sum(project.verified_carbon_tonnes)` across all projects |

### Quick Actions (4)
| Action | Route |
|--------|-------|
| Register New Project | `/dashboard/projects/new` |
| Discover Projects | `/dashboard/discover` |
| Browse Agencies | `/dashboard/verification-agencies` |
| View Reports | `/dashboard/reports` |

### Right Sidebar
- **UpcomingEventsWidget** — Calendar events with `status === 'upcoming'`, max 8
- **Notifications** — Top 5 from `useNotifications()`, unread badge

### Data Sources
- `useProjects()` → Supabase `projects` table (filtered by `owner_id` for project_owner role)
- `useNotifications()` → Supabase `notifications` table (limit 20)
- `useCalendarEvents()` → Supabase `calendar_events` table

---

## 2. Project Registration

### File
`app/dashboard/projects/new/page.tsx` (630 lines)

### 5-Step Wizard

| Step | Label | Validated Fields |
|------|-------|-----------------|
| 0 | Project Info | `name`, `description`, `project_type`, `expected_duration_months`, `objectives` |
| 1 | Location | `location_name`, `country` + map boundary (required) |
| 2 | Land Info | `ownership_type`, `survey_number` |
| 3 | Baseline | File uploads (optional) |
| 4 | Review | Read-only summary |

### Form Schema (Zod)
| Field | Type | Validation |
|-------|------|-----------|
| `name` | string | min 3 chars |
| `description` | string | min 10 chars |
| `project_type` | string | required |
| `expected_duration_months` | string | required |
| `objectives` | string | min 10 chars |
| `location_name` | string | required |
| `country` | string | required |
| `ownership_type` | string | required |
| `survey_number` | string | optional |

### Fields Stored on Project
| Field | Source | Value |
|-------|--------|-------|
| `name` | Form | string |
| `slug` | Generated | `slugify(name)` max 50 chars |
| `description` | Form | string |
| `project_type` | Form | `ProjectType` enum |
| `status` | Hardcoded | `'registered'` |
| `verification_status` | Hardcoded | `'not_submitted'` |
| `health_score` | Hardcoded | `0` |
| `country` | Form | string |
| `location_name` | Form | string |
| `objectives` | Form | string |
| `expected_duration_months` | Form | number |
| `ownership_type` | Form | `OwnershipType` enum |
| `survey_number` | Form | string \| null |
| `boundary_geojson` | Map editor | GeoJSON FeatureCollection |
| `area_hectares` | Map editor | number \| null |
| `perimeter_km` | Map editor | number \| null |
| `center_lat` | Map editor | number \| null |
| `center_lng` | Map editor | number \| null |
| `bounding_box` | Map editor | number[] \| null |
| `owner_id` | Auth user | string (UUID) |

### Post-Submit Actions
1. `createProject()` → Supabase `projects` insert + `project_activity` insert
2. Upload baseline files → `evidence` bucket → `project_files` rows
3. Upload land registry → `project-documents` bucket → `project_files` row
4. Redirect to `/dashboard/projects/${id}`

### Map Boundary
- Component: `BoundaryEditor` (dynamic import, SSR disabled)
- User draws polygon on map
- System computes: area (hectares), perimeter (km), center point, bounding box
- Boundary is **required** before step 1→2 transition

---

## 3. Project Workspace

### Layout
**File:** `app/dashboard/projects/[id]/layout.tsx` (91 lines)

```
┌─────────────────────────────────────────────┐
│ WorkspaceSidebar (260px) │ WorkspaceHeader (sticky) │
│                         │ ──────────────────────────│
│  Back to Projects       │ Content Area              │
│  Project Name           │                           │
│  [Type] [Status]        │  {children}               │
│                         │                           │
│  Nav Sections:          │                           │
│  - Overview             │                           │
│  - Project History      │                           │
│  - Submit Application   │                           │
│  - Official Records     │                           │
│  - Project Gallery      │                           │
│  - Monitoring           │                           │
│  - Reports              │                           │
│  - Project Settings     │                           │
└─────────────────────────────────────────────┘
```

**Business Rule:** If `role === 'project_owner'` and active VOC application exists (status: `submitted|under_review|audit_scheduled|audit_completed`), an amber lock banner appears: "Project records are locked."

### 3.1 Overview
**File:** `app/dashboard/projects/[id]/page.tsx` (529 lines)

| Section | Data |
|---------|------|
| About the Project | Auto-generated prose from project fields |
| Verification Summary | `verification_service_requests` + `project_partnerships` counts |
| Relationships | Owner → Verifier → Partner chain |
| Environmental Impact | Carbon, habitat area, duration |
| Timeline | Last 6 activities from `useProjectActivity()` |
| Verification Status | Status badge + health score gauge |
| Partnership Lifecycle | 8-stage vertical stepper |
| Owner Profile | Owner info card |
| Similar Projects | Up to 3 related (partner-only) |

### 3.2 Evidence Center
**File:** `app/dashboard/projects/[id]/evidence/page.tsx` (613 lines)

| Feature | Implementation |
|---------|---------------|
| Albums | `project_albums` table, create/rename/delete |
| Items | `project_gallery_items` table, grid/timeline views |
| Upload | `project-gallery` Supabase bucket |
| Stats | Total items, images, videos, album count |
| Lock | Disabled when active VOC application exists |

### 3.3 Documents
**File:** `app/dashboard/projects/[id]/documents/page.tsx` (644 lines)

| Feature | Implementation |
|---------|---------------|
| Categories | 11 categories (land_ownership, government_approval, etc.) |
| Storage | `project-documents` Supabase bucket |
| Versions | `version` field on `project_documents_v2`, version history drawer |
| Status | `document_workflow_status`: uploaded → submitted → under_review → verified/rejected |
| Lock | Disabled when active VOC application exists |

### 3.4 Official Records
**File:** `app/dashboard/projects/[id]/official-records/page.tsx` (146 lines)

| Feature | Implementation |
|---------|---------------|
| Data source | `getOfficialRecordsForProject(projectId)` (VOC localStorage) |
| Record types | carbon_passport, verification_certificate, audit_report, ngo_approval, supporting_document, verification_history |
| Display | 3-column grid with type icons, badges, download/view buttons |

### 3.5 Reports
**File:** `app/dashboard/projects/[id]/reports/page.tsx` (84 lines)

| Feature | Implementation |
|---------|---------------|
| Report types | Monthly, Annual, Carbon, Government, Impact (5 types) |
| Data | `useMonitoringReports(projectId)` |
| Summary | Report count, area, health score |

### 3.6 Monitoring
**File:** `app/dashboard/projects/[id]/monitoring/page.tsx` (308 lines)

| Feature | Implementation |
|---------|---------------|
| Read-only | Labeled "Monitoring Center, read-only" |
| Tabs | all, monthly, inspection, drone, satellite, carbon, health |
| Data | `useMonitoringReports()` + `useProjectPartnerships()` |
| Stats | Total reports, approved, pending, org count |

### 3.7 Timeline / Project History
**File:** `app/dashboard/projects/[id]/timeline/page.tsx` (641 lines)

| Feature | Implementation |
|---------|---------------|
| Categories | 7 tabs (all, documents, verifications, partnerships, monitoring, gallery, comments) |
| Events | 50+ event type → icon mappings |
| Filters | Date range, verification org, company, status |
| Pagination | 30 per page with "Load more" |
| Data | `fetchProjectHistory()` service with `ProjectHistoryFilters` |

### 3.8 Map / Boundary
**File:** `app/dashboard/projects/[id]/map/page.tsx` (128 lines)

| Feature | Implementation |
|---------|---------------|
| Owner | Editable `BoundaryEditor` with save |
| Non-owner | Read-only `ProjectMap` |
| Save | Updates boundary_geojson, area, perimeter, center, bbox + logs activity |

### 3.9 Settings
**File:** `app/dashboard/projects/[id]/settings/page.tsx` (437 lines)

| Feature | Implementation |
|---------|---------------|
| Edit | name, description, project_type → `projects.update()` |
| Cover image | Upload to `project-cover-images` bucket (max 10MB) |
| Archive | `projects.update({ status: 'paused' })` |
| Delete | `fetch(/api/projects/${id}, DELETE)` with AlertDialog |

### 3.10 Discussion
**File:** `app/dashboard/projects/[id]/discussion/page.tsx` (231 lines)

| Feature | Implementation |
|---------|---------------|
| Threaded | Parent/child comments via `discussion_comments` |
| Authors | Profile lookup per comment |
| Roles | Verifier/Partner/Owner labels |

### 3.11 Land Ownership
**File:** `app/dashboard/projects/[id]/land-ownership/page.tsx` (296 lines)

| Feature | Implementation |
|---------|---------------|
| Documents | Fetched via `/api/land-documents` |
| Actions | Verify, Reject, Request Additional |
| Stats | Total, verified, pending counts |

### 3.12 AI Review
**File:** `app/dashboard/projects/[id]/ai-review/page.tsx` (436 lines)

| Feature | Implementation |
|---------|---------------|
| Access | Verifier-only execution |
| Analysis | Client-side simulation (1.5s timeout) |
| Metrics | 6 metrics with confidence scores |
| Storage | `POST /api/ai-analysis` |

### 3.13 Decision
**File:** `app/dashboard/projects/[id]/decision/page.tsx` (360 lines)

| Feature | Implementation |
|---------|---------------|
| Options | approved, changes_requested, rejected |
| On approval | `projects.update({ status: 'verified', verification_status: 'approved', passport_issued_at })` |
| Records | `verification_service_decisions` insert |

### 3.14 Calendar
**File:** `app/dashboard/projects/[id]/calendar/page.tsx` (202 lines)

| Feature | Implementation |
|---------|---------------|
| Calendar | Custom grid (no library) |
| Events | `useCalendarEvents(projectId)` |
| Modals | AddEventModal, EventDetailModal |

### 3.15 AI Intelligence (Revenue)
Not implemented as a separate page. Revenue is shown as a KPI card on the dashboard (sum of `verified_carbon_tonnes`).

---

## 4. Verification Request Module

### Complete Flow

```
Project Owner                    VOC System (localStorage)
     │                                │
     ├── Navigate to Verification ────┤
     │                                │
     ├── Step 1: Project Summary ─────┤ (read-only)
     │                                │
     ├── Step 2: Select Agencies ─────┤ AgencyMultiSelect component
     │   (up to 5 agencies)           │   - Search by name/expertise/location
     │                                │   - Excludes fully_booked
     │                                │   - Chips with remove
     │                                │
     ├── Step 3: Documents ───────────┤ Upload to Supabase storage
     │                                │   - project_documents_v2 table
     │                                │
     ├── Step 4: Evidence ────────────┤ Upload to project-gallery bucket
     │                                │   - project_gallery_items table
     │                                │
     ├── Step 5: Declaration ─────────┤ Checkbox confirmation
     │                                │
     ├── Step 6: Review & Submit ─────┤ sendVerificationRequests()
     │                                │   - Creates VerificationRequest
     │                                │   - Creates AgencyRequest[] per agency
     │                                │   - Logs activity
     │                                │   - Sends notifications
     │                                │
     └── RequestTracker ──────────────┤ Shows agency status table
         (replaces wizard)            │   - Apply for Carbon Passport
                                      │   - Status badges per agency
```

### Multi-Agency Selection
**Component:** `AgencyMultiSelect` (196 lines)
- Search: name, HQ, expertise, states, countries
- Filter: excludes `fully_booked` agencies
- Max selections: 5
- Display: removable chips with availability dot

### Request Data Structure
```typescript
interface VerificationRequest {
  id: string;                          // "vreq-{timestamp}-{random}"
  requestNumber: string;               // "VR-{year}-{sequence}"
  projectId: string;
  projectName: string;
  projectOwnerId: string;
  projectOwnerName: string;
  selectedAgencies: AgencyRequest[];   // Per-agency tracking
  snapshot?: ProjectSnapshot;          // Optional frozen state
  createdAt: string;                   // ISO timestamp
}

interface AgencyRequest {
  agencyId: string;
  agencyName: string;
  requestStatus: 'sent' | 'accepted' | 'declined';
  verificationStatus: AgencyVerificationStatus;
  assignedVerifier: string | null;
  auditDate: string | null;
  lastUpdated: string;
  carbonPassportStatus: CarbonPassportStatus;
}
```

### Storage
- **Key:** `carbonrush_voc_requests` (localStorage)
- **Functions:** `sendVerificationRequests()`, `updateAgencyRequest()`, `getActiveVerificationRequestForProject()`

### Agency Link to Project
Agencies are linked via `VerificationRequest.selectedAgencies[]`. Each agency has an independent `AgencyRequest` with its own status lifecycle. The `VerificationRequest` links to `projectId` via the `projectId` field.

---

## 5. Verification Status Lifecycle

### Request Status (`AgencyRequestStatus`)
```
sent ──────────→ accepted
  │
  └─────────────→ declined
```

### Verification Status (`AgencyVerificationStatus`)
```
waiting
  │
  ├──→ under_review (when verifier assigned)
  │       │
  │       ├──→ audit_scheduled
  │       │       │
  │       │       └──→ audit_completed
  │       │               │
  │       │               ├──→ approved
  │       │               ├──→ returned
  │       │               └──→ rejected
  │       │
  │       ├──→ returned
  │       └──→ rejected
  │
  ├──→ approved
  ├──→ returned
  └──→ rejected
```

### Carbon Passport Status (`CarbonPassportStatus`)
```
none
  │
  └──→ requested (when owner clicks "Apply for Carbon Passport")
          │
          └──→ under_processing (set by agency)
                  │
                  └──→ issued (passport + certificate generated)
```

### Component Controls

| Transition | Trigger | Component/Function |
|-----------|---------|-------------------|
| sent → accepted | Agency clicks accept | `acceptAgencyRequest()` |
| sent → declined | Agency clicks decline | `declineAgencyRequest()` |
| waiting → under_review | Verifier assigned | `assignVerifierToAgency()` |
| under_review → audit_scheduled | Audit scheduled | `scheduleAgencyAudit()` |
| audit_scheduled → audit_completed | Audit completed | `completeAgencyAudit()` |
| audit_completed → approved/returned/rejected | Verifier decides | `decideAgencyRequest()` |
| none → requested | Owner clicks Apply | `applyForCarbonPassport()` |
| requested → under_processing | Agency processes | `updateCarbonPassportStatus()` |
| under_processing → issued | Agency issues | `updateCarbonPassportStatus()` |

---

## 6. Documents & Official Records

### Uploaded Documents

| Type | Table | Bucket | Categories |
|------|-------|--------|-----------|
| Project documents | `project_documents_v2` | `project-documents` | 11 categories |
| Evidence | `project_gallery_items` | `project-gallery` | Images, videos |
| Baseline files | `project_files` | `evidence` | Ground images, drone, survey, reports |
| Land registry | `project_files` | `project-documents` | land_registry |

### Generated Documents

| Document | Generated By | Stored In |
|----------|-------------|-----------|
| Carbon Passport | `submitDecision()` on approve | `verification_passport` (VOC) |
| Verification Certificate | `submitDecision()` on approve | `verification_certificate` (VOC) |
| Audit Report | `submitAuditForm()` | `audit_reports` (VOC) |
| Carbon Passport (multi-agency) | `updateCarbonPassportStatus()` on issued | `official_records` (VOC) + `officialRecords` array |

### Storage Structure
```
Supabase Storage:
  project-documents/
    {projectId}/docs/{uuid}.{ext}
  project-gallery/
    {projectId}/evidence/{uuid}.{ext}
  evidence/
    {projectId}/baseline/{uuid}.{ext}
  project-cover-images/
    {projectId}/{uuid}.{ext}

VOC localStorage:
  carbonrush_voc_records → OfficialRecord[]
  carbonrush_voc_reports → AuditReport[]
  carbonrush_voc_passport_apps → CarbonPassportApplication[]
```

### Download Functionality
- **Supabase documents:** `supabase.storage.from('project-documents').createSignedUrl()` → opens in new tab
- **VOC records:** Placeholder buttons (Download/View not implemented)

---

## 7. Notifications

### Notification Types

| Type | Trigger | Target |
|------|---------|--------|
| `verification_submitted` | `submitApplication()` | Agency |
| `verification_under_review` | `startReview()` | Owner |
| `verification_audit_scheduled` | `scheduleAudit()` | Owner |
| `verification_approved` | `submitDecision('approve')` | Owner |
| `verification_returned` | `submitDecision('return')` | Owner |
| `verification_rejected` | `submitDecision('reject')` | Owner |
| `carbon_passport_generated` | `submitDecision('approve')` | Owner |
| `verification_requests_sent` | `sendVerificationRequests()` | Owner |
| `agency_declined` | `declineAgencyRequest()` | Owner |
| `agency_accepted` | `acceptAgencyRequest()` | Owner |
| `verifier_assigned` | `assignVerifierToAgency()` | Owner |
| `audit_scheduled` | `scheduleAgencyAudit()` | Owner |
| `audit_completed` | `completeAgencyAudit()` | Owner |
| `project_approved` | `decideAgencyRequest('approved')` | Owner |
| `project_returned` | `decideAgencyRequest('returned')` | Owner |
| `project_rejected` | `decideAgencyRequest('rejected')` | Owner |
| `carbon_passport_requested` | `applyForCarbonPassport()` | Agency |
| `carbon_passport_under_processing` | `updateCarbonPassportStatus()` | Owner |
| `carbon_passport_issued` | `updateCarbonPassportStatus()` | Owner |

### Implementation
- **Supabase (real):** `notifications` table via `useNotifications()` hook, `services/notify.ts` server action using `insert_notification()` RPC
- **VOC (mock):** `carbonrush_voc_notifications` localStorage key via `sendNotification()` in `voc-services.ts`

### Data Model
```typescript
interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  type: string;
  read: boolean;
  link?: string;
}

interface VocabNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  targetUserId: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
```

---

## 8. Activity Timeline

### Logged Activities
Every mutation in `voc-services.ts` calls `logActivity()` with:
- `projectId`, `eventType`, `title`, `description`, `actorName`, `actorRole`, `metadata`

### Event Types (50+)
Key types include: `project_created`, `boundary_updated`, `passport_issued`, `carbon_passport_applied`, `carbon_passport_issued`, `verification_requests_sent`, `decision_approved`, `decision_rejected`, `decision_changes_requested`, `document_uploaded`, `evidence_uploaded`, `monitoring_report`, `comment_added`, `partnership_created`, etc.

### Storage
- **Supabase (real):** `project_activity` table via `useProjectActivity()` hook
- **VOC (mock):** `carbonrush_voc_activity` localStorage key via `logActivity()` in `voc-services.ts`

### Timeline Generation
**File:** `app/dashboard/projects/[id]/timeline/page.tsx`
- Uses `fetchProjectHistory()` from `services/project-history.ts`
- Supports: date range, org, company, status, category filters
- Groups by date with relative labels (Today, Yesterday, N days ago)
- Paginated (30 per page)

---

## 9. State Management

### No Zustand/Redux Stores
All state management is done through React hooks + Supabase real-time or localStorage.

### Hooks (`hooks/`)

| Hook | Manages | Source |
|------|---------|--------|
| `useProjects()` | Project list | Supabase `projects` |
| `useProject(id)` | Single project | Supabase `projects` |
| `useProjectActivity(id)` | Activity timeline | Supabase `project_activity` |
| `useProjectFiles(id)` | Project files | Supabase `project_files` |
| `useMonitoringReports(id)` | Monitoring data | Supabase `monitoring_reports` |
| `useNotifications()` | Notifications | Supabase `notifications` |
| `useDiscussionComments(id)` | Discussion threads | Supabase `discussion_comments` |
| `useProjectPartnerships(id)` | Partnerships | Supabase `project_partnerships` |
| `useCarbonPassport(id)` | Passport | Supabase `carbon_passports` |
| `useVerificationRequests(id)` | VOC requests | Supabase `verification_service_requests` |
| `useVerificationDecisions(id)` | VOC decisions | Supabase `verification_service_decisions` |
| `useCalendarEvents(id?)` | Calendar | Supabase `calendar_events` |
| `usePagination(items)` | Generic pagination | Client-side |

### Context Providers

| Provider | Manages |
|----------|---------|
| `AuthProvider` | `user`, `session`, `profile`, `role`, `approvalStatus`, `isApproved` |
| `SidebarProvider` | `collapsed: boolean` |
| `ThemeProvider` | Dark/light mode |

### Services (`services/`)

| Service | Purpose | Backend |
|---------|---------|---------|
| `projects.ts` | CRUD for projects | Supabase server actions |
| `storage.ts` | File upload (50MB max) | Supabase storage |
| `notify.ts` | Send notifications | Supabase RPC |
| `project-history.ts` | Activity logging + history queries | Supabase |
| `land-ownership.ts` | Land document verification | Supabase server actions |
| `identity.ts` | KYC/identity verification | Supabase server actions |
| `evidence.ts` | Evidence management | Supabase server actions |
| `dual-verification.ts` | Risk assessment + dual review | Supabase server actions |
| `audit.ts` | Audit trail | Supabase RPC |
| `ai-analysis.ts` | AI analysis CRUD | Supabase |
| `security.ts` | Rate limiting, brute force | Supabase RPC |
| `voc-services.ts` | VOC workflow (all verification) | localStorage |

---

## 10. Database / Data Model

### Core Objects

#### Project
**Table:** `projects` | **Fields:**
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `owner_id` | UUID | FK → `profiles.id` |
| `name` | string | |
| `slug` | string | URL-friendly |
| `description` | string | |
| `project_type` | enum | mangrove, seagrass, salt_marsh, kelp_forest, mixed |
| `status` | enum | draft, registered, in_verification, verified, rejected, active, paused, completed |
| `country` | string | |
| `location_name` | string | |
| `boundary_geojson` | jsonb | GeoJSON FeatureCollection |
| `area_hectares` | number | |
| `perimeter_km` | number | |
| `center_lat` | number | |
| `center_lng` | number | |
| `bounding_box` | number[] | |
| `target_carbon_tonnes` | number | |
| `verified_carbon_tonnes` | number | |
| `verification_status` | enum | not_submitted, pending, in_review, approved, rejected, expired |
| `passport_issued_at` | timestamp | |
| `ownership_type` | enum | private, government, community, leased |
| `survey_number` | string | |
| `land_verification_status` | enum | not_requested, requested, verified, rejected |
| `health_score` | number | 0-100 |
| `cover_image_url` | string | |

#### Verification Request (VOC)
**Storage:** localStorage `carbonrush_voc_requests` | **Fields:**
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | `vreq-{timestamp}-{random}` |
| `requestNumber` | string | `VR-{year}-{sequence}` |
| `projectId` | string | Links to project |
| `projectName` | string | |
| `projectOwnerId` | string | |
| `projectOwnerName` | string | |
| `selectedAgencies` | AgencyRequest[] | Per-agency tracking |
| `snapshot` | ProjectSnapshot | Optional frozen state |
| `createdAt` | string | ISO timestamp |

#### Agency Request
**Embedded in:** `VerificationRequest.selectedAgencies` | **Fields:**
| Field | Type |
|-------|------|
| `agencyId` | string |
| `agencyName` | string |
| `requestStatus` | 'sent' \| 'accepted' \| 'declined' |
| `verificationStatus` | AgencyVerificationStatus |
| `assignedVerifier` | string \| null |
| `auditDate` | string \| null |
| `lastUpdated` | string |
| `carbonPassportStatus` | CarbonPassportStatus |

#### Verification Agency
**Storage:** `lib/voc-mock-data.ts` (15 agencies) | **Fields:** 35+ including name, HQ, expertise, availability, capacity metrics, certifications, recent projects.

#### Carbon Passport Application
**Storage:** localStorage `carbonrush_voc_passport_apps` | **Fields:**
| Field | Type |
|-------|------|
| `id` | string |
| `requestId` | string |
| `agencyId` | string |
| `agencyName` | string |
| `projectId` | string |
| `projectName` | string |
| `projectOwnerId` | string |
| `status` | 'none' \| 'requested' \| 'under_processing' \| 'issued' |
| `assignedVerifier` | string \| null |
| `verificationReportRef` | string \| null |
| `auditReportRef` | string \| null |
| `certificateUrl` | string \| null |
| `passportNumber` | string \| null |
| `createdAt` | string |
| `updatedAt` | string |

#### Official Record
**Storage:** localStorage `carbonrush_voc_records` | **Fields:**
| Field | Type |
|-------|------|
| `id` | string |
| `application_id` | string |
| `record_type` | 'carbon_passport' \| 'verification_certificate' \| 'audit_report' \| 'ngo_approval' \| 'supporting_document' \| 'verification_history' |
| `title` | string |
| `description` | string |
| `created_date` | string |
| `timestamp` | string |
| `verifier_name` | string |
| `ngo_name` | string |
| `status` | 'active' \| 'archived' |
| `file_name` | string |

#### Notification
**Table (Supabase):** `notifications` | **Fields:**
| Field | Type |
|-------|------|
| `id` | UUID |
| `user_id` | UUID |
| `title` | string |
| `body` | string |
| `type` | string |
| `read` | boolean |
| `link` | string |

#### Activity
**Table (Supabase):** `project_activity` | **Fields:**
| Field | Type |
|-------|------|
| `id` | UUID |
| `project_id` | UUID |
| `actor_id` | UUID |
| `event_type` | string |
| `title` | string |
| `description` | string |
| `metadata` | jsonb |
| `organization_id` | UUID |
| `company_id` | UUID |
| `related_*` | UUID (multiple) |
| `actor_name` | string |
| `actor_role` | string |
| `organization_name` | string |

#### Evidence
**Table (Supabase):** `verification_evidence` | **Fields:**
| Field | Type |
|-------|------|
| `id` | UUID |
| `project_id` | UUID |
| `verification_request_id` | UUID |
| `uploaded_by` | UUID |
| `photo_url`, `video_url`, `drone_*_url` | string |
| GPS fields | latitude, longitude, accuracy, source, timestamp |
| Device fields | device_name, model, platform, exif_data |
| Integrity | file_hash, file_size, mime_type, storage_path |
| Validation | evidence_type, validation_status, fraud_score, ai_* |

---

## 11. Business Rules

### Project Lifecycle
1. Projects start with `status: 'registered'` and `verification_status: 'not_submitted'`
2. Boundary must be drawn before registration can proceed
3. File upload failures are non-blocking (project is already created)
4. Projects can be archived (`status: 'paused'`) but not permanently deleted via UI easily

### Verification
5. Multiple agencies can receive verification requests (up to 5)
6. Each agency has independent status tracking
7. Documents become read-only when an active VOC application exists
8. Evidence center is locked during verification review
9. Only agencies with `availability !== 'fully_booked'` can be selected
10. At least 1 agency must be selected to proceed to declaration

### Carbon Passport
11. Carbon Passport can only be requested from agencies with `verificationStatus === 'approved'`
12. One Carbon Passport application per agency per request
13. Apply button hidden once application is submitted
14. On issuance: both Carbon Passport + Verification Certificate are generated as OfficialRecords
15. Notifications sent on: application submitted, under processing, issued

### Documents
16. 11 document categories with versioning (version number tracked)
17. Documents have workflow status: uploaded → submitted → under_review → verified/rejected
18. Download via signed URLs from Supabase storage

### Notifications
19. Every VOC mutation sends a notification to the project owner
20. Notifications are also logged as activity events
21. Supabase notifications use RPC function with SECURITY DEFINER

### Access Control
22. Auto-approved roles: `project_owner`, `sustainability_partner`
23. Verifier sees different dashboard (redirects to VOC)
24. Owner-only: project settings, map editing, evidence uploads (when unlocked)
25. Verifier-only: AI review execution, decision submission, passport issuance

---

## 12. UI Structure

```
Project Owner Dashboard
│
├── My Projects
│   └── Project Card (cover, name, location, stats, workspace button)
│
├── Create Project
│   └── 5-Step Wizard
│       ├── Step 0: Project Info
│       ├── Step 1: Location + Map Boundary
│       ├── Step 2: Land Info + Files
│       ├── Step 3: Baseline Evidence
│       └── Step 4: Review & Submit
│
├── Project Workspace
│   ├── Overview
│   │   ├── About the Project
│   │   ├── Verification Summary
│   │   ├── Relationships
│   │   ├── Environmental Impact
│   │   ├── Timeline Summary
│   │   ├── Verification Status
│   │   ├── Partnership Lifecycle
│   │   └── Owner Profile
│   │
│   ├── Evidence Center
│   │   ├── Albums
│   │   ├── Grid/Timeline View
│   │   └── Upload Dialog
│   │
│   ├── Documents
│   │   ├── Category Sidebar (11 categories)
│   │   ├── Document List (grouped by category)
│   │   ├── Version History Drawer
│   │   └── Upload Dialog
│   │
│   ├── Official Records
│   │   └── Record Cards (type, status, download)
│   │
│   ├── Reports
│   │   └── 5 Report Type Cards
│   │
│   ├── Monitoring (read-only)
│   │   ├── Stats Cards
│   │   ├── Active Partnerships
│   │   └── Report List (filterable tabs)
│   │
│   ├── Timeline / Project History
│   │   ├── Search + Filters
│   │   ├── 7 Category Tabs
│   │   └── Activity Cards (date-grouped)
│   │
│   ├── Map / Boundary
│   │   └── BoundaryEditor (owner) or ProjectMap (read-only)
│   │
│   ├── Discussion
│   │   ├── New Comment Form
│   │   └── Threaded Comments
│   │
│   ├── Land Ownership
│   │   ├── Document List
│   │   ├── Verification Status
│   │   └── Review Panel
│   │
│   ├── AI Review (verifier-only)
│   │   ├── Run Analysis
│   │   ├── Results Grid (6 metrics)
│   │   └── Previous Analyses
│   │
│   ├── Decision (verifier-only)
│   │   ├── Active Request Card
│   │   ├── Decision Form
│   │   └── Decision History
│   │
│   ├── Calendar
│   │   ├── Month Grid
│   │   ├── Event Dots
│   │   └── Upcoming Events List
│   │
│   └── Settings
│       ├── General (name, desc, type)
│       ├── Appearance (cover image)
│       ├── Visibility
│       ├── Notifications
│       └── Danger Zone (archive, delete)
│
├── Verification (within workspace)
│   ├── 6-Step Wizard
│   │   ├── Step 1: Project Summary
│   │   ├── Step 2: Agency Multi-Select
│   │   ├── Step 3: Documents
│   │   ├── Step 4: Evidence
│   │   ├── Step 5: Declaration
│   │   └── Step 6: Review & Submit
│   └── RequestTracker (after submission)
│       ├── Stats Grid
│       ├── Agency Responses Table
│       │   └── Actions Column (Apply for Carbon Passport / Status Badge)
│       └── Approval Banner
│
├── Verification Agencies (directory)
│   ├── Search + Filters (4 dropdowns)
│   ├── Sort (5 options)
│   └── Agency Cards (metrics, expertise, availability)
│
└── Notifications
    └── Notification List (mark read, unread badge)
```

---

## 13. Current Workflow

### End-to-End Lifecycle

```
1. User Registration
   └── Profile created with role 'project_owner'
       └── Auto-approved (no admin review needed)

2. Project Registration (5-step wizard)
   ├── Enter project info
   ├── Draw boundary on map
   ├── Enter land info + upload registry
   ├── Upload baseline evidence
   └── Review & submit
       └── Project created: status='registered', verification_status='not_submitted'

3. Project Workspace
   ├── Upload evidence (Evidence Center)
   ├── Upload documents (Documents page)
   ├── Set up calendar events
   └── Build discussion threads

4. Submit Verification Requests
   ├── Navigate to Verification section
   ├── Review project summary (Step 1)
   ├── Select up to 5 verification agencies (Step 2)
   ├── Attach additional documents (Step 3)
   ├── Attach evidence items (Step 4)
   ├── Confirm declaration (Step 5)
   ├── Review & submit (Step 6)
   └── RequestTracker appears (replaces wizard)
       └── Status: all agencies = 'sent' / 'waiting'

5. Agency Responds
   ├── Agency accepts/declines request
   ├── Verifier assigned → status: 'under_review'
   ├── Audit scheduled → status: 'audit_scheduled'
   └── Audit completed → status: 'audit_completed'

6. Verification Decision
   └── Agency decides: approved / returned / rejected
       ├── Approved → status: 'approved'
       │   └── Owner sees "Apply for Carbon Passport" button
       ├── Returned → status: 'returned'
       │   └── Owner revises and resubmits
       └── Rejected → status: 'rejected'
           └── Terminal state

7. Apply for Carbon Passport
   └── Owner clicks "Apply for Carbon Passport" on approved agency
       └── Status: 'requested' → 'under_processing' → 'issued'
           ├── Carbon Passport generated
           ├── Verification Certificate generated
           ├── Official Records created
           └── Notifications sent

8. Official Records Updated
   └── Owner views/downloads from Official Records page
```

---

## 14. Integration Readiness

### Components That Need VOC Communication

| Component | Current State | Integration Need |
|-----------|--------------|-----------------|
| `RequestTracker` | Reads from localStorage | Needs real-time updates from agency |
| `AgencyMultiSelect` | Static mock data | Needs real agency data from backend |
| `VerificationWorkspacePage` | localStorage-based | Needs Supabase backend |
| `OfficialRecordsPage` | localStorage-based | Needs real record storage |
| `CarbonPassportApplication` | localStorage-only | Needs persistence |

### Data That Should Be Shared

| Data | Current Storage | Recommended |
|------|----------------|-------------|
| Verification Requests | localStorage | Supabase table |
| Agency Requests | localStorage | Supabase table (linked to request) |
| Carbon Passport Applications | localStorage | Supabase table |
| Official Records | localStorage | Supabase table + storage |
| Audit Reports | localStorage | Supabase table |
| VOC Notifications | localStorage | Merge with Supabase `notifications` |
| VOC Activity | localStorage | Merge with Supabase `project_activity` |

### Events That Should Trigger Synchronization

| Event | Current | Should Also |
|-------|---------|-------------|
| Agency accepts request | localStorage update | Supabase real-time broadcast |
| Verifier assigned | localStorage update | Supabase notification to owner |
| Audit completed | localStorage update | Supabase notification to owner |
| Decision made | localStorage update | Supabase: update project status + create records |
| Passport applied | localStorage update | Supabase notification to agency |
| Passport issued | localStorage update | Supabase: create official records + notify owner |

### APIs/Services/Stores That Should Be Shared

| Currently Shared | Should Be Unified |
|-----------------|-------------------|
| `useNotifications()` (Supabase) + `sendNotification()` (VOC) | Single notification service |
| `useProjectActivity()` (Supabase) + `logActivity()` (VOC) | Single activity service |
| `getOfficialRecordsForProject()` (VOC) | Should query Supabase |

### Modules Ready for Integration

| Module | Status | Notes |
|--------|--------|-------|
| Project Registration | ✅ Ready | Fully Supabase-backed |
| Project Workspace | ✅ Ready | All pages use Supabase |
| Notifications | ✅ Ready | Supabase RPC in place |
| Activity Timeline | ✅ Ready | Supabase-backed |
| Documents | ✅ Ready | Supabase storage + DB |
| Evidence | ✅ Ready | Supabase storage + DB |
| Land Ownership | ✅ Ready | Supabase API routes |
| Identity Verification | ✅ Ready | Supabase server actions |
| Dual Verification | ✅ Ready | Supabase server actions |
| Audit Trail | ✅ Ready | Supabase RPC |

### Modules Needing Refactoring

| Module | Status | What's Needed |
|--------|--------|--------------|
| Verification Request Flow | ⚠️ Partial | Multi-agency logic in localStorage → migrate to Supabase |
| Agency Directory | ⚠️ Partial | Mock data → real Supabase table |
| Carbon Passport | ⚠️ Partial | localStorage apps → Supabase table |
| Official Records | ⚠️ Partial | localStorage → Supabase table + storage |
| VOC Notifications | ⚠️ Partial | Separate system → merge with main notifications |
| VOC Activity | ⚠️ Partial | Separate system → merge with main activity |
| AI Review | ⚠️ Partial | Client simulation → real AI service |
| Calendar (VOC) | ❌ Empty | No data source wired |

### Recommendations for Integration

1. **Create Supabase tables** for `verification_requests`, `agency_requests`, `carbon_passport_applications`, `voc_official_records` to replace localStorage
2. **Merge notification systems** — VOC notifications should write to the same `notifications` table
3. **Merge activity systems** — VOC activities should write to the same `project_activity` table
4. **Migrate agency data** from `voc-mock-data.ts` to a Supabase `verification_agencies` table
5. **Add real-time subscriptions** on verification request tables so the RequestTracker updates live
6. **Preserve the existing UI structure** — the component hierarchy is well-designed, only the data layer needs migration
7. **Keep `voc-services.ts` as an adapter layer** — refactor to call Supabase instead of localStorage while maintaining the same function signatures
8. **Don't break the 5-step wizard** — it's the primary owner-facing flow and should continue working after migration
