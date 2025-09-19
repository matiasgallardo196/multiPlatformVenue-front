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
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/types";
import { usePersons } from "@/hooks/queries";
import { PersonCreateDialog } from "@/components/person/person-create-dialog";

export function PersonCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string | undefined;
  onChange: (personId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: allPersons = [], isLoading } = usePersons();

  const filteredPersons = useMemo<Person[]>(() => {
    const list = allPersons || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const parts = [p.name || "", p.lastName || "", p.nickname || ""]
        .filter(Boolean)
        .map((s) => s.toLowerCase());
      const fullName = [p.name || "", p.lastName || ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return parts.some((s) => s.includes(q)) || fullName.includes(q);
    });
  }, [allPersons, query]);

  const selectedPerson = useMemo<Person | undefined>(
    () => (allPersons || []).find((p) => p.id === value),
    [allPersons, value]
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
          {selectedPerson
            ? [selectedPerson.name, selectedPerson.lastName]
                .filter(Boolean)
                .join(" ") ||
              selectedPerson.nickname ||
              "Unknown"
            : value
            ? value
            : "Select person"}
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
            placeholder="Search persons..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty>
              {isLoading ? "Loading..." : "No persons match your search."}
            </CommandEmpty>
            <CommandGroup>
              {filteredPersons.map((p) => {
                const label =
                  [p.name, p.lastName].filter(Boolean).join(" ") ||
                  p.nickname ||
                  "Unknown";
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
              <PersonCreateDialog
                onCreated={(person) => {
                  onChange(person.id);
                  setOpen(false);
                }}
              >
                <button type="button" className="w-full text-left">
                  <CommandItem>
                    <Plus className="mr-2 h-4 w-4" /> Create new person
                  </CommandItem>
                </button>
              </PersonCreateDialog>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default PersonCombobox;
