"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { updatePersonSchema, type UpdatePersonForm } from "@/lib/validations";
import { usePerson, useUpdatePerson } from "@/hooks/queries";
import { PersonForm } from "./person-form";

export function PersonEditDialog({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: person } = usePerson(id);
  const updatePerson = useUpdatePerson();

  const form = useForm<UpdatePersonForm>({
    resolver: zodResolver(updatePersonSchema),
    defaultValues: {
      name: "",
      lastName: "",
      nickname: "",
      imagenProfileUrl: [],
      gender: undefined,
    },
  });

  useEffect(() => {
    if (person) {
      form.reset({
        name: person.name || "",
        lastName: person.lastName || "",
        nickname: person.nickname || "",
        imagenProfileUrl: person.imagenProfileUrl || [],
        gender: person.gender || undefined,
      });
    }
  }, [person, form]);

  const onSubmit = async (values: UpdatePersonForm) => {
    try {
      await updatePerson.mutateAsync({ id, data: values });
      toast({ title: "Success", description: "Person updated successfully." });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update person. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Person</DialogTitle>
          <DialogDescription>
            Update the person's personal information and details.
          </DialogDescription>
        </DialogHeader>

        <PersonForm
          form={form}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
          submitLabel={updatePerson.isPending ? "Saving..." : "Save"}
        />

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
