"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BannedDetailModal } from "@/components/banned/banned-detail-modal";
import { usePendingBanneds, usePlaces } from "@/hooks/queries";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { Badge } from "@/components/ui/badge";
import type { Banned } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { FiltersButton } from "@/components/filters/filters-button";
import { ActiveFiltersChips, type ActiveFilter } from "@/components/filters/active-filters-chips";
import { FiltersModal, type FilterConfig, type FilterValues } from "@/components/filters/filters-modal";
import { format, differenceInCalendarDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function PendingBannedsPage() {
  const { user } = useAuth();
  const [selectedBannedId, setSelectedBannedId] = useState<string | null>(null);
  // Filtros y orden
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState<"all" | "Male" | "Female">("all");
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
  const {
    data: banneds,
    isLoading: bannedsLoading,
    error: bannedsError,
  } = usePendingBanneds(sortBy);
  const { data: places, isLoading: placesLoading } = usePlaces();
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Nota: Los returns condicionales van después de todos los hooks
  const isLoading = bannedsLoading || placesLoading;

  // Helpers
  const getPendingPlaces = (banned: Banned) => (banned.bannedPlaces?.filter((bp) => bp.status === 'pending') || []);
  const hasPendingPlaces = (banned: Banned) => getPendingPlaces(banned).length > 0;
  const formatDate = (dateString: string) => {
    try { return format(new Date(dateString), "dd/MM/yyyy"); } catch { return "Invalid date"; }
  };
  const getPersonName = (banned: Banned) => {
    const person = banned.person;
    return ([person?.name, person?.lastName].filter(Boolean).join(" ") || person?.nickname || "Unknown");
  };
  const getDurationLabel = (banned: Banned) => {
    if (!banned.endingDate) return "Indefinite";
    const hl = banned.howlong;
    if (hl) {
      const years = Number(hl.years || 0);
      const months = Number(hl.months || 0);
      const days = Number(hl.days || 0);
      const parts: string[] = [];
      if (years) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
      if (months) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
      if (days) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
      if (parts.length > 0) return parts.join(", ");
    }
    try {
      const d1 = new Date(banned.startingDate);
      const d2 = new Date(banned.endingDate);
      const days = Math.max(0, differenceInCalendarDays(d2, d1));
      return days === 1 ? "1 day" : `${days} days`;
    } catch { return "-"; }
  };
  const handlePlaceToggle = (placeId: string) => {
    setSelectedPlaces((prev) => prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]);
  };
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedPlaces([]);
    setGenderFilter("all");
    setSortBy("violations-desc");
  };

  const handleFiltersApply = (values: FilterValues) => {
    if (values.gender !== undefined) setGenderFilter(values.gender);
    if (values.places !== undefined) setSelectedPlaces(values.places);
    if (values.sortBy !== undefined) setSortBy(values.sortBy as any);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (genderFilter !== "all") count++;
    if (selectedPlaces.length > 0) count += selectedPlaces.length;
    return count;
  };

  const getActiveFiltersChips = (): ActiveFilter[] => {
    const chips: ActiveFilter[] = [];
    if (genderFilter !== "all") {
      chips.push({
        key: "gender",
        label: "Gender",
        value: genderFilter,
        onRemove: () => setGenderFilter("all"),
      });
    }
    selectedPlaces.forEach((placeId) => {
      const place = places?.find((p) => p.id === placeId);
      chips.push({
        key: `place-${placeId}`,
        label: "Place",
        value: place?.name || "Unknown",
        onRemove: () => handlePlaceToggle(placeId),
      });
    });
    return chips;
  };
  // Filtrado client-side
  const filteredBanneds = useMemo(() => {
    const list = (banneds || []).filter(hasPendingPlaces);
    return list.filter((banned: Banned) => {
      const person = banned.person;
      const personName = [person?.name, person?.lastName, person?.nickname].filter(Boolean).join(" ").toLowerCase();
      const q = (searchQuery || "").toLowerCase();
      const numQ = q.replace(/[^0-9]/g, "");
      const matchesIncident = numQ.length > 0 && String(banned.incidentNumber).includes(numQ);
      const matchesSearch = !q || personName.includes(q) || matchesIncident;
      const matchesPlace = selectedPlaces.length === 0 || banned.bannedPlaces?.some((bp) => selectedPlaces.includes(bp.placeId));
      const matchesGender = genderFilter === "all" || person?.gender === genderFilter;
      return matchesSearch && matchesPlace && matchesGender;
    });
  }, [banneds, searchQuery, selectedPlaces, genderFilter]);

  // Only show for managers (después de hooks)
  if (user?.role !== "manager") {
    return (
      <RouteGuard>
        <DashboardLayout>
          <PageHeader title="Pending Bans" />
          <div className="text-center py-8">
            <p className="text-destructive">
              You do not have permission to view this page.
            </p>
          </div>
        </DashboardLayout>
      </RouteGuard>
    );
  }

  if (bannedsError) {
    return (
      <RouteGuard>
        <DashboardLayout>
          <PageHeader title="Pending Bans" />
          <div className="text-center py-8">
            <p className="text-destructive">
              Error loading pending bans: {bannedsError.message}
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
          title="Pending Bans"
          description="Bans waiting for approval from head-managers"
        />
        <div className="space-y-6">
          {/* Buscador and Filters Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre/apodo o número de incidente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <FiltersButton
              activeCount={getActiveFiltersCount()}
              onClick={() => setIsFiltersModalOpen(true)}
              className="w-full sm:w-auto"
            />
          </div>

          {/* Active Filters Chips */}
          <ActiveFiltersChips
            filters={getActiveFiltersChips()}
            onClearAll={handleClearFilters}
          />

          {/* Results Count */}
          {!isLoading && filteredBanneds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredBanneds.length} of {banneds?.filter(hasPendingPlaces).length || 0} pending bans
            </p>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading pending bans...</span>
            </div>
          ) : !banneds || banneds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No pending bans found. All your bans have been approved.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {banneds.filter(hasPendingPlaces).length} pending
                  ban{banneds.filter(hasPendingPlaces).length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="max-h-[calc(100vh-280px)] overflow-y-auto border rounded-lg p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredBanneds.map((banned) => {
                    const pendingPlaces = getPendingPlaces(banned);
                    return (
                      <Card key={banned.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedBannedId(banned.id)}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <span className="hover:underline" onClick={(e) => { e.stopPropagation(); window.location.href = `/banneds/${banned.id}`; }}>
                                  {getPersonName(banned)}
                                </span>
                                <Badge variant="outline">#{banned.incidentNumber}</Badge>
                              </CardTitle>
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <p><span className="font-medium">Period:</span> {formatDate(banned.startingDate)} - {banned.endingDate ? formatDate(banned.endingDate) : "Indefinite"}</p>
                                {(banned.createdBy || banned.createdByUserId) && (
                                  <p><span className="font-medium">Created by:</span> {banned.createdBy?.userName || `ID: ${banned.createdByUserId.slice(0,8)}...`}</p>
                                )}
                                <p><span className="font-medium">Duration:</span> {getDurationLabel(banned)}</p>
                                {Array.isArray(banned.motive) && banned.motive.length > 0 && (
                                  <p className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">Motives:</span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="underline decoration-dotted cursor-help text-muted-foreground">View</span>
                                      </TooltipTrigger>
                                      <TooltipContent sideOffset={6}>
                                        <div className="text-left whitespace-pre-wrap max-w-xs">
                                          {banned.motive.map((m, idx) => (<div key={idx}>• {m}</div>))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Pending Places:</p>
                            {pendingPlaces.map((bp) => {
                              const place = places?.find((p) => p.id === bp.placeId);
                              if (!place) return null;
                              return (<div key={bp.placeId} onClick={(e) => e.stopPropagation()}><Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">{place?.name || "Unknown Place"}</Badge></div>);
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {selectedBannedId && (
          <BannedDetailModal
            bannedId={selectedBannedId}
            open={!!selectedBannedId}
            onOpenChange={(open) => {
              if (!open) setSelectedBannedId(null);
            }}
          />
        )}

        {/* Filters Modal */}
        <FiltersModal
          open={isFiltersModalOpen}
          onOpenChange={setIsFiltersModalOpen}
          config={{
            gender: true,
            place: true,
            sortBy: true,
          }}
          values={{
            gender: genderFilter,
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

