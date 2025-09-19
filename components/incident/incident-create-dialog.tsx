"use client";

import { useState } from "react";
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
  createIncidentSchema,
  type CreateIncidentForm,
} from "@/lib/validations";
import { useCreateIncident, usePersons, usePlaces } from "@/hooks/queries";
import { IncidentForm } from "./incident-form";
import { useRouter } from "next/navigation";

export function IncidentCreateDialog({
  children,
  lockedPersonId,
}: {
  children: React.ReactNode;
  lockedPersonId?: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const createIncident = useCreateIncident();
  const { data: persons = [] } = usePersons();
  const { data: places = [] } = usePlaces();
  const router = useRouter();

  const form = useForm<CreateIncidentForm>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: {
      personId: lockedPersonId || "",
      placeId: "",
      details: "",
      photoBook: [],
    },
  });

  const onSubmit = async (values: CreateIncidentForm) => {
    try {
      const created = await createIncident.mutateAsync(values);
      toast({
        title: "Success",
        description: "Incident created successfully.",
      });
      form.reset({ personId: "", placeId: "", details: "", photoBook: [] });
      setNavigating(true);
      router.push(`/incidents/${created.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create incident.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Incident</DialogTitle>
        </DialogHeader>

        <IncidentForm
          form={form as any}
          persons={persons}
          places={places}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
          submitLabel={
            createIncident.isPending
              ? "Creating..."
              : navigating
              ? "Navigating..."
              : "Create"
          }
          lockedPersonId={lockedPersonId}
          isSubmitting={createIncident.isPending || navigating}
        />

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
