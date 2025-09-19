"use client";

import { useEffect, useMemo, useState } from "react";
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
import { FormDescription } from "@/components/ui/form";
import { createBannedSchema, type CreateBannedForm } from "@/lib/validations";
import { useCreateBanned } from "@/hooks/queries";
import { useRouter } from "next/navigation";
import { add, intervalToDuration, isValid } from "date-fns";

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
    mode: "onChange",
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

  // Local duration UI state (not sent to backend)
  const [durationYears, setDurationYears] = useState<string>("");
  const [durationMonths, setDurationMonths] = useState<string>("");
  const [durationDays, setDurationDays] = useState<string>("");

  // Sync: dates -> durations and validate
  const startingDate = form.watch("startingDate");
  const endingDate = form.watch("endingDate");

  useEffect(() => {
    if (!startingDate || !endingDate) return;
    const start = new Date(startingDate);
    const end = new Date(endingDate);
    if (!isValid(start) || !isValid(end)) return;
    const yearsNum = parseInt(durationYears || "0", 10) || 0;
    const monthsNum = parseInt(durationMonths || "0", 10) || 0;
    const daysNum = parseInt(durationDays || "0", 10) || 0;
    const hasPositiveDuration = yearsNum + monthsNum + daysNum > 0;

    if (end < start && !hasPositiveDuration) {
      form.setError("endingDate" as any, {
        type: "validate",
        message: "Provide a positive duration or pick an end date after start.",
      });
      return;
    }

    form.clearErrors("endingDate" as any);
    const dur = intervalToDuration({ start, end });
    setDurationYears(String(dur.years || 0));
    setDurationMonths(String(dur.months || 0));
    setDurationDays(String(dur.days || 0));
  }, [startingDate, endingDate]);

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

            {/* Duration inputs */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <FormLabel>Years</FormLabel>
                <Input
                  type="number"
                  min={0}
                  value={durationYears}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDurationYears(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const years = parseInt(val || "0", 10) || 0;
                    const months = parseInt(durationMonths || "0", 10) || 0;
                    const days = parseInt(durationDays || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    form.setValue(
                      "endingDate",
                      end.toISOString().slice(0, 10),
                      {
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </div>
              <div>
                <FormLabel>Months</FormLabel>
                <Input
                  type="number"
                  min={0}
                  value={durationMonths}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDurationMonths(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const years = parseInt(durationYears || "0", 10) || 0;
                    const months = parseInt(val || "0", 10) || 0;
                    const days = parseInt(durationDays || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    form.setValue(
                      "endingDate",
                      end.toISOString().slice(0, 10),
                      {
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </div>
              <div>
                <FormLabel>Days</FormLabel>
                <Input
                  type="number"
                  min={0}
                  value={durationDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDurationDays(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const years = parseInt(durationYears || "0", 10) || 0;
                    const months = parseInt(durationMonths || "0", 10) || 0;
                    const days = parseInt(val || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    form.setValue(
                      "endingDate",
                      end.toISOString().slice(0, 10),
                      {
                        shouldDirty: true,
                      }
                    );
                  }}
                />
              </div>
            </div>
            <FormDescription>
              You can set the ban by duration (years, months, days) or by
              picking start and end dates. Both are synchronized.
            </FormDescription>

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
                disabled={
                  createBanned.isPending ||
                  navigating ||
                  !form.formState.isValid
                }
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
