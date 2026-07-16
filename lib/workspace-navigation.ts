import {
  LayoutDashboard,
  History,
  Landmark,
  ShieldCheck,
  FileText,
  Image,
  ClipboardList,
  BarChart3,
  Award,
  Settings,
  Map,
  Eye,
  FolderOpen,
  CheckCircle2,
  Camera,
  Sparkles,
  Gavel,
  MessageSquare,
  Calendar,
  TrendingUp,
  Activity,
  Building2,
  Download,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react';
import type { AppRole } from '@/lib/types';

export interface WorkspaceNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
}

export interface WorkspaceNavSection {
  title: string;
  items: WorkspaceNavItem[];
}

export const OWNER_WORKSPACE_NAV: WorkspaceNavSection[] = [
  {
    title: 'Project',
    items: [
      { label: 'Overview', href: '', icon: LayoutDashboard },
      { label: 'Project History', href: '/timeline', icon: History },
      { label: 'Land Ownership', href: '/land-ownership', icon: Landmark },
    ],
  },
  {
    title: 'Verification',
    items: [
      { label: 'Verification Center', href: '/verification', icon: ShieldCheck },
      { label: 'Documents', href: '/documents', icon: FileText },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Project Gallery', href: '/evidence', icon: Image },
      { label: 'Monitoring', href: '/monitoring', icon: ClipboardList },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Carbon Passport', href: '/passport', icon: Award },
      { label: 'Project Settings', href: '/settings', icon: Settings },
    ],
  },
];

export const VERIFIER_WORKSPACE_NAV: WorkspaceNavSection[] = [
  {
    title: 'Project',
    items: [
      { label: 'Overview', href: '', icon: LayoutDashboard },
      { label: 'Project History', href: '/timeline', icon: History },
    ],
  },
  {
    title: 'Verification',
    items: [
      { label: 'Verification Tasks', href: '/verification', icon: CheckCircle2 },
      { label: 'Evidence Review', href: '/evidence', icon: Eye },
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Land Ownership', href: '/land-ownership', icon: Landmark },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Monitoring Reports', href: '/monitoring', icon: ClipboardList },
      { label: 'AI Analysis', href: '/ai-review', icon: Sparkles },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Decision', href: '/decision', icon: Gavel },
      { label: 'Discussion', href: '/discussion', icon: MessageSquare },
      { label: 'Carbon Passport', href: '/passport', icon: Award },
    ],
  },
];

export const PARTNER_WORKSPACE_NAV: WorkspaceNavSection[] = [
  {
    title: 'Project',
    items: [
      { label: 'Overview', href: '', icon: LayoutDashboard },
      { label: 'Project History', href: '/timeline', icon: History },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Monitoring Projects', href: '/monitoring', icon: Activity },
      { label: 'Monitoring Reports', href: '/monitoring', icon: ClipboardList, badge: 'Read Only' },
      { label: 'Project Gallery', href: '/evidence', icon: Image },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Documents', href: '/documents', icon: FolderOpen },
      { label: 'Reports', href: '/reports', icon: FileBarChart },
      { label: 'Carbon Passport', href: '/passport', icon: Award },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Project Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function getWorkspaceNavForRole(role: AppRole | null): WorkspaceNavSection[] {
  switch (role) {
    case 'verifier':
      return VERIFIER_WORKSPACE_NAV;
    case 'sustainability_partner':
      return PARTNER_WORKSPACE_NAV;
    case 'project_owner':
    default:
      return OWNER_WORKSPACE_NAV;
  }
}
