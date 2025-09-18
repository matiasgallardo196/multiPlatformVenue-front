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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersons, useDeletePerson } from "@/hooks/queries";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  User,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { Person } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export default function PersonsPage() {
  const { toast } = useToast();
  const { isReadOnly } = useAuth();
  const { data: persons, isLoading, error } = usePersons();
  const deletePersonMutation = useDeletePerson();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPersons = useMemo(() => {
    if (!persons) return [];
    if (!searchQuery) return persons;

    return persons.filter((person) => {
      const fullName = [person.name, person.lastName, person.nickname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [persons, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this person?")) return;

    try {
      await deletePersonMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Person deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete person. Please try again.",
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
      <DashboardLayout>
        <PageHeader title="Persons" />
        <div className="text-center py-8">
          <p className="text-destructive">
            Error loading persons: {error.message}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Persons"
        description="Manage individual person records and their information"
      >
        {!isReadOnly && (
          <PersonCreateDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Person
            </Button>
          </PersonCreateDialog>
        )}
      </PageHeader>

      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, last name, or nickname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading persons...</span>
          </div>
        ) : filteredPersons.length === 0 ? (
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
                      <Button>
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
                Showing {filteredPersons.length} of {persons?.length || 0}{" "}
                persons
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPersons.map((person) => (
                <Card
                  key={person.id}
                  className="transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/persons/${person.id}`)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              person.imagenProfileUrl?.[0] || "/placeholder.svg"
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
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/persons/${person.id}`}
                              onClick={(e) => e.stopPropagation()}
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
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </PersonEditDialog>
                          )}
                          {!isReadOnly && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(person.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
