"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  // Obtener lista de usuarios
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response;
    },
  });

  // Mutación para eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado exitosamente");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error al eliminar usuario");
    },
  });

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
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
          <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">
                Administra los usuarios del sistema
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setInviteDialogOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Invitar por Email
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Usuario
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios Registrados</CardTitle>
              <CardDescription>
                Total: {users?.length || 0} usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.userName}
                      </TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadge(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.supabaseUserId ? (
                          <Badge variant="default">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!users || users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Diálogos */}
          <UserInviteDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
          />

          <UserCreateDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
          />

          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de eliminar al usuario{" "}
                  <strong>{userToDelete?.userName}</strong>? Esta acción no se
                  puede deshacer y eliminará el usuario tanto de la base de
                  datos como de Supabase.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
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
