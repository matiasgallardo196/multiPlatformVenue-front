"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActiveFilter = {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
};

interface ActiveFiltersChipsProps {
  filters: ActiveFilter[];
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFiltersChips({ filters, onClearAll, className }: ActiveFiltersChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span className="text-xs">{filter.label}: {filter.value}</span>
          <button
            type="button"
            onClick={filter.onRemove}
            className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {onClearAll && filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 text-xs px-2"
        >
          Limpiar todos
        </Button>
      )}
    </div>
  );
}

