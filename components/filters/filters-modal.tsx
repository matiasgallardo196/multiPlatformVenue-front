"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, ArrowUpDown } from "lucide-react";
import type { Place } from "@/lib/types";

export type FilterConfig = {
  gender?: boolean;
  status?: boolean;
  place?: boolean;
  creator?: boolean;
  sortBy?: boolean;
};

export type FilterValues = {
  gender?: "all" | "Male" | "Female";
  status?: "all" | "active" | "inactive";
  places?: string[];
  creator?: string | null;
  sortBy?: string;
};

interface FiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FilterConfig;
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onClearAll: () => void;
  places?: Place[];
  creators?: Array<{ id: string; name: string }>;
  sortOptions?: Array<{ value: string; label: string }>;
}

const defaultSortOptions = [
  { value: "violations-desc", label: "Violations (High to Low)" },
  { value: "violations-asc", label: "Violations (Low to High)" },
  { value: "starting-date-desc", label: "Starting Date (Newest first)" },
  { value: "starting-date-asc", label: "Starting Date (Oldest first)" },
  { value: "ending-date-desc", label: "Ending Date (Newest first)" },
  { value: "ending-date-asc", label: "Ending Date (Oldest first)" },
  { value: "person-name-asc", label: "Person Name (A-Z)" },
  { value: "person-name-desc", label: "Person Name (Z-A)" },
];

const personsSortOptions = [
  { value: "newest-first", label: "Newest first" },
  { value: "oldest-first", label: "Oldest first" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
];

export function FiltersModal({
  open,
  onOpenChange,
  config,
  values,
  onApply,
  onClearAll,
  places = [],
  creators = [],
  sortOptions,
}: FiltersModalProps) {
  const [localValues, setLocalValues] = useState<FilterValues>(values);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>(values.places || []);

  useEffect(() => {
    setLocalValues(values);
    setSelectedPlaces(values.places || []);
  }, [values, open]);

  const handlePlaceToggle = (placeId: string) => {
    setSelectedPlaces((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleApply = () => {
    onApply({
      ...localValues,
      places: selectedPlaces,
    });
    onOpenChange(false);
  };

  const handleClearAll = () => {
    const cleared: FilterValues = {
      gender: config.gender ? "all" : undefined,
      status: config.status ? "all" : undefined,
      places: [],
      creator: config.creator ? null : undefined,
      sortBy: config.sortBy ? (sortOptions?.[0]?.value || defaultSortOptions[0].value) : undefined,
    };
    setLocalValues(cleared);
    setSelectedPlaces([]);
    onClearAll();
    onOpenChange(false);
  };

  const activeSortOptions = sortOptions || defaultSortOptions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Configure filters to refine your search
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Gender Filter */}
          {config.gender && (
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={localValues.gender || "all"}
                onValueChange={(value: "all" | "Male" | "Female") =>
                  setLocalValues({ ...localValues, gender: value })
                }
              >
                <SelectTrigger className="w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          {config.status && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={localValues.status || "all"}
                onValueChange={(value: "all" | "active" | "inactive") =>
                  setLocalValues({ ...localValues, status: value })
                }
              >
                <SelectTrigger className="w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Place Filter */}
          {config.place && (
            <div className="space-y-2">
              <Label>Places</Label>
              <div className="space-y-2">
                <Select onValueChange={handlePlaceToggle}>
                  <SelectTrigger className="w-full text-base">
                    <SelectValue placeholder="Add place" />
                  </SelectTrigger>
                  <SelectContent>
                    {places.map((place) => (
                      <SelectItem
                        key={place.id}
                        value={place.id}
                        disabled={selectedPlaces.includes(place.id)}
                      >
                        {place.name || "Unnamed Place"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlaces.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPlaces.map((placeId) => {
                      const place = places.find((p) => p.id === placeId);
                      return (
                        <Badge
                          key={placeId}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {place?.name || "Unknown"}
                          <button
                            type="button"
                            onClick={() => handlePlaceToggle(placeId)}
                            className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Creator Filter */}
          {config.creator && (
            <div className="space-y-2">
              <Label>Creator</Label>
              <Select
                value={localValues.creator || "__all__"}
                onValueChange={(value: string) =>
                  setLocalValues({
                    ...localValues,
                    creator: value === "__all__" ? null : value,
                  })
                }
              >
                <SelectTrigger className="w-full text-base">
                  <SelectValue placeholder="Creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All creators</SelectItem>
                  {creators.map((creator) => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sort By */}
          {config.sortBy && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort by
              </Label>
              <Select
                value={localValues.sortBy || activeSortOptions[0]?.value}
                onValueChange={(value: string) =>
                  setLocalValues({ ...localValues, sortBy: value })
                }
              >
                <SelectTrigger className="w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeSortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="w-full sm:w-auto"
          >
            Clear all
          </Button>
          <Button onClick={handleApply} className="w-full sm:w-auto">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

