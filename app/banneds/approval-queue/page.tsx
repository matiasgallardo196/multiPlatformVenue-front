"use client";

import { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BannedPlaceApproval } from "@/components/banned/banned-place-approval";
import { BannedDetailModal } from "@/components/banned/banned-detail-modal";
import { useApprovalQueueBanneds, usePlaces } from "@/hooks/queries";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FiltersButton } from "@/components/filters/filters-button";
import { ActiveFiltersChips, type ActiveFilter } from "@/components/filters/active-filters-chips";
import { FiltersModal, type FilterConfig, type FilterValues } from "@/components/filters/filters-modal";
import { CompactPagination } from "@/components/pagination/compact-pagination";
import type { Banned } from "@/lib/types";
import { format, differenceInCalendarDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBulkApproveBanneds } from "@/hooks/queries";

export default function ApprovalQueuePage() {
  const { user } = useAuth();
  const [selectedBannedId, setSelectedBannedId] = useState<string | null>(null);
  // Filtros y orden (sin estado de activo/inactivo)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState<"all" | "Male" | "Female">(
    "all"
  );
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Debounce de búsqueda para no disparar por cada tecla
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Resetear página cuando cambian filtros/sort/búsqueda
  useEffect(() => {
    setPage(1);
  }, [sortBy, selectedCreatorId, genderFilter, selectedPlaces, debouncedSearch]);

  const {
    data: bannedsPage,
    isLoading: bannedsLoading,
    error: bannedsError,
  } = useApprovalQueueBanneds(sortBy, selectedCreatorId, { page, limit, search: debouncedSearch });

  const banneds = bannedsPage?.items || [];
  const total = bannedsPage?.total ?? 0;
  const currentPage = bannedsPage?.page ?? page;
  const currentLimit = bannedsPage?.limit ?? limit;
  const hasNext = bannedsPage?.hasNext ?? false;
  const { data: places, isLoading: placesLoading } = usePlaces();

  // Lista de creadores (empleados) deducida de los datos cargados
  const creators = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (banneds || []).forEach((b: any) => {
      const id = b.createdBy?.id || b.createdByUserId;
      if (!id) return;
      const name = b.createdBy?.userName || (b.createdByUserId ? `ID: ${String(b.createdByUserId).slice(0, 8)}...` : "Unknown");
      if (!map.has(id)) map.set(id, { id, name });
    });
    return Array.from(map.values()).sort((a, z) => a.name.localeCompare(z.name));
  }, [banneds]);

  // Helper functions (before any conditional returns)
  const getPendingPlacesForPlace = (banned: Banned) => {
    if (!user?.placeId) return [];
    return (
      banned.bannedPlaces?.filter(
        (bp) =>
          bp.status === 'pending' &&
          bp.placeId === user.placeId
      ) || []
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getPersonName = (banned: Banned) => {
    const person = banned.person;
    return (
      [person?.name, person?.lastName].filter(Boolean).join(" ") ||
      person?.nickname ||
      "Unknown"
    );
  };

  const getDurationLabel = (banned: Banned) => {
    if (!banned) return "-";
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
    } catch {
      return "-";
    }
  };

  const handlePlaceToggle = (placeId: string) => {
    setSelectedPlaces((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedPlaces([]);
    setGenderFilter("all");
    setSelectedCreatorId(null);
    setSortBy("violations-desc");
  };

  const handleFiltersApply = (values: FilterValues) => {
    if (values.gender !== undefined) setGenderFilter(values.gender);
    if (values.places !== undefined) setSelectedPlaces(values.places);
    if (values.creator !== undefined) setSelectedCreatorId(values.creator);
    if (values.sortBy !== undefined) setSortBy(values.sortBy as any);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (genderFilter !== "all") count++;
    if (selectedPlaces.length > 0) count += selectedPlaces.length;
    if (selectedCreatorId) count++;
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
    if (selectedCreatorId) {
      const creator = creators.find((c) => c.id === selectedCreatorId);
      chips.push({
        key: "creator",
        label: "Creator",
        value: creator?.name || "Unknown",
        onRemove: () => setSelectedCreatorId(null),
      });
    }
    return chips;
  };

  // Filtrado en cliente solo para filtros no implementados en backend (gender, place, creator)
  // La búsqueda ahora se hace en el servidor
  const filteredBanneds = useMemo(() => {
    if (!banneds) return [] as Banned[];

    return banneds.filter((banned: Banned) => {
      const person = banned.person;

      const matchesPlace =
        selectedPlaces.length === 0 ||
        banned.bannedPlaces?.some((bp) => selectedPlaces.includes(bp.placeId));

      const matchesGender = genderFilter === "all" || person?.gender === genderFilter;
      const creatorId = (banned as any).createdBy?.id || (banned as any).createdByUserId || null;
      const matchesCreator = !selectedCreatorId || (creatorId && creatorId === selectedCreatorId);

      return matchesPlace && matchesGender && matchesCreator;
    });
  }, [banneds, selectedPlaces, genderFilter, selectedCreatorId]);

  const isLoading = bannedsLoading || placesLoading;

  // Only show for head-managers (after all hooks)
  if (user?.role !== "head-manager") {
    return (
      <RouteGuard>
        <DashboardLayout>
          <PageHeader title="Approval Queue" />
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
          <PageHeader title="Approval Queue" />
          <div className="text-center py-8">
            <p className="text-destructive">
              Error loading approval queue: {bannedsError.message}
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
          title="Approval Queue"
          description="Review and approve pending ban requests for your place"
        />
        <div className="space-y-6">
          {/* Buscador and Filters Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name/nickname or incident number..."
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

          {/* Conteo + Acción masiva + Paginación */}
          {!isLoading && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "pending approval" : "pending approvals"}
              </p>
              <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-3">
                <BulkApproveButton
                  disabled={filteredBanneds.length === 0}
                  count={filteredBanneds.length}
                  selectedCreatorId={selectedCreatorId}
                  bannedIds={filteredBanneds.map((b) => b.id)}
                  genderFilter={genderFilter}
                  className="order-1"
                />
                <CompactPagination
                  currentPage={currentPage}
                  total={total}
                  limit={currentLimit}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                  hasNext={hasNext}
                  className="order-2 ml-auto sm:ml-0"
                />
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading approval queue...</span>
            </div>
          ) : total === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No pending approvals. All bans for your place have been reviewed.
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto border rounded-lg p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredBanneds.map((banned) => {
                  const pendingPlaces = getPendingPlacesForPlace(banned);
                  if (pendingPlaces.length === 0) return null;

                    return (
                      <Card
                        key={banned.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedBannedId(banned.id)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <span
                                  className="hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/banneds/${banned.id}`;
                                  }}
                                >
                                  {getPersonName(banned)}
                                </span>
                                <Badge variant="outline">
                                  #{banned.incidentNumber}
                                </Badge>
                              </CardTitle>
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <p>
                                  <span className="font-medium">Period:</span>{" "}
                                  {formatDate(banned.startingDate)} -{" "}
                                  {banned.endingDate
                                    ? formatDate(banned.endingDate)
                                    : "Indefinite"}
                                </p>
                                {(banned.createdBy || banned.createdByUserId) && (
                                  <p>
                                    <span className="font-medium">Created by:</span>{" "}
                                    {banned.createdBy?.userName || `ID: ${
                                      banned.createdByUserId.slice(0, 8)
                                    }...`}
                                  </p>
                                )}
                                <p>
                                  <span className="font-medium">Duration:</span>{" "}
                                  {getDurationLabel(banned)}
                                </p>
                                {Array.isArray(banned.motive) && banned.motive.length > 0 && (
                                  <p className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">Motives:</span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="underline decoration-dotted cursor-help text-muted-foreground">
                                          View
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent sideOffset={6}>
                                        <div className="text-left whitespace-pre-wrap max-w-xs">
                                          {banned.motive.map((m, idx) => (
                                            <div key={idx}>• {m}</div>
                                          ))}
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
                            <p className="text-sm font-medium">Pending Place Approval:</p>
                            {pendingPlaces.map((bp) => {
                              const place = places?.find((p) => p.id === bp.placeId);
                              if (!place) return null;
                              return (
                                <div key={bp.placeId} onClick={(e) => e.stopPropagation()}>
                                  <BannedPlaceApproval bannedId={banned.id} bannedPlace={bp} place={place} />
                                </div>
                              );
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
            creator: true,
            sortBy: true,
          }}
          values={{
            gender: genderFilter,
            places: selectedPlaces,
            creator: selectedCreatorId,
            sortBy: sortBy,
          }}
          onApply={handleFiltersApply}
          onClearAll={handleClearFilters}
          places={places}
          creators={creators}
        />
      </DashboardLayout>
    </RouteGuard>
  );
}

function BulkApproveButton({ disabled, count, selectedCreatorId, bannedIds, genderFilter, className }: { disabled: boolean; count: number; selectedCreatorId: string | null; bannedIds: string[]; genderFilter: 'all' | 'Male' | 'Female'; className?: string }) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const bulkApprove = useBulkApproveBanneds();

  // Cerrar el modal automáticamente cuando la mutación termine exitosamente
  // Esto evita duplicar callbacks y deja que el hook maneje todo centralizadamente
  useEffect(() => {
    if (!bulkApprove.isPending && bulkApprove.isSuccess && open) {
      setOpen(false);
      setConfirmed(false);
    }
  }, [bulkApprove.isPending, bulkApprove.isSuccess, open]);

  const onConfirm = () => {
    const payload: any = {};
    if (selectedCreatorId) payload.createdBy = selectedCreatorId;
    if (genderFilter !== 'all') payload.gender = genderFilter;
    
    if (bannedIds && bannedIds.length > 0) {
      payload.bannedIds = bannedIds;
    }
    
    // Solo llamar mutate sin callbacks adicionales
    // El hook ya maneja onSuccess/onError con invalidación y toast
    bulkApprove.mutate(payload);
  };

  return (
    <>
      <Button
        aria-label="Approve all filtered"
        variant="default"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={className}
      >
        Approve all
      </Button>
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!bulkApprove.isPending) {
          setOpen(newOpen);
          if (!newOpen) {
            setConfirmed(false);
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve all filtered bans</DialogTitle>
            <DialogDescription>
              This will approve all pending places for the filtered bans. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {bulkApprove.isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing bulk approval. Please wait...</span>
              </div>
            ) : (
              <>
                <p>{`This will approve ${count} records matching the current filters.`}</p>
                {selectedCreatorId && (
                  <p className="text-sm text-muted-foreground">Filtered by selected creator.</p>
                )}
              </>
            )}
            {!bulkApprove.isPending && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                I understand this is a bulk action
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={bulkApprove.isPending}>Cancel</Button>
            <Button onClick={onConfirm} disabled={!confirmed || bulkApprove.isPending}>
              {bulkApprove.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

