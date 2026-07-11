'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MobileSidebar } from '@/components/shared/sidebar';
import { getRoleLabel } from '@/lib/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <MobileSidebar />

      <div className="hidden items-center gap-2 md:flex">
        <span className="text-sm font-medium text-muted-foreground">
          {profile ? getRoleLabel(profile.role) : 'Workspace'}
        </span>
      </div>

      <div className="relative ml-auto hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects, documents, reports..."
          className="h-9 bg-muted/50 pl-9 border-0 focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 md:ml-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <Badge
            variant="destructive"
            className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px] justify-center"
          >
            3
          </Badge>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </Button>
      </div>
    </header>
  );
}
