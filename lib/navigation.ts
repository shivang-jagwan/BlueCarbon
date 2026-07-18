import {
  LayoutDashboard,
  Map,
  FolderKanban,
  FileText,
  Upload,
  CalendarDays,
  Bell,
  ClipboardList,
  CheckCircle2,
  ShieldCheck,
  Award,
  Search,
  GitCompare,
  Building2,
  BarChart3,
  Users,
  Sparkles,
  Globe,
  User,
  Settings,
  Camera,
  Landmark,
  Shield,
  AlertTriangle,
  Fingerprint,
  type LucideIcon,
} from 'lucide-react';
import type { AppRole } from '@/lib/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const OWNER_NAV: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My Projects', href: '/dashboard/projects', icon: FolderKanban },
      { label: 'Register Project', href: '/dashboard/projects/new', icon: Map },
    ],
  },
  {
    title: 'Discover',
    items: [
      { label: 'Project Discovery', href: '/dashboard/discover', icon: Globe },
      { label: 'Verification Agencies', href: '/dashboard/verification-agencies', icon: ShieldCheck },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Identity Verification', href: '/dashboard/identity', icon: Fingerprint },
      { label: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { label: 'Profile', href: '/dashboard/profile', icon: User },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export const VERIFIER_NAV: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Verification Operations Center', href: '/dashboard/verification', icon: ShieldCheck },
      { label: 'Carbon Passport Requests', href: '/dashboard/verification/passport-requests', icon: Award },
      { label: 'Monitoring Projects', href: '/dashboard/projects', icon: FolderKanban },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      { label: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Org Profile', href: '/dashboard/organization', icon: Building2 },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export const PARTNER_NAV: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Discover Projects', href: '/dashboard/discover', icon: Globe },
      { label: 'Saved Projects', href: '/dashboard/saved-projects', icon: FolderKanban },
      { label: 'Compare Projects', href: '/dashboard/compare', icon: GitCompare },
    ],
  },
  {
    title: 'Engage',
    items: [
      { label: 'Verifier Directory', href: '/dashboard/verifiers', icon: Building2 },
      { label: 'Impact Dashboard', href: '/dashboard/impact', icon: BarChart3 },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { label: 'Organization Profile', href: '/dashboard/profile', icon: User },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'User Management', href: '/admin/users', icon: Users },
      { label: 'Verifications', href: '/admin/verifications', icon: ShieldCheck },
      { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
      { label: 'Evidence Review', href: '/admin/evidence', icon: Camera },
      { label: 'Land Ownership', href: '/admin/land-ownership', icon: Landmark },
      { label: 'Identity Review', href: '/admin/identity', icon: Fingerprint },
      { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Audit Center', href: '/admin/audit', icon: Shield },
      { label: 'Verification Conflicts', href: '/admin/conflicts', icon: AlertTriangle },
      { label: 'Security Events', href: '/admin/audit#security', icon: ShieldCheck },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: FileText },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Activity Logs', href: '/admin/logs', icon: ClipboardList },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Profile', href: '/admin/profile', icon: User },
    ],
  },
];

export function getNavForRole(role: AppRole | null): NavSection[] {
  switch (role) {
    case 'admin':
      return ADMIN_NAV;
    case 'verifier':
      return VERIFIER_NAV;
    case 'sustainability_partner':
      return PARTNER_NAV;
    case 'project_owner':
    default:
      return OWNER_NAV;
  }
}

export function getRoleLabel(role: AppRole | null): string {
  switch (role) {
    case 'verifier':
      return 'Verifier';
    case 'sustainability_partner':
      return 'Sustainability Partner';
    case 'admin':
      return 'Administrator';
    case 'project_owner':
    default:
      return 'Project Owner';
  }
}
