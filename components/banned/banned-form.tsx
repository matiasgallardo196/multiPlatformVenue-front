"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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

type BannedFormValues = {
  startingDate: string;
  endingDate: string;
  motive?: string;
  placeIds?: string[];
};

export function BannedForm({
  form,
  places,
}: {
  form: UseFormReturn<BannedFormValues>;
  places: Place[];
}) {
  const selectedPlaceIds = form.watch("placeIds") || [];

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

    if (end < start) {
      form.setError("endingDate" as any, {
        type: "validate",
        message: "End date must be after start date.",
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
    const current = new Set(selectedPlaceIds);
    if (checked) current.add(placeId);
    else current.delete(placeId);
    form.setValue("placeIds", Array.from(current), { shouldDirty: true });
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
                    // Immediate validation
                    const start = form.getValues("startingDate");
                    if (start && value && new Date(value) < new Date(start)) {
                      form.setError("endingDate", {
                        type: "validate",
                        message: "End date must be after start date.",
                      });
                    } else {
                      form.clearErrors("endingDate");
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
            <FormLabel>Motive (optional)</FormLabel>
            <FormControl>
              <Input placeholder="Reason" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
                  return (
                    <label
                      key={pl.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => togglePlace(pl.id, c)}
                      />
                      <span>{pl.name || "Unknown"}</span>
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
