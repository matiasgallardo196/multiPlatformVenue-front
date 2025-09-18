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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updatePlaceSchema, type UpdatePlaceForm } from "@/lib/validations";
import { usePlace, useUpdatePlace } from "@/hooks/queries";

export function PlaceEditDialog({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: place } = usePlace(id);
  const updatePlace = useUpdatePlace();

  const form = useForm<UpdatePlaceForm>({
    resolver: zodResolver(updatePlaceSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (place) {
      form.reset({ name: place.name || "" });
    }
  }, [place, form]);

  const onSubmit = async (values: UpdatePlaceForm) => {
    try {
      await updatePlace.mutateAsync({ id, data: { name: values.name } });
      toast({ title: "Success", description: "Place updated successfully." });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update place. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Place</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Place name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlace.isPending}>
                {updatePlace.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
