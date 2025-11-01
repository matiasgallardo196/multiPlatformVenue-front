"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BannedCreateFullDialog } from "@/components/banned/banned-create-full-dialog";
import { BannedCard } from "@/components/banned/banned-card";
import { BannedSearch } from "@/components/banned/banned-search";
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
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Banned } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";

export default function BannedsPage() {
  const { toast } = useToast();
  const { isReadOnly } = useAuth();
  const {
    data: banneds,
    isLoading: bannedsLoading,
    error: bannedsError,
  } = useBanneds();
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

  // Filter and search logic
  const filteredBanneds = useMemo(() => {
    if (!banneds) return [];

    return banneds.filter((banned) => {
      const person = banned.person;
      const personName = [person?.name, person?.lastName, person?.nickname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Search filter
      const matchesSearch =
        !searchQuery || personName.includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && banned.isActive) ||
        (statusFilter === "inactive" && !banned.isActive);

      // Place filter
      const matchesPlace =
        selectedPlaces.length === 0 ||
        banned.bannedPlaces.some((bp) => selectedPlaces.includes(bp.placeId));

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

        <div className="space-y-6">
          {/* Search and Filters */}
          <BannedSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            selectedPlaces={selectedPlaces}
            onPlaceToggle={handlePlaceToggle}
            places={places || []}
            onClearFilters={handleClearFilters}
            genderFilter={genderFilter}
            onGenderFilterChange={setGenderFilter}
          />

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
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredBanneds.length} of {banneds?.length || 0}{" "}
                  banned persons
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {filteredBanneds.map((banned) => (
                  <BannedCard
                    key={banned.id}
                    banned={banned}
                    places={places || []}
                    onEdit={handleEdit}
                    onDelete={(id) => handleDelete(id)}
                    readOnly={isReadOnly}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
