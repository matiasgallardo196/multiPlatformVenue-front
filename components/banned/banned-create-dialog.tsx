"use client";

import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createBannedSchema, type CreateBannedForm } from "@/lib/validations";
import { useCreateBanned } from "@/hooks/queries";
import { useRouter } from "next/navigation";

export function BannedCreateDialog({
  children,
  incidentId,
  defaultPlaceId,
  redirectOnSuccess,
}: {
  children: React.ReactNode;
  incidentId: string;
  defaultPlaceId?: string;
  redirectOnSuccess?: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const createBanned = useCreateBanned();
  const router = useRouter();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const form = useForm<CreateBannedForm>({
    resolver: zodResolver(createBannedSchema),
    defaultValues: {
      incidentId,
      startingDate: today,
      endingDate: today,
      motive: "",
      placeIds: defaultPlaceId ? [defaultPlaceId] : [],
    },
  });

  const onSubmit = async (values: CreateBannedForm) => {
    try {
      const created = await createBanned.mutateAsync({
        incidentId: values.incidentId,
        startingDate: values.startingDate,
        endingDate: values.endingDate,
        motive: values.motive,
        placeIds:
          values.placeIds && values.placeIds.length > 0
            ? values.placeIds
            : undefined,
      });
      toast({ title: "Success", description: "Ban created successfully." });
      if (redirectOnSuccess) {
        setNavigating(true);
        router.push(`/banneds/${created.id}`);
      } else {
        setOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ban. Please try again.",
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
              name="startingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting date</FormLabel>
                  <FormControl>
                    <DateInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ending date</FormLabel>
                  <FormControl>
                    <DateInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motive (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Reason" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {defaultPlaceId && (
              <div className="text-xs text-muted-foreground">
                This ban will apply by default to the incident's place. You can
                add more places later in edit.
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={createBanned.isPending || navigating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBanned.isPending || navigating}
              >
                {createBanned.isPending
                  ? "Saving..."
                  : navigating
                  ? "Navigating..."
                  : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
