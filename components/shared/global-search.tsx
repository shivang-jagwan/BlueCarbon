'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  TreePine,
  Users,
  FileText,
  Award,
  MapPin,
  Clock,
  CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types';

type SearchResult = {
  id: string;
  type: 'project' | 'user' | 'report';
  title: string;
  subtitle: string;
  href: string;
};

export function GlobalSearch() {
  const { profile } = useAuth();
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Mobile search state
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileQuery, setMobileQuery] = React.useState('');
  const [mobileResults, setMobileResults] = React.useState<SearchResult[]>([]);
  const [mobileLoading, setMobileLoading] = React.useState(false);
  const mobileInputRef = React.useRef<HTMLInputElement>(null);

  const role = profile?.role;

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const searchResults: SearchResult[] = [];
      const q = query.trim().toLowerCase();

      try {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, location_name, status')
          .or(`name.ilike.%${q}%,location_name.ilike.%${q}%`)
          .in('status', ['registered', 'verified', 'active', 'completed', 'in_verification'])
          .limit(5);

        if (projects) {
          projects.forEach((p: any) => {
            searchResults.push({
              id: p.id,
              type: 'project',
              title: p.name,
              subtitle: p.location_name || p.status.replace(/_/g, ' '),
              href: `/dashboard/projects/${p.id}`,
            });
          });
        }

        if (role === 'admin') {
          const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, organization, role')
            .or(`full_name.ilike.%${q}%,organization.ilike.%${q}%`)
            .limit(5);

          if (users) {
            users.forEach((u: any) => {
              searchResults.push({
                id: u.id,
                type: 'user',
                title: u.full_name || 'Unknown User',
                subtitle: u.organization || u.role.replace(/_/g, ' '),
                href: `/admin/users`,
              });
            });
          }
        }
      } catch {
        // search errors are non-blocking
      }

      setResults(searchResults);
      setOpen(searchResults.length > 0);
      setSelectedIndex(0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, role]);

  // Mobile search
  React.useEffect(() => {
    if (mobileQuery.trim().length < 2) {
      setMobileResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setMobileLoading(true);
      const searchResults: SearchResult[] = [];
      const q = mobileQuery.trim().toLowerCase();

      try {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, location_name, status')
          .or(`name.ilike.%${q}%,location_name.ilike.%${q}%`)
          .in('status', ['registered', 'verified', 'active', 'completed', 'in_verification'])
          .limit(5);

        if (projects) {
          projects.forEach((p: any) => {
            searchResults.push({
              id: p.id,
              type: 'project',
              title: p.name,
              subtitle: p.location_name || p.status.replace(/_/g, ' '),
              href: `/dashboard/projects/${p.id}`,
            });
          });
        }

        if (role === 'admin') {
          const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, organization, role')
            .or(`full_name.ilike.%${q}%,organization.ilike.%${q}%`)
            .limit(5);

          if (users) {
            users.forEach((u: any) => {
              searchResults.push({
                id: u.id,
                type: 'user',
                title: u.full_name || 'Unknown User',
                subtitle: u.organization || u.role.replace(/_/g, ' '),
                href: `/admin/users`,
              });
            });
          }
        }
      } catch {}

      setMobileResults(searchResults);
      setMobileLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [mobileQuery, role]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].href);
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'project': return <TreePine className="h-4 w-4 text-emerald-600" />;
      case 'user': return <Users className="h-4 w-4 text-blue-600" />;
      case 'report': return <FileText className="h-4 w-4 text-amber-600" />;
      default: return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'project': return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Project</Badge>;
      case 'user': return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">User</Badge>;
      case 'report': return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Report</Badge>;
      default: return null;
    }
  };

  return (
    <>
      {/* Desktop: inline search */}
      <div ref={containerRef} className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search projects, users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-9 bg-muted/50 pl-9 border-0 focus-visible:ring-1 focus-visible:ring-primary"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Clock className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
        )}

        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
            <div className="max-h-80 overflow-y-auto p-1">
              {results.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    router.push(result.href);
                    setOpen(false);
                    setQuery('');
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                    i === selectedIndex ? 'bg-muted' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    {typeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  {typeBadge(result.type)}
                </button>
              ))}
            </div>
            <div className="border-t border-border px-3 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> to select</span>
              <span className="flex items-center gap-1">↑↓ to navigate</span>
              <span className="flex items-center gap-1">esc to close</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: search button + dialog */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 md:hidden ml-auto"
        onClick={() => { setMobileOpen(true); setTimeout(() => mobileInputRef.current?.focus(), 100); }}
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-base">Search</DialogTitle>
            <DialogDescription className="sr-only">Search projects, verifiers, and more</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={mobileInputRef}
                placeholder="Search projects, users..."
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mobileResults[selectedIndex]) {
                    router.push(mobileResults[selectedIndex].href);
                    setMobileOpen(false);
                    setMobileQuery('');
                  }
                }}
                className="h-11 pl-9"
                autoFocus
              />
            </div>
          </div>
          {mobileResults.length > 0 && (
            <div className="max-h-80 overflow-y-auto px-4 pb-4">
              {mobileResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    router.push(result.href);
                    setMobileOpen(false);
                    setMobileQuery('');
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    {typeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  {typeBadge(result.type)}
                </button>
              ))}
            </div>
          )}
          {mobileQuery.trim().length >= 2 && !mobileLoading && mobileResults.length === 0 && (
            <div className="px-4 pb-4 text-sm text-muted-foreground text-center">
              No results found
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
