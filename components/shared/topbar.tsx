'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useNotifications } from '@/hooks/use-projects';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileSidebar } from '@/components/shared/sidebar';
import { GlobalSearch } from '@/components/shared/global-search';
import { getRoleLabel } from '@/lib/navigation';
import { Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export function Topbar() {
  const { profile, signOut } = useAuth();
  const { notifications } = useNotifications();
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <MobileSidebar />

      <div className="hidden items-center gap-2 md:flex">
        <span className="text-sm font-medium text-muted-foreground">
          {profile ? getRoleLabel(profile.role) : 'Workspace'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1 shrink-0">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          aria-label="Notifications"
          asChild
        >
          <Link href="/dashboard/notifications">
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px] justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </Link>
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 rounded-lg"
            >
              <Avatar className="h-7 w-7">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile?.full_name || ''} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline max-w-[120px] truncate">
                {profile?.full_name || 'User'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Avatar className="h-9 w-9">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile?.full_name || ''} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.full_name || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="h-4 w-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
