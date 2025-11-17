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
import { Plus, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Banned, Place, BannedPlace } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { Input } from "@/components/ui/input";
import { FiltersButton } from "@/components/filters/filters-button";
import { ActiveFiltersChips, type ActiveFilter } from "@/components/filters/active-filters-chips";
import { FiltersModal, type FilterConfig, type FilterValues } from "@/components/filters/filters-modal";

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
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

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
    setSortBy("violations-desc");
  };

  const handleFiltersApply = (values: FilterValues) => {
    if (values.status !== undefined) setStatusFilter(values.status);
    if (values.gender !== undefined) setGenderFilter(values.gender);
    if (values.places !== undefined) setSelectedPlaces(values.places);
    if (values.sortBy !== undefined) setSortBy(values.sortBy as any);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (genderFilter !== "all") count++;
    if (selectedPlaces.length > 0) count += selectedPlaces.length;
    return count;
  };

  const getActiveFiltersChips = (): ActiveFilter[] => {
    const chips: ActiveFilter[] = [];
    if (statusFilter !== "all") {
      chips.push({
        key: "status",
        label: "Estado",
        value: statusFilter === "active" ? "Activo" : "Inactivo",
        onRemove: () => setStatusFilter("all"),
      });
    }
    if (genderFilter !== "all") {
      chips.push({
        key: "gender",
        label: "Género",
        value: genderFilter,
        onRemove: () => setGenderFilter("all"),
      });
    }
    selectedPlaces.forEach((placeId) => {
      const place = places?.find((p: Place) => p.id === placeId);
      chips.push({
        key: `place-${placeId}`,
        label: "Lugar",
        value: place?.name || "Unknown",
        onRemove: () => handlePlaceToggle(placeId),
      });
    });
    return chips;
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
              className="pl-10 text-base"
            />
          </div>

          {/* Filters Button and Active Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <FiltersButton
              activeCount={getActiveFiltersCount()}
              onClick={() => setIsFiltersModalOpen(true)}
            />
            <ActiveFiltersChips
              filters={getActiveFiltersChips()}
              onClearAll={handleClearFilters}
            />
          </div>

          {/* Results Count */}
          {!isLoading && filteredBanneds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredBanneds.length} of {banneds?.length || 0}{" "}
              banned persons
            </p>
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
            <div className="max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)] overflow-y-auto border rounded-lg p-3 sm:p-4">
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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

        {/* Filters Modal */}
        <FiltersModal
          open={isFiltersModalOpen}
          onOpenChange={setIsFiltersModalOpen}
          config={{
            gender: true,
            status: true,
            place: true,
            sortBy: true,
          }}
          values={{
            gender: genderFilter,
            status: statusFilter,
            places: selectedPlaces,
            sortBy: sortBy,
          }}
          onApply={handleFiltersApply}
          onClearAll={handleClearFilters}
          places={places}
        />
      </DashboardLayout>
    </RouteGuard>
  );
}
