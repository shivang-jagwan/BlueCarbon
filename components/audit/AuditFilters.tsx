'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

export interface AuditFiltersState {
  severity: string;
  actionType: string;
  role: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface AuditFiltersProps {
  filters: AuditFiltersState;
  onFilterChange: (filters: AuditFiltersState) => void;
}

export function AuditFilters({ filters, onFilterChange }: AuditFiltersProps) {
  const update = (key: keyof AuditFiltersState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by user, resource, or reason..."
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.severity} onValueChange={(v) => update('severity', v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="security">Security</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.role} onValueChange={(v) => update('role', v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="project_owner">Owner</SelectItem>
            <SelectItem value="verifier">Verifier</SelectItem>
            <SelectItem value="sustainability_partner">Partner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder="From"
          value={filters.dateFrom}
          onChange={(e) => update('dateFrom', e.target.value)}
          className="w-[150px]"
        />
        <Input
          type="date"
          placeholder="To"
          value={filters.dateTo}
          onChange={(e) => update('dateTo', e.target.value)}
          className="w-[150px]"
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => onFilterChange({ severity: '', actionType: '', role: '', dateFrom: '', dateTo: '', search: '' })}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
