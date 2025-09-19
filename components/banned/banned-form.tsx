"use client";

import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { add, intervalToDuration, isValid } from "date-fns";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import type { UseFormReturn } from "react-hook-form";
import type { Place } from "@/lib/types";

type BannedFormValues = {
  startingDate: string;
  endingDate: string;
  motive?: string;
  placeIds?: string[];
  durationYears?: string;
  durationMonths?: string;
  durationDays?: string;
};

export function BannedForm({
  form,
  places,
}: {
  form: UseFormReturn<BannedFormValues>;
  places: Place[];
}) {
  const selectedPlaceIds = form.watch("placeIds") || [];

  const togglePlace = (placeId: string, checked: boolean | string) => {
    const current = new Set(selectedPlaceIds);
    if (checked) current.add(placeId);
    else current.delete(placeId);
    form.setValue("placeIds", Array.from(current), { shouldDirty: true });
  };

  // When dates change, update duration fields
  const startingDate = form.watch("startingDate");
  const endingDate = form.watch("endingDate");
  if (startingDate && endingDate) {
    const start = new Date(startingDate);
    const end = new Date(endingDate);
    if (isValid(start) && isValid(end)) {
      const yearsNum =
        parseInt(form.getValues("durationYears") || "0", 10) || 0;
      const monthsNum =
        parseInt(form.getValues("durationMonths") || "0", 10) || 0;
      const daysNum = parseInt(form.getValues("durationDays") || "0", 10) || 0;
      const hasPositiveDuration = yearsNum + monthsNum + daysNum > 0;

      if (end < start && !hasPositiveDuration) {
        form.setError("endingDate" as any, {
          type: "validate",
          message:
            "Provide a positive duration or pick an end date after start.",
        });
      } else {
        form.clearErrors("endingDate" as any);
        const dur = intervalToDuration({ start, end });
        const years = String(dur.years || 0);
        const months = String(dur.months || 0);
        const days = String(dur.days || 0);
        if (form.getValues("durationYears") !== years)
          form.setValue("durationYears", years, { shouldDirty: true });
        if (form.getValues("durationMonths") !== months)
          form.setValue("durationMonths", months, { shouldDirty: true });
        if (form.getValues("durationDays") !== days)
          form.setValue("durationDays", days, { shouldDirty: true });
      }
    }
  }

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
      </div>

      {/* Duration inputs */}
      <div className="grid grid-cols-3 gap-2">
        <FormField
          control={form.control}
          name="durationYears"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const months =
                      parseInt(form.getValues("durationMonths") || "0", 10) ||
                      0;
                    const days =
                      parseInt(form.getValues("durationDays") || "0", 10) || 0;
                    const years = parseInt(val || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    const iso = end.toISOString().slice(0, 10);
                    form.setValue("endingDate", iso, { shouldDirty: true });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="durationMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Months</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const years =
                      parseInt(form.getValues("durationYears") || "0", 10) || 0;
                    const days =
                      parseInt(form.getValues("durationDays") || "0", 10) || 0;
                    const months = parseInt(val || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    const iso = end.toISOString().slice(0, 10);
                    form.setValue("endingDate", iso, { shouldDirty: true });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="durationDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val);
                    const s = form.getValues("startingDate");
                    if (!s) return;
                    const base = new Date(s);
                    if (!isValid(base)) return;
                    const years =
                      parseInt(form.getValues("durationYears") || "0", 10) || 0;
                    const months =
                      parseInt(form.getValues("durationMonths") || "0", 10) ||
                      0;
                    const days = parseInt(val || "0", 10) || 0;
                    const end = add(base, { years, months, days });
                    const iso = end.toISOString().slice(0, 10);
                    form.setValue("endingDate", iso, { shouldDirty: true });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
