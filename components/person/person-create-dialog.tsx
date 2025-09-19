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
import { createPersonSchema, type CreatePersonForm } from "@/lib/validations";
import { useCreatePerson } from "@/hooks/queries";
import { PersonForm } from "./person-form";

export function PersonCreateDialog({
  children,
  onCreated,
}: {
  children: React.ReactNode;
  onCreated?: (person: import("@/lib/types").Person) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const createPerson = useCreatePerson();

  const form = useForm<CreatePersonForm>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      name: "",
      lastName: "",
      nickname: "",
      imagenProfileUrl: [],
      gender: undefined,
    },
  });

  const onSubmit = async (values: CreatePersonForm) => {
    try {
      const created = await createPerson.mutateAsync(values);
      toast({ title: "Success", description: "Person created successfully." });
      form.reset();
      setOpen(false);
      onCreated?.(created);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create person. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Person</DialogTitle>
        </DialogHeader>

        <PersonForm
          form={form}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
          submitLabel={createPerson.isPending ? "Creating..." : "Create"}
        />

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
