'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Activity, UserPlus, FolderKanban, Award, DollarSign, ShieldCheck } from 'lucide-react';

const MOCK_LOGS = [
  {
    id: 'LOG-001',
    user: 'Eleanor Pena',
    action: 'Project Created',
    details: 'Created project "Coastal Mangroves"',
    type: 'project',
    timestamp: '2026-07-10 14:32:01',
  },
  {
    id: 'LOG-002',
    user: 'Admin',
    action: 'User Approved',
    details: 'Approved Verifier "EcoTrust Auditors"',
    type: 'auth',
    timestamp: '2026-07-10 13:15:22',
  },
  {
    id: 'LOG-003',
    user: 'Ralph Edwards',
    action: 'Verification Requested',
    details: 'Requested verification for PRJ-102',
    type: 'verification',
    timestamp: '2026-07-10 11:45:00',
  },
  {
    id: 'LOG-004',
    user: 'Bessie Cooper',
    action: 'Funding Approved',
    details: 'Pledged $50,000 to PRJ-100',
    type: 'funding',
    timestamp: '2026-07-10 09:20:11',
  },
  {
    id: 'LOG-005',
    user: 'Admin',
    action: 'Carbon Passport Issued',
    details: 'Issued 5,000 credits to PRJ-100',
    type: 'passport',
    timestamp: '2026-07-09 16:30:45',
  },
  {
    id: 'LOG-006',
    user: 'Guy Hawkins',
    action: 'User Registered',
    details: 'Registered as Project Owner',
    type: 'auth',
    timestamp: '2026-07-09 10:11:02',
  },
];

const getIconForType = (type: string) => {
  switch (type) {
    case 'auth': return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'project': return <FolderKanban className="h-4 w-4 text-primary" />;
    case 'verification': return <ShieldCheck className="h-4 w-4 text-warning" />;
    case 'funding': return <DollarSign className="h-4 w-4 text-success" />;
    case 'passport': return <Award className="h-4 w-4 text-purple-500" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const filteredLogs = MOCK_LOGS.filter((log) => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">System Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Immutable audit trail of all platform events</p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 sm:py-4 border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user or event details..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="auth">Auth & Registration</SelectItem>
                  <SelectItem value="project">Project Management</SelectItem>
                  <SelectItem value="verification">Verifications</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="passport">Carbon Passports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{log.user}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                          {getIconForType(log.type)}
                        </div>
                        <span className="text-sm">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{log.details}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
