'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, MoreHorizontal, Shield, Ban, Trash2, Key, Edit, Eye, Loader2 } from 'lucide-react';
import { getRoleLabel } from '@/lib/navigation';
import { AppRole, Profile, ApprovalStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      toast.error('Failed to load users: ' + error.message);
    } else {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: ApprovalStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: newStatus })
        .eq('id', userId);
        
      if (error) throw error;
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredUsers = users.filter((user) => {
    const nameStr = (user.full_name || user.organization || '').toLowerCase();
    const emailStr = (user.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = nameStr.includes(search) || emailStr.includes(search);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.approval_status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage and oversee all registered accounts</p>
        </div>
        <Button variant="outline" onClick={fetchUsers}>
          <Download className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 sm:py-4 border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="project_owner">Project Owners</SelectItem>
                  <SelectItem value="verifier">Verifiers</SelectItem>
                  <SelectItem value="sustainability_partner">Partners</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                      Loading users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const displayName = user.full_name || user.organization || 'Unnamed User';
                  const initials = displayName.split(' ').map((n) => n[0]).join('').substring(0, 2);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium uppercase">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{displayName}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getRoleLabel(user.role)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            user.approval_status === 'approved' ? 'bg-success/10 text-success hover:bg-success/20' : 
                            user.approval_status === 'pending' ? 'bg-warning/10 text-warning hover:bg-warning/20' : 
                            'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          }
                        >
                          {user.approval_status.charAt(0).toUpperCase() + user.approval_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            user.kyc_status === 'verified' ? 'border-success/50 text-success' : 
                            user.kyc_status === 'submitted' ? 'border-warning/50 text-warning' : 
                            'border-destructive/50 text-destructive'
                          }
                        >
                          {user.kyc_status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Profile</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.approval_status === 'pending' || user.approval_status === 'suspended' || user.approval_status === 'rejected' ? (
                              <DropdownMenuItem className="text-success" onClick={() => handleStatusChange(user.id, 'approved')}>
                                <Shield className="mr-2 h-4 w-4" /> Approve
                              </DropdownMenuItem>
                            ) : null}
                            {user.approval_status === 'approved' ? (
                              <DropdownMenuItem className="text-warning" onClick={() => handleStatusChange(user.id, 'suspended')}>
                                <Ban className="mr-2 h-4 w-4" /> Suspend
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
