"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PersonCreateDialog } from "@/components/person/person-create-dialog";
import { PersonEditDialog } from "@/components/person/person-edit-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Filter,
  X,
  ArrowUpDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { Person } from "@/lib/types";
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

  // Construir filtros para el hook
  const filters = useMemo(() => {
    const filterObj: {
      gender?: "all" | "Male" | "Female";
      search?: string;
      sortBy?: "newest-first" | "oldest-first" | "name-asc" | "name-desc";
    } = {};

    if (genderFilter !== "all") {
      filterObj.gender = genderFilter;
    }

    if (searchQuery.trim()) {
      filterObj.search = searchQuery;
    }

    if (sortBy) {
      filterObj.sortBy = sortBy;
    }

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [genderFilter, searchQuery, sortBy]);

  const { data: persons, isLoading, error } = usePersons(filters);

  const hasActiveFilters = searchQuery || genderFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
  };

  // El ordenamiento se hace en el backend, solo usar directamente los datos
  const sortedPersons = persons || [];

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

  const getPersonName = (person: Person) => {
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
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, last name, or nickname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>

            {/* Gender Filter */}
            <Select
              value={genderFilter}
              onValueChange={(value: "all" | "Male" | "Female") =>
                setGenderFilter(value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sort:</span>
              <Select
                value={sortBy}
                onValueChange={(
                  value:
                    | "newest-first"
                    | "oldest-first"
                    | "name-asc"
                    | "name-desc"
                ) => setSortBy(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest-first">Newest first</SelectItem>
                  <SelectItem value="oldest-first">Oldest first</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {genderFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Gender: {genderFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setGenderFilter("all")}
                  />
                </Badge>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading persons...</span>
            </div>
          ) : sortedPersons.length === 0 ? (
            <div className="text-center py-8">
              {persons?.length === 0 ? (
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {sortedPersons.length} of {sortedPersons.length}{" "}
                  persons
                </p>
              </div>

              <div className="max-h-[calc(100vh-400px)] overflow-y-auto border rounded-lg p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sortedPersons.map((person) => (
                    <Card
                      key={person.id}
                      className="transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
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
                              <h3 className="font-semibold">
                                {getPersonName(person)}
                              </h3>
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
                        {person.incidents && person.incidents.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Incidents:
                            </span>
                            <Badge variant="outline">
                              {person.incidents.length}
                            </Badge>
                          </div>
                        )}

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
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
