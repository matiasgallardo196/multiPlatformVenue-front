"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlaceCreateDialog } from "@/components/place/place-create-dialog";
import { PlaceEditDialog } from "@/components/place/place-edit-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlaces, useDeletePlace } from "@/hooks/queries";
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
import type { Place } from "@/lib/types";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  Search,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { CompactPagination } from "@/components/pagination/compact-pagination";

export default function PlacesPage() {
  const { toast } = useToast();
  const { isReadOnly, isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: placesPage,
    isLoading,
    error,
  } = usePlaces({ page, limit, search: debouncedSearch });

  const places = placesPage?.items || [];
  const total = placesPage?.total ?? 0;
  const currentPage = placesPage?.page ?? page;
  const currentLimit = placesPage?.limit ?? limit;
  const hasNext = placesPage?.hasNext ?? false;

  const filteredPlaces = places; // Ya viene filtrado del backend

  const deletePlace = useDeletePlace();

  const handleDelete = async (id: string) => {
    try {
      await deletePlace.mutateAsync(id);
      toast({
        title: "Success",
        description: "Place deleted successfully.",
      });
    } catch (error: any) {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Failed to delete place. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <RouteGuard requireHeadManager>
      <DashboardLayout>
        {error ? (
          <>
            <PageHeader title="Places" />
            <div className="text-center py-8">
              <p className="text-destructive">
                Error loading places: {error.message}
              </p>
            </div>
          </>
        ) : (
          <>
            <PageHeader
              title="Places"
              description="Manage locations and venues in the system"
            >
              {isAdmin && (
                <PlaceCreateDialog>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Place
                  </Button>
                </PlaceCreateDialog>
              )}
            </PageHeader>

            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search places by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading places...</span>
                </div>
              ) : filteredPlaces.length === 0 ? (
                <div className="text-center py-8">
                  {places?.length === 0 ? (
                    <>
                      <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No places</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get started by creating a new place.
                      </p>
                      <div className="mt-6">
                        {isAdmin && (
                          <PlaceCreateDialog>
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Add New Place
                            </Button>
                          </PlaceCreateDialog>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      No places match your search criteria.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {total} {total === 1 ? "place" : "places"}
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
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredPlaces.map((place: Place) => (
                      <Card
                        key={place.id}
                        className="transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {place.name || "Unnamed Place"}
                                </h3>
                                {place.city && (
                                  <p className="text-sm text-muted-foreground">
                                    {place.city}
                                  </p>
                                )}
                                {place.placeEmail && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Mail className="h-3 w-3" />
                                    {place.placeEmail}
                                  </p>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!isReadOnly && (
                                  <PlaceEditDialog id={place.id}>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  </PlaceEditDialog>
                                )}
                                {isAdmin && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive cursor-pointer">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete place?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This
                                          will permanently delete the place and
                                          remove it from the list.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Keep Place
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(place.id)}
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
                       </Card>
                     ))}
                    </div>
                  </div>
                 </>
               )}
            </div>
          </>
        )}
      </DashboardLayout>
    </RouteGuard>
  );
}
