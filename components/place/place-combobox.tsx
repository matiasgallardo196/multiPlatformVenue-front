"use client";

import { useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/types";
import { usePlaces } from "@/hooks/queries";

interface PlaceComboboxProps {
  value: string | undefined;
  onChange: (placeId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PlaceCombobox({
  value,
  onChange,
  disabled,
  placeholder = "Select venue",
}: PlaceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: placesData, isLoading } = usePlaces({ page: 1, limit: 100 }, { enabled: open || !!value });
  const allPlaces = placesData?.items || [];

  const filteredPlaces = useMemo<Place[]>(() => {
    const list: Place[] = allPlaces;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p: Place) => {
      const name = (p.name || "").toLowerCase();
      const city = (p.city || "").toLowerCase();
      return name.includes(q) || city.includes(q);
    });
  }, [allPlaces, query]);

  const selectedPlace = useMemo<Place | undefined>(
    () => allPlaces.find((p: Place) => p.id === value),
    [allPlaces, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selectedPlace
              ? `${selectedPlace.name}${selectedPlace.city ? ` - ${selectedPlace.city}` : ""}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="p-0 w-[--radix-popover-trigger-width]"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search venues..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList
            className="max-h-64 overflow-y-auto"
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            <CommandEmpty>
              {isLoading ? "Loading..." : "No venues match your search."}
            </CommandEmpty>
            <CommandGroup>
              {filteredPlaces.map((p: Place) => {
                const label = `${p.name}${p.city ? ` - ${p.city}` : ""}`;
                return (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === p.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default PlaceCombobox;
