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
import { MotiveSelect } from "./motive-select";

export function BannedCreateDialog({
  children,
  personId,
  defaultPlaceId,
  redirectOnSuccess,
}: {
  children: React.ReactNode;
  personId: string;
  defaultPlaceId?: string;
  redirectOnSuccess?: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const createBanned = useCreateBanned();
  const router = useRouter();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const form = useForm<CreateBannedForm>({
    resolver: zodResolver(createBannedSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      personId,
      incidentNumber: undefined as any,
      startingDate: today,
      endingDate: tomorrow,
      motive: [],
      peopleInvolved: "",
      incidentReport: "",
      actionTaken: "",
      policeNotified: false,
      policeNotifiedDate: "",
      policeNotifiedTime: "",
      policeNotifiedEvent: "",
      placeIds: defaultPlaceId ? [defaultPlaceId] : [],
    },
  });

  const onSubmit = async (values: CreateBannedForm) => {
    try {
      const created = await createBanned.mutateAsync({
        personId: values.personId,
        incidentNumber: values.incidentNumber,
        startingDate: values.startingDate,
        endingDate: values.endingDate,
        motive: values.motive,
        peopleInvolved:
          values.peopleInvolved && values.peopleInvolved.trim().length > 0
            ? values.peopleInvolved.trim()
            : undefined,
        incidentReport:
          values.incidentReport && values.incidentReport.trim().length > 0
            ? values.incidentReport.trim()
            : undefined,
        actionTaken:
          values.actionTaken && values.actionTaken.trim().length > 0
            ? values.actionTaken.trim()
            : undefined,
        policeNotified: values.policeNotified,
        policeNotifiedDate:
          values.policeNotified && values.policeNotifiedDate
            ? values.policeNotifiedDate
            : undefined,
        policeNotifiedTime:
          values.policeNotified && values.policeNotifiedTime
            ? values.policeNotifiedTime
            : undefined,
        policeNotifiedEvent:
          values.policeNotified && values.policeNotifiedEvent
            ? values.policeNotifiedEvent.trim()
            : undefined,
        placeIds: values.placeIds,
      });
      toast({ title: "Success", description: "Ban created successfully." });
      if (redirectOnSuccess) {
        setNavigating(true);
        router.push(`/banneds/${created.id}`);
      } else {
        setOpen(false);
      }
    } catch (error: any) {
      const msg = (error && error.message) ? String(error.message) : "Failed to create ban. Please try again.";
      const isActiveConflict = /active ban/i.test(msg);
      const isIncidentDuplicate = /incident number/i.test(msg);
      toast({
        title: isIncidentDuplicate
          ? "Incident number already exists"
          : isActiveConflict
          ? "Ban already active"
          : "Error",
        description: msg,
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

    // Validation: at least 1 day
    if (end <= start) {
      form.setError("endingDate" as any, {
        type: "validate",
        message: "Ban must be at least 1 day long.",
      });
      // Don't update duration fields if end date is before start date
      return;
    }

    form.clearErrors("endingDate" as any);
    const dur = intervalToDuration({ start, end });
    // Ensure we don't set negative values
    setDurationYears(String(Math.max(0, dur.years || 0)));
    setDurationMonths(String(Math.max(0, dur.months || 0)));
    setDurationDays(String(Math.max(0, dur.days || 0)));
  }, [
    startingDate,
    endingDate,
    durationYears,
    durationMonths,
    durationDays,
    form,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle>Create Ban</DialogTitle>
          <Form {...form}>
            <FormField
              control={form.control}
              name="incidentNumber"
              render={({ field }) => (
                <FormItem className="w-48">
                  <FormLabel className="text-sm">Incident N°</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter incident number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? undefined : Number(value));
                      }}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </Form>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 pr-2 -mr-2 custom-scrollbar">
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
                  <div className="min-h-5">
                    <FormMessage />
                  </div>
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
                      onChange={(value) => {
                        field.onChange(value);
                    // Immediate validation: at least 1 day
                        const start = form.getValues("startingDate");
                    if (start && value) {
                      const s = new Date(start);
                      const e = new Date(value);
                      if (e <= s) {
                        form.setError("endingDate", {
                          type: "validate",
                          message: "Ban must be at least 1 day long.",
                        });
                      } else {
                        form.clearErrors("endingDate");
                      }
                    }
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <div className="min-h-5">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motive</FormLabel>
                  <FormControl>
                    <MotiveSelect
                      value={field.value || []}
                      onChange={(val) => {
                        form.setValue("motive", val, {
                          shouldDirty: true,
                          shouldValidate: true,
                          shouldTouch: true,
                        });
                        if (val && val.length > 0) {
                          form.clearErrors("motive");
                        }
                      }}
                      onBlur={field.onBlur}
                      error={!!form.formState.errors.motive}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="peopleInvolved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>People Involved</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter people involved"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incidentReport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Report</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter incident report"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actionTaken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Taken</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter action taken"
                      {...field}
                      value={field.value || ""}
                    />
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
                    // Prevent negative numbers
                    if (val && parseInt(val, 10) < 0) return;
                    setDurationYears(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const years = parseInt(val || "0", 10) || 0;
                    const months = parseInt(durationMonths || "0", 10) || 0;
                    const days = parseInt(durationDays || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    // Ensure end date is not before start date
                    if (end < base) return;
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
                    // Prevent negative numbers
                    if (val && parseInt(val, 10) < 0) return;
                    setDurationMonths(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const years = parseInt(durationYears || "0", 10) || 0;
                    const months = parseInt(val || "0", 10) || 0;
                    const days = parseInt(durationDays || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    // Ensure end date is not before start date
                    if (end < base) return;
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
                    // Prevent negative numbers
                    if (val && parseInt(val, 10) < 0) return;
                    setDurationDays(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const years = parseInt(durationYears || "0", 10) || 0;
                    const months = parseInt(durationMonths || "0", 10) || 0;
                    const days = parseInt(val || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    // Ensure end date is not before start date
                    if (end < base) return;
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
                A default place has been pre-selected. You can add more places
                later in edit.
              </div>
            )}
            </form>
          </Form>
        </div>

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
            type="button"
            onClick={form.handleSubmit(onSubmit)}
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
      </DialogContent>
    </Dialog>
  );
}
