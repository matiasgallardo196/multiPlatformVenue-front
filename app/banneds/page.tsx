"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BannedCreateFullDialog } from "@/components/banned/banned-create-full-dialog";
import { BannedCard } from "@/components/banned/banned-card";
import { useBanneds, usePlaces, useDeleteBanned } from "@/hooks/queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, ArrowUpDown, Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Banned, Place, BannedPlace } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function BannedsPage() {
  const { toast } = useToast();
  const { isReadOnly } = useAuth();
  const { data: places, isLoading: placesLoading } = usePlaces();
  const deleteBannedMutation = useDeleteBanned();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("active");
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState<"all" | "Male" | "Female">(
    "all"
  );
  const [sortBy, setSortBy] = useState<
    | "violations-desc"
    | "violations-asc"
    | "starting-date-desc"
    | "starting-date-asc"
    | "ending-date-desc"
    | "ending-date-asc"
    | "person-name-asc"
    | "person-name-desc"
  >("violations-desc");

  // Fetch banneds with sorting
  const {
    data: banneds,
    isLoading: bannedsLoading,
    error: bannedsError,
  } = useBanneds(sortBy);

  // Filter and search logic (sorting is done in backend)
  const filteredBanneds = useMemo(() => {
    if (!banneds) return [];

    return banneds.filter((banned: Banned) => {
      const person = banned.person;
      const personName = [person?.name, person?.lastName, person?.nickname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Search filter
      const q = (searchQuery || "").toLowerCase();
      const numQ = q.replace(/[^0-9]/g, "");
      const matchesIncident =
        numQ.length > 0 && String(banned.incidentNumber).includes(numQ);
      const matchesSearch = !q || personName.includes(q) || matchesIncident;

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && banned.isActive) ||
        (statusFilter === "inactive" && !banned.isActive);

      // Place filter
      const matchesPlace =
        selectedPlaces.length === 0 ||
        banned.bannedPlaces?.some((bp: BannedPlace) =>
          selectedPlaces.includes(bp.placeId)
        );

      // Gender filter
      const matchesGender =
        genderFilter === "all" || person?.gender === genderFilter;

      return matchesSearch && matchesStatus && matchesPlace && matchesGender;
    });
  }, [banneds, searchQuery, statusFilter, selectedPlaces, genderFilter]);

  const handlePlaceToggle = (placeId: string) => {
    setSelectedPlaces((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedPlaces([]);
    setGenderFilter("all");
  };

  const handleEdit = (banned: Banned) => {
    // handled inline via dialog trigger
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBannedMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Ban record deleted successfully.",
      });
    } catch (error: any) {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Failed to delete ban record. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isLoading = bannedsLoading || placesLoading;

  if (bannedsError) {
    return (
      <RouteGuard>
        <DashboardLayout>
          <PageHeader title="Banned Persons" />
          <div className="text-center py-8">
            <p className="text-destructive">
              Error loading banned persons: {bannedsError.message}
            </p>
          </div>
        </DashboardLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <DashboardLayout>
        <PageHeader
          title="Banned Persons"
          description="Manage banned individuals and their restrictions"
        >
          {!isReadOnly && (
            <BannedCreateFullDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Ban
              </Button>
            </BannedCreateFullDialog>
          )}
        </PageHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, last name, nickname, or incident number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters, Sort, and Results Count in one row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "active" | "inactive") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Gender Filter */}
              <Select
                value={genderFilter}
                onValueChange={(value: "all" | "Male" | "Female") =>
                  setGenderFilter(value)
                }
              >
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>

              {/* Place Filter */}
              <Select onValueChange={handlePlaceToggle}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Add place filter" />
                </SelectTrigger>
                <SelectContent>
                  {places?.map((place: Place) => (
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

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort:</span>
                <Select
                  value={sortBy}
                  onValueChange={(
                    value:
                      | "violations-desc"
                      | "violations-asc"
                      | "starting-date-desc"
                      | "starting-date-asc"
                      | "ending-date-desc"
                      | "ending-date-asc"
                      | "person-name-asc"
                      | "person-name-desc"
                  ) => setSortBy(value)}
                >
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="violations-desc">
                      Violations (High to Low)
                    </SelectItem>
                    <SelectItem value="violations-asc">
                      Violations (Low to High)
                    </SelectItem>
                    <SelectItem value="starting-date-desc">
                      Starting Date (Newest first)
                    </SelectItem>
                    <SelectItem value="starting-date-asc">
                      Starting Date (Oldest first)
                    </SelectItem>
                    <SelectItem value="ending-date-desc">
                      Ending Date (Newest first)
                    </SelectItem>
                    <SelectItem value="ending-date-asc">
                      Ending Date (Oldest first)
                    </SelectItem>
                    <SelectItem value="person-name-asc">
                      Person Name (A-Z)
                    </SelectItem>
                    <SelectItem value="person-name-desc">
                      Person Name (Z-A)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {(searchQuery ||
                statusFilter !== "all" ||
                selectedPlaces.length > 0 ||
                genderFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results Count */}
            {!isLoading && filteredBanneds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredBanneds.length} of {banneds?.length || 0}{" "}
                banned persons
              </p>
            )}
          </div>

          {/* Active Filters Badges */}
          {(statusFilter !== "all" ||
            selectedPlaces.length > 0 ||
            genderFilter !== "all") && (
            <div className="flex flex-wrap gap-2">
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
              {genderFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Gender: {genderFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setGenderFilter("all")}
                  />
                </Badge>
              )}
              {selectedPlaces.map((placeId) => {
                const place = places?.find((p: Place) => p.id === placeId);
                return (
                  <Badge key={placeId} variant="secondary" className="gap-1">
                    {place?.name || "Unknown Place"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handlePlaceToggle(placeId)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading banned persons...</span>
            </div>
          ) : filteredBanneds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {banneds?.length === 0
                  ? "No banned persons found."
                  : "No results match your filters."}
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto border rounded-lg p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {filteredBanneds.map((banned: Banned) => (
                  <BannedCard
                    key={banned.id}
                    banned={banned}
                    places={places || []}
                    onEdit={handleEdit}
                    onDelete={(id) => handleDelete(id)}
                    readOnly={isReadOnly}
                    showApprovalBadge={false}
                    actionsAtTopRight={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
