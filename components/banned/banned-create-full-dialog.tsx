"use client";

import { useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BannedForm } from "./banned-form";
import { createBannedSchema, type CreateBannedForm } from "@/lib/validations";
import { useCreateBanned, useIncidents, usePlaces } from "@/hooks/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IncidentCombobox } from "@/components/incident/incident-combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function BannedCreateFullDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const createBanned = useCreateBanned();
  const { data: incidents = [] } = useIncidents();
  const { data: places = [] } = usePlaces();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const form = useForm<CreateBannedForm>({
    resolver: zodResolver(createBannedSchema),
    mode: "onChange",
    defaultValues: {
      incidentId: "",
      startingDate: today,
      endingDate: today,
      motive: "",
      placeIds: [],
    },
  });

  const onSubmit = async (values: CreateBannedForm) => {
    try {
      await createBanned.mutateAsync(values);
      toast({ title: "Success", description: "Ban created successfully." });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ban.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Ban</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="incidentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident</FormLabel>
                  <FormControl>
                    <IncidentCombobox
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <BannedForm form={form as any} places={places} />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || createBanned.isPending}
              >
                {createBanned.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
