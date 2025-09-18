"use client";

import { useEffect, useState } from "react";
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
import {
  updateIncidentSchema,
  type UpdateIncidentForm,
} from "@/lib/validations";
import {
  useIncident,
  useUpdateIncident,
  usePersons,
  usePlaces,
} from "@/hooks/queries";
import { IncidentForm } from "./incident-form";

export function IncidentEditDialog({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: incident } = useIncident(id);
  const updateIncident = useUpdateIncident();
  const { data: persons = [] } = usePersons();
  const { data: places = [] } = usePlaces();

  const form = useForm<UpdateIncidentForm>({
    resolver: zodResolver(updateIncidentSchema),
    defaultValues: { personId: "", placeId: "", details: "", photoBook: [] },
  });

  useEffect(() => {
    if (incident) {
      form.reset({
        personId: incident.person?.id || "",
        placeId: incident.place?.id || "",
        details: incident.details || "",
        photoBook: incident.photoBook || [],
      });
    }
  }, [incident, form]);

  const onSubmit = async (values: UpdateIncidentForm) => {
    try {
      await updateIncident.mutateAsync({ id, data: values });
      toast({
        title: "Success",
        description: "Incident updated successfully.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update incident.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Incident</DialogTitle>
        </DialogHeader>

        <IncidentForm
          form={form as any}
          persons={persons}
          places={places}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
          submitLabel={updateIncident.isPending ? "Saving..." : "Save"}
        />

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
