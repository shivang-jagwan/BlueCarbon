'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/logo';
import { getNavForRole, getRoleLabel } from '@/lib/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useSidebar } from '@/components/providers/sidebar-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useAuth();
  const sections = getNavForRole(role);

  return (
    <nav className={cn('flex flex-col gap-6 py-4', collapsed ? 'px-2' : 'px-3')}>
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          {!collapsed && (
            <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'group relative flex items-center rounded-lg transition-all',
                  collapsed ? 'mx-auto h-10 w-10 justify-center' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-sidebar-foreground'
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function UserCard({ collapsed }: { collapsed: boolean }) {
  const { profile, signOut } = useAuth();
  if (!profile) return null;

  const initials = (profile.full_name || profile.email)
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className={cn('flex items-center rounded-lg px-2 py-2', collapsed ? 'justify-center' : 'gap-3')}>
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile.full_name || 'User'}</p>
              <p className="truncate text-xs text-muted-foreground">{getRoleLabel(profile.role)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out md:flex',
        collapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-3">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            collapsed ? 'w-0 opacity-0' : 'ml-1 w-auto opacity-100'
          )}
        >
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Logo />
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks collapsed={collapsed} />
      </div>
      <UserCard collapsed={collapsed} />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
