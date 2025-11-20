"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import type { UseFormReturn } from "react-hook-form";
import type { Place } from "@/lib/types";
import { add, intervalToDuration, isValid } from "date-fns";
import { MotiveSelect } from "./motive-select";

type BannedFormValues = {
  incidentNumber: number;
  startingDate: string;
  endingDate: string;
  motive: string[];
  peopleInvolved?: string;
  incidentReport: string;
  actionTaken?: string;
  policeNotified: boolean;
  policeNotifiedDate?: string;
  policeNotifiedTime?: string;
  policeNotifiedEvent?: string;
  placeIds: string[];
};

export function BannedForm({
  form,
  places,
  lockedPlaceId,
}: {
  form: UseFormReturn<BannedFormValues>;
  places: Place[];
  lockedPlaceId?: string;
}) {
  const selectedPlaceIds = form.watch("placeIds") || [];

  // Asegurar que lockedPlaceId esté siempre presente en placeIds
  useEffect(() => {
    if (!lockedPlaceId) return;
    if (!selectedPlaceIds.includes(lockedPlaceId)) {
      const next = Array.from(new Set([lockedPlaceId, ...selectedPlaceIds]));
      form.setValue("placeIds", next, { shouldDirty: true, shouldValidate: true });
    }
  }, [lockedPlaceId, selectedPlaceIds, form]);

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

  const togglePlace = (placeId: string, checked: boolean | string) => {
    // No permitir desmarcar el lugar bloqueado
    if (lockedPlaceId && placeId === lockedPlaceId && !checked) {
      return;
    }
    const current = new Set(selectedPlaceIds);
    if (checked) {
      current.add(placeId);
    } else {
      // No permitir desmarcar si es el último lugar seleccionado
      if (current.size <= 1) {
        return;
      }
      current.delete(placeId);
    }
    form.setValue("placeIds", Array.from(current), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

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
              form.setValue("endingDate", end.toISOString().slice(0, 10), {
                shouldDirty: true,
              });
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
              form.setValue("endingDate", end.toISOString().slice(0, 10), {
                shouldDirty: true,
              });
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
              form.setValue("endingDate", end.toISOString().slice(0, 10), {
                shouldDirty: true,
              });
            }}
          />
        </div>
      </div>
      <FormDescription>
        You can set the ban by duration (years, months, days) or by picking
        start and end dates. Both are synchronized.
      </FormDescription>

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
        name="incidentReport"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Incident Report</FormLabel>
            <FormControl>
              <Textarea
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

      {/* Police Notified Section */}
      <div className="space-y-4 border-t pt-4">
        <FormField
          control={form.control}
          name="policeNotified"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Police Notified</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {form.watch("policeNotified") && (
          <div className="space-y-4 pl-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="policeNotifiedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <DateInput
                        value={field.value || ""}
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
                name="policeNotifiedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="policeNotifiedEvent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter event description"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      <FormField
        control={form.control}
        name="placeIds"
        render={() => (
          <FormItem>
            <FormLabel>Places</FormLabel>
            <FormControl>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {places.map((pl) => {
                  const checked = selectedPlaceIds.includes(pl.id);
                  const isLocked = lockedPlaceId === pl.id;
                  const isLastPlace = checked && selectedPlaceIds.length === 1;
                  const isDisabled = isLocked || isLastPlace;
                  return (
                    <label
                      key={pl.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => togglePlace(pl.id, c)}
                        disabled={isDisabled}
                      />
                      <span className={isDisabled ? "text-muted-foreground" : ""}>
                        {pl.name || "Unknown"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
