"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BannedDetailModal } from "@/components/banned/banned-detail-modal";
import { usePendingBanneds, usePlaces } from "@/hooks/queries";
import { Loader2, Search, Filter, ArrowUpDown, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { Badge } from "@/components/ui/badge";
import type { Banned } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre/apodo o número de incidente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros y Orden */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>
              {/* Género */}
              <Select value={genderFilter} onValueChange={(v: any) => setGenderFilter(v)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              {/* Lugar */}
              <Select onValueChange={handlePlaceToggle}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Add place filter" />
                </SelectTrigger>
                <SelectContent>
                  {places?.map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={selectedPlaces.includes(p.id)}>
                      {p.name || "Unnamed Place"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Orden */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort:</span>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="violations-desc">Violations (High to Low)</SelectItem>
                    <SelectItem value="violations-asc">Violations (Low to High)</SelectItem>
                    <SelectItem value="starting-date-desc">Starting Date (Newest first)</SelectItem>
                    <SelectItem value="starting-date-asc">Starting Date (Oldest first)</SelectItem>
                    <SelectItem value="ending-date-desc">Ending Date (Newest first)</SelectItem>
                    <SelectItem value="ending-date-asc">Ending Date (Oldest first)</SelectItem>
                    <SelectItem value="person-name-asc">Person Name (A-Z)</SelectItem>
                    <SelectItem value="person-name-desc">Person Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Limpiar */}
              {(searchQuery || selectedPlaces.length > 0 || genderFilter !== "all") && (
                <button type="button" onClick={handleClearFilters} className="inline-flex h-9 items-center rounded-md border px-3 text-sm">
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>
            {!isLoading && filteredBanneds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredBanneds.length} of {banneds?.filter(hasPendingPlaces).length || 0} pending bans
              </p>
            )}
          </div>
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
      </DashboardLayout>
    </RouteGuard>
  );
}

