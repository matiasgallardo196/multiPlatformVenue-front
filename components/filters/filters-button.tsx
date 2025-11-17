"use client";

import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FiltersButtonProps {
  activeCount: number;
  onClick: () => void;
  className?: string;
}

export function FiltersButton({ activeCount, onClick, className }: FiltersButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn("relative gap-2", className)}
    >
      <Filter className="h-4 w-4" />
      <span className="hidden sm:inline">Filtros</span>
      {activeCount > 0 && (
        <Badge
          variant="default"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}

