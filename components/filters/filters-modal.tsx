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
import { BAN_MOTIVES } from "@/components/banned/motive-select";

export type FilterConfig = {
  gender?: boolean;
  status?: boolean;
  place?: boolean;
  creator?: boolean;
  sortBy?: boolean;
  motive?: boolean;
  banStatus?: boolean;
  source?: boolean;
};

export type FilterValues = {
  gender?: "all" | "Male" | "Female";
  status?: "all" | "active" | "inactive";
  places?: string[];
  creator?: string | null;
  sortBy?: string;
  motives?: string[];
  banStatus?: "all" | "active" | "pending" | "expired" | "none";
  source?: "all" | "owner" | "shared";
  ownerPlaceId?: string;
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
  placeDisabled?: boolean;
  ownerVenues?: Array<{ id: string; name: string }>;
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
  placeDisabled = false,
  ownerVenues = [],
}: FiltersModalProps) {
  const [localValues, setLocalValues] = useState<FilterValues>(values);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>(values.places || []);
  const [selectedMotives, setSelectedMotives] = useState<string[]>(values.motives || []);

  useEffect(() => {
    setLocalValues(values);
    setSelectedPlaces(values.places || []);
    setSelectedMotives(values.motives || []);
  }, [values, open]);

  const handlePlaceToggle = (placeId: string) => {
    setSelectedPlaces((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleMotiveToggle = (motive: string) => {
    setSelectedMotives((prev) =>
      prev.includes(motive)
        ? prev.filter((m) => m !== motive)
        : [...prev, motive]
    );
  };

  const handleApply = () => {
    onApply({
      ...localValues,
      places: selectedPlaces,
      motives: selectedMotives,
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
      motives: [],
      banStatus: config.banStatus ? "all" : undefined,
      source: config.source ? "all" : undefined,
      ownerPlaceId: undefined,
    };
    setLocalValues(cleared);
    setSelectedPlaces([]);
    setSelectedMotives([]);
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

          {/* Ban Status Filter */}
          {config.banStatus && (
            <div className="space-y-2">
              <Label>Ban Status</Label>
              <Select
                value={localValues.banStatus || "all"}
                onValueChange={(value: "all" | "active" | "pending" | "expired" | "none") =>
                  setLocalValues({ ...localValues, banStatus: value })
                }
              >
                <SelectTrigger className="w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Banned (Active)</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="none">Clean (No bans)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Source Filter */}
          {config.source && (
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={localValues.source || "all"}
                onValueChange={(value: "all" | "owner" | "shared") =>
                  setLocalValues({ ...localValues, source: value, ownerPlaceId: undefined })
                }
              >
                <SelectTrigger className="w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="owner">My venue</SelectItem>
                  <SelectItem value="shared">Shared with me</SelectItem>
                </SelectContent>
              </Select>
              {localValues.source === "shared" && ownerVenues.length > 0 && (
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">From specific venue</Label>
                  <Select
                    value={localValues.ownerPlaceId || "__all__"}
                    onValueChange={(value: string) =>
                      setLocalValues({ ...localValues, ownerPlaceId: value === "__all__" ? undefined : value })
                    }
                  >
                    <SelectTrigger className="w-full text-base mt-1">
                      <SelectValue placeholder="All venues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All venues</SelectItem>
                      {ownerVenues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              <Label>
                Places
                {placeDisabled && selectedPlaces.length > 0 && (
                  <span className="text-muted-foreground text-xs ml-2">
                    (locked to {places.find(p => p.id === selectedPlaces[0])?.name || "your venue"})
                  </span>
                )}
              </Label>
              <div className="space-y-2">
                <Select onValueChange={handlePlaceToggle} disabled={placeDisabled}>
                  <SelectTrigger className="w-full text-base" disabled={placeDisabled}>
                    <SelectValue placeholder={placeDisabled && selectedPlaces.length > 0 
                      ? places.find(p => p.id === selectedPlaces[0])?.name || "Your venue"
                      : "Add place"
                    } />
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
                          {!placeDisabled && (
                            <button
                              type="button"
                              onClick={() => handlePlaceToggle(placeId)}
                              className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
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

          {/* Motive Filter */}
          {config.motive && (
            <div className="space-y-2">
              <Label>Motives</Label>
              <div className="space-y-2">
                <Select onValueChange={handleMotiveToggle}>
                  <SelectTrigger className="w-full text-base">
                    <SelectValue placeholder="Add motive" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAN_MOTIVES.map((motive) => (
                      <SelectItem
                        key={motive}
                        value={motive}
                        disabled={selectedMotives.includes(motive)}
                      >
                        {motive}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMotives.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMotives.map((motive) => (
                      <Badge
                        key={motive}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        <span className="truncate max-w-[200px]">{motive}</span>
                        <button
                          type="button"
                          onClick={() => handleMotiveToggle(motive)}
                          className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
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

