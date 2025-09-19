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
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Incident } from "@/lib/types";
import { useIncidents } from "@/hooks/queries";

function getPersonLabel(inc: Incident): string {
  const p = inc.person;
  const full = [p?.name || "", p?.lastName || ""].filter(Boolean).join(" ");
  return full || p?.nickname || "Unknown";
}

function getIncidentLabel(inc: Incident): string {
  const idSuffix = inc.id?.slice?.(-6) || "";
  return `#${idSuffix} - ${getPersonLabel(inc)}`;
}

export function IncidentCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string | undefined;
  onChange: (incidentId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: allIncidents = [], isLoading } = useIncidents();

  const filteredIncidents = useMemo<Incident[]>(() => {
    const list: Incident[] = (allIncidents || []) as Incident[];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((inc: Incident) => {
      const personParts = [
        inc.person?.name || "",
        inc.person?.lastName || "",
        inc.person?.nickname || "",
      ]
        .filter(Boolean)
        .map((s) => s.toLowerCase());
      const fullName = [inc.person?.name || "", inc.person?.lastName || ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const idStr = inc.id?.toLowerCase?.() || "";
      const label = getIncidentLabel(inc).toLowerCase();
      return (
        personParts.some((s) => s.includes(q)) ||
        fullName.includes(q) ||
        idStr.includes(q) ||
        label.includes(q)
      );
    });
  }, [allIncidents, query]);

  const selectedIncident = useMemo<Incident | undefined>(
    () =>
      ((allIncidents || []) as Incident[]).find(
        (i: Incident) => i.id === value
      ),
    [allIncidents, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-60 justify-between"
          disabled={disabled}
        >
          {selectedIncident
            ? getIncidentLabel(selectedIncident)
            : value
            ? value
            : "Select incident"}
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
            placeholder="Search incidents..."
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
              {isLoading ? "Loading..." : "No incidents match your search."}
            </CommandEmpty>
            <CommandGroup>
              {filteredIncidents.map((inc: Incident) => {
                const label = getIncidentLabel(inc);
                return (
                  <CommandItem
                    key={inc.id}
                    value={inc.id}
                    onSelect={() => {
                      onChange(inc.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === inc.id ? "opacity-100" : "opacity-0"
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

export default IncidentCombobox;
