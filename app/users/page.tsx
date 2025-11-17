"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Trash2, Loader2 } from "lucide-react";
import { UserInviteDialog } from "@/components/user/user-invite-dialog";
import { UserCreateDialog } from "@/components/user/user-create-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";

type User = {
  id: string;
  userName: string;
  email: string;
  role: string;
  supabaseUserId: string | null;
};

export default function UsersPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { isHeadManager } = useAuth();

  // Fetch users list
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response;
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete user");
    },
  });

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) deleteMutation.mutate(userToDelete.id);
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "head-manager": "destructive",
      manager: "default",
      staff: "secondary",
    };
    return variants[role] || "default";
  };

  return (
    <RouteGuard requireHeadManager>
      <DashboardLayout>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <PageHeader
              title="User Management"
              description="Manage system users"
            >
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setInviteDialogOpen(true)} 
                  variant="outline" 
                  className="gap-2 w-full sm:w-auto"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Invite by Email</span>
                  <span className="sm:hidden">Invite</span>
                </Button>
                <Button 
                  onClick={() => setCreateDialogOpen(true)} 
                  className="gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Create User
                </Button>
              </div>
            </PageHeader>

            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Registered Users</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Total: {users?.length || 0} users</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {/* Mobile: Cards view */}
                <div className="md:hidden space-y-3">
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <Card key={user.id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm break-words">{user.userName}</p>
                              <p className="text-xs text-muted-foreground break-words mt-1">{user.email || "N/A"}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0 flex-shrink-0 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getRoleBadge(user.role)} className="text-xs">
                              {user.role}
                            </Badge>
                            {user.supabaseUserId ? (
                              <Badge variant="default" className="text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Pending</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No users registered
                    </div>
                  )}
                </div>

                {/* Desktop: Table view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm">User</TableHead>
                        <TableHead className="text-sm">Email</TableHead>
                        <TableHead className="text-sm">Role</TableHead>
                        <TableHead className="text-sm">Status</TableHead>
                        <TableHead className="text-right text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-sm break-words">{user.userName}</TableCell>
                          <TableCell className="text-sm break-words">{user.email || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadge(user.role)} className="text-xs">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.supabaseUserId ? (
                              <Badge variant="default" className="text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!users || users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                            No users registered
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Dialogs */}
            <UserInviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
            <UserCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete user?</AlertDialogTitle>
                  <AlertDialogDescription className="break-words">
                    Are you sure you want to delete user <strong>{userToDelete?.userName}</strong>? This action cannot be
                    undone and will remove the user from both the database and Supabase.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DashboardLayout>
    </RouteGuard>
  );
}

