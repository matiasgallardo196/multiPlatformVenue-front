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
import { useCreateBanned, usePlaces } from "@/hooks/queries";
import { PersonCombobox } from "@/components/person/person-combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BannedCreateFullDialog({
  children,
  redirectOnSuccess = false,
}: {
  children: React.ReactNode;
  redirectOnSuccess?: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const createBanned = useCreateBanned();
  const { data: places = [] } = usePlaces();
  const router = useRouter();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const form = useForm<CreateBannedForm>({
    resolver: zodResolver(createBannedSchema),
    mode: "onChange",
    defaultValues: {
      personId: "",
      startingDate: today,
      endingDate: today,
      motive: "",
      placeIds: [],
    },
  });

  const onSubmit = async (values: CreateBannedForm) => {
    try {
      const created = await createBanned.mutateAsync(values);
      toast({ title: "Success", description: "Ban created successfully." });
      if (redirectOnSuccess) {
        router.push(`/banneds/${created.id}`);
      } else {
        setOpen(false);
      }
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
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <FormControl>
                    <PersonCombobox
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
