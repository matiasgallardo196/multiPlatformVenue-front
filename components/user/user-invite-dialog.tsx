"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PlaceCombobox } from "@/components/place/place-combobox";

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  userName: z.string().min(3, "Username must be at least 3 characters"),
  role: z.enum(["manager", "staff", "head-manager"]),
  placeId: z.string().min(1, "Venue is required"),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserInviteDialog({ open, onOpenChange }: UserInviteDialogProps) {
  const queryClient = useQueryClient();
  const { isAdmin, user } = useAuth();

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", userName: "", role: "staff", placeId: "" },
  });

  // Para HEAD_MANAGER: preseleccionar su placeId
  useEffect(() => {
    if (!isAdmin && user?.placeId) {
      form.setValue("placeId", user.placeId);
    }
  }, [isAdmin, user?.placeId, form]);

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteForm) => {
      return await api.post("/users/invite", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Invitation sent successfully");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to send invitation");
    },
  });

  const onSubmit = (data: InviteForm) => {
    inviteMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite User by Email</DialogTitle>
          <DialogDescription className="break-words">
            The user will receive an email with a link to set their password
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" type="email" className="text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" className="text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="head-manager">Head Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Define the user's permissions in the system</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="placeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <PlaceCombobox
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!isAdmin}
                      placeholder={!isAdmin && user?.placeId ? "Your venue (locked)" : "Select venue"}
                    />
                  </FormControl>
                  <FormDescription>
                    {isAdmin 
                      ? "Select the venue where this user will work" 
                      : "Users are assigned to your venue"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending} className="w-full sm:w-auto">
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
