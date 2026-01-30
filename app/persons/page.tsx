"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PersonCreateDialog } from "@/components/person/person-create-dialog";
import { PersonEditDialog } from "@/components/person/person-edit-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FiltersButton } from "@/components/filters/filters-button";
import { ActiveFiltersChips, type ActiveFilter } from "@/components/filters/active-filters-chips";
import { FiltersModal, type FilterConfig, type FilterValues } from "@/components/filters/filters-modal";
import { CompactPagination } from "@/components/pagination/compact-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersons, useDeletePerson } from "@/hooks/queries";
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
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  User,
  Search,
  Building2,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { PersonWithAccess } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";

export default function PersonsPage() {
  const { toast } = useToast();
  const { isReadOnly } = useAuth();
  const deletePersonMutation = useDeletePerson();
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "Male" | "Female">(
    "all"
  );
  const [sortBy, setSortBy] = useState<
    "newest-first" | "oldest-first" | "name-asc" | "name-desc"
  >("newest-first");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [banStatusFilter, setBanStatusFilter] = useState<"all" | "active" | "pending" | "expired" | "none">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "owner" | "shared">("all");
  const [ownerVenueFilter, setOwnerVenueFilter] = useState<string | undefined>();

  // Debounce de búsqueda para no disparar por cada tecla
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Construir filtros para el hook
  const filters = useMemo(() => {
    const filterObj: {
      gender?: "all" | "Male" | "Female";
      search?: string;
      sortBy?: "newest-first" | "oldest-first" | "name-asc" | "name-desc";
      page?: number;
      limit?: number;
      banStatus?: "active" | "pending" | "expired" | "none";
      accessType?: "owner" | "shared";
      ownerPlaceId?: string;
    } = {};

    if (genderFilter !== "all") {
      filterObj.gender = genderFilter;
    }

    if (debouncedSearch.trim()) {
      filterObj.search = debouncedSearch;
    }

    if (sortBy) {
      filterObj.sortBy = sortBy;
    }

    if (banStatusFilter !== "all") {
      filterObj.banStatus = banStatusFilter;
    }

    if (sourceFilter !== "all") {
      filterObj.accessType = sourceFilter;
    }

    if (ownerVenueFilter) {
      filterObj.ownerPlaceId = ownerVenueFilter;
    }

    filterObj.page = page;
    filterObj.limit = limit;

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [genderFilter, debouncedSearch, sortBy, page, limit, banStatusFilter, sourceFilter, ownerVenueFilter]);

  const { data: personsPage, isLoading, error } = usePersons(filters);

  // Resetear a página 1 cuando cambian búsqueda/filtros/sort
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, genderFilter, sortBy, banStatusFilter, sourceFilter, ownerVenueFilter]);

  const hasActiveFilters = searchQuery || genderFilter !== "all" || banStatusFilter !== "all" || sourceFilter !== "all" || ownerVenueFilter;

  const handleClearFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
    setSortBy("newest-first");
    setBanStatusFilter("all");
    setSourceFilter("all");
    setOwnerVenueFilter(undefined);
  };

  const handleFiltersApply = (values: FilterValues) => {
    if (values.gender !== undefined) setGenderFilter(values.gender);
    if (values.sortBy !== undefined) setSortBy(values.sortBy as any);
    if (values.banStatus !== undefined) setBanStatusFilter(values.banStatus as any);
    if (values.source !== undefined) setSourceFilter(values.source as any);
    if (values.ownerPlaceId !== undefined) setOwnerVenueFilter(values.ownerPlaceId || undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (genderFilter !== "all") count++;
    if (banStatusFilter !== "all") count++;
    if (sourceFilter !== "all") count++;
    if (ownerVenueFilter) count++;
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
    if (banStatusFilter !== "all") {
      chips.push({
        key: "banStatus",
        label: "Ban Status",
        value: banStatusFilter === "active" ? "Banned" : banStatusFilter.charAt(0).toUpperCase() + banStatusFilter.slice(1),
        onRemove: () => setBanStatusFilter("all"),
      });
    }
    if (sourceFilter !== "all") {
      chips.push({
        key: "source",
        label: "Source",
        value: sourceFilter === "owner" ? "My venue" : "Shared with me",
        onRemove: () => setSourceFilter("all"),
      });
    }
    if (ownerVenueFilter) {
      chips.push({
        key: "ownerVenue",
        label: "From venue",
        value: ownerVenueFilter.substring(0, 8) + "...",
        onRemove: () => setOwnerVenueFilter(undefined),
      });
    }
    return chips;
  };

  // El ordenamiento se hace en el backend, solo usar directamente los datos
  const items = personsPage?.items || [];
  const total = personsPage?.total ?? 0;
  const currentPage = personsPage?.page ?? page;
  const currentLimit = personsPage?.limit ?? limit;
  const hasNext = personsPage?.hasNext ?? false;

  const handleDelete = async (id: string) => {
    try {
      await deletePersonMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Person deleted successfully.",
      });
    } catch (error: any) {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Failed to delete person. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getPersonName = (person: PersonWithAccess) => {
    return (
      [person.name, person.lastName].filter(Boolean).join(" ") ||
      person.nickname ||
      "Unknown"
    );
  };

  if (error) {
    return (
      <RouteGuard>
        <DashboardLayout>
          <PageHeader title="Persons" />
          <div className="text-center py-8">
            <p className="text-destructive">
              Error loading persons: {error.message}
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
          title="Persons"
          description="Manage individual person records and their information"
        >
          {!isReadOnly && (
            <PersonCreateDialog>
              <Button className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Add New Person
              </Button>
            </PersonCreateDialog>
          )}
        </PageHeader>

        <div className="space-y-6">
          {/* Search Input and Filters Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, last name, or nickname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base"
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading persons...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              {total === 0 ? (
                <>
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No persons</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating a new person.
                  </p>
                  {!isReadOnly && (
                    <div className="mt-6">
                      <PersonCreateDialog>
                        <Button className="cursor-pointer">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Person
                        </Button>
                      </PersonCreateDialog>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  No persons match your search criteria.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-row flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {total} {total === 1 ? "person" : "persons"}
                </p>
                <CompactPagination
                  currentPage={currentPage}
                  total={total}
                  limit={currentLimit}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                  hasNext={hasNext}
                />
              </div>

              <div className="max-h-[calc(100vh-280px)] overflow-y-auto border rounded-lg p-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((person) => {
                    const banBorderClass = 
                      person.banStatus === 'active' ? 'border-l-4 border-l-destructive' :
                      person.banStatus === 'pending' ? 'border-l-4 border-l-yellow-500' :
                      person.banStatus === 'expired' ? 'border-l-4 border-l-muted-foreground/50' : '';
                    
                    return (
                    <Card
                      key={person.id}
                      className={`transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${banBorderClass}`}
                      onClick={(e) => {
                        const modalOpen = document.querySelector(
                          '[data-slot="dialog-content"][data-state="open"], [data-slot="alert-dialog-content"][data-state="open"]'
                        );
                        if (modalOpen) return;
                        window.location.href = `/persons/${person.id}`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        const modalOpen = document.querySelector(
                          '[data-slot="dialog-content"][data-state="open"], [data-slot="alert-dialog-content"][data-state="open"]'
                        );
                        if (modalOpen) return;
                        window.location.href = `/persons/${person.id}`;
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={
                                  person.imagenProfileUrl?.[0] ||
                                  "/placeholder.svg"
                                }
                                alt={getPersonName(person)}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getPersonName(person)
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                  {getPersonName(person)}
                                </h3>
                                {person.banStatus === 'active' && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    Banned
                                  </Badge>
                                )}
                                {person.banStatus === 'pending' && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500 text-yellow-600">
                                    Pending
                                  </Badge>
                                )}
                                {person.banStatus === 'expired' && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Expired
                                  </Badge>
                                )}
                              </div>
                              {person.nickname &&
                                person.nickname !== getPersonName(person) && (
                                  <p className="text-sm text-muted-foreground">
                                    "{person.nickname}"
                                  </p>
                                )}
                              {person.gender && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Gender: {person.gender}
                                </p>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                asChild
                                className="cursor-pointer"
                              >
                                <Link
                                  href={`/persons/${person.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {!isReadOnly && (
                                <PersonEditDialog id={person.id}>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </PersonEditDialog>
                              )}
                              {!isReadOnly && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-destructive cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete person?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete the person and remove
                                        it from the list.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Keep Person
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(person.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Access Info Badges */}
                        <div className="flex flex-wrap gap-2">
                          {person.ownerPlaceName && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs gap-1 cursor-help">
                                  <Building2 className="h-3 w-3" />
                                  {person.accessType === "owner" ? "Owner" : "Shared"}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <span className="text-xs">
                                  {person.accessType === "owner" 
                                    ? `Your venue (${person.ownerPlaceName})` 
                                    : `Created by: ${person.ownerPlaceName}`}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {person.isShared && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs gap-1 cursor-help">
                                  <Share2 className="h-3 w-3" />
                                  Shared
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="text-xs">
                                  <p className="font-medium mb-1">Shared with:</p>
                                  <ul className="list-disc list-inside">
                                    {person.sharedWithPlaces?.map((place) => (
                                      <li key={place.id}>{place.name}</li>
                                    )) || <li>No venues</li>}
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {person.imagenProfileUrl &&
                          person.imagenProfileUrl.length > 1 && (
                            <div className="space-y-2">
                              <span className="text-sm text-muted-foreground">
                                Photos:
                              </span>
                              <div className="flex gap-1">
                                {person.imagenProfileUrl
                                  .slice(1, 4)
                                  .map((url, index) => (
                                    <Avatar key={index} className="h-6 w-6">
                                      <AvatarImage
                                        src={url || "/placeholder.svg"}
                                        alt={`Photo ${index + 2}`}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {index + 2}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                {person.imagenProfileUrl.length > 4 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                    +{person.imagenProfileUrl.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filters Modal */}
        <FiltersModal
          open={isFiltersModalOpen}
          onOpenChange={setIsFiltersModalOpen}
          config={{
            gender: true,
            sortBy: true,
            banStatus: true,
            source: true,
          }}
          values={{
            gender: genderFilter,
            sortBy: sortBy,
            banStatus: banStatusFilter,
            source: sourceFilter,
            ownerPlaceId: ownerVenueFilter,
          }}
          onApply={handleFiltersApply}
          onClearAll={handleClearFilters}
          sortOptions={[
            { value: "newest-first", label: "Newest first" },
            { value: "oldest-first", label: "Oldest first" },
            { value: "name-asc", label: "Name A-Z" },
            { value: "name-desc", label: "Name Z-A" },
          ]}
        />
      </DashboardLayout>
    </RouteGuard>
  );
}
