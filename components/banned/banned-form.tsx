"use client";

import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
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
