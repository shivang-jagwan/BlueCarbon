'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, ExternalLink, Shield, Ban, Trash2, Star, Users, Briefcase } from 'lucide-react';

const MOCK_ORGS = [
  {
    id: 'ORG-001',
    name: 'EcoTrust Auditors',
    type: 'verifier',
    subType: 'Third-Party Verification Agency',
    rating: 4.8,
    projects: 42,
    members: 15,
    status: 'approved',
  },
  {
    id: 'ORG-002',
    name: 'Green Earth NGO',
    type: 'verifier',
    subType: 'Environmental NGO',
    rating: 4.5,
    projects: 18,
    members: 8,
    status: 'approved',
  },
  {
    id: 'ORG-003',
    name: 'Oceanic IO',
    type: 'partner',
    subType: 'Technology',
    rating: 4.9,
    projects: 5,
    members: 3,
    status: 'approved',
  },
  {
    id: 'ORG-004',
    name: 'TechFlow Corp',
    type: 'partner',
    subType: 'Technology',
    rating: 4.2,
    projects: 2,
    members: 2,
    status: 'pending',
  },
  {
    id: 'ORG-005',
    name: 'AuditCorp',
    type: 'verifier',
    subType: 'Certified Carbon Auditor',
    rating: 4.1,
    projects: 88,
    members: 35,
    status: 'suspended',
  },
];

export default function OrganizationManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState('');

  const renderTable = (orgType: string) => {
    const filtered = MOCK_ORGS.filter(o => 
      o.type === orgType &&
      o.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Type / Industry</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Projects</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No organizations found.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{org.name}</span>
                    <span className="text-xs text-muted-foreground">{org.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{org.subType}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium">{org.rating.toFixed(1)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{org.projects}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{org.members}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={
                      org.status === 'approved' ? 'bg-success/10 text-success' : 
                      org.status === 'pending' ? 'bg-warning/10 text-warning' : 
                      'bg-destructive/10 text-destructive'
                    }
                  >
                    {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem><ExternalLink className="mr-2 h-4 w-4" /> View Profile</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {org.status === 'suspended' ? (
                        <DropdownMenuItem className="text-success"><Shield className="mr-2 h-4 w-4" /> Activate</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-warning"><Ban className="mr-2 h-4 w-4" /> Suspend</DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">Manage NGOs, Verifiers, and Sustainability Partners</p>
      </div>

      <div className="flex max-w-sm relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="verifier" className="w-full">
        <TabsList className="mb-4 bg-muted/50 p-1">
          <TabsTrigger value="verifier" className="rounded-sm">Verification Agencies & NGOs</TabsTrigger>
          <TabsTrigger value="partner" className="rounded-sm">Sustainability Partners</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardContent className="p-0">
            <TabsContent value="verifier" className="m-0 border-none">{renderTable('verifier')}</TabsContent>
            <TabsContent value="partner" className="m-0 border-none">{renderTable('partner')}</TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
