"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
import { useIncidents, useDeleteIncident } from "@/hooks/queries";
import { IncidentCreateDialog } from "@/components/incident/incident-create-dialog";
import { IncidentEditDialog } from "@/components/incident/incident-edit-dialog";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  MapPin,
  User,
  Camera,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { Incident } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export default function IncidentsPage() {
  const { toast } = useToast();
  const { isReadOnly } = useAuth();
  const { data: incidents, isLoading, error } = useIncidents();
  const deleteIncidentMutation = useDeleteIncident();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    if (!searchQuery) return incidents;

    return incidents.filter((incident) => {
      const person = incident.person;
      const personName = [person?.name, person?.lastName, person?.nickname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const placeName = (incident.place?.name || "").toLowerCase();
      const details = (incident.details || "").toLowerCase();
      const searchTerm = searchQuery.toLowerCase();

      return (
        personName.includes(searchTerm) ||
        placeName.includes(searchTerm) ||
        details.includes(searchTerm)
      );
    });
  }, [incidents, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this incident?")) return;

    try {
      await deleteIncidentMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Incident deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete incident. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPersonName = (incident: Incident) => {
    const person = incident.person;
    if (!person) return "Unknown Person";
    return (
      [person.name, person.lastName].filter(Boolean).join(" ") ||
      person.nickname ||
      "Unknown"
    );
  };

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Incidents" />
        <div className="text-center py-8">
          <p className="text-destructive">
            Error loading incidents: {error.message}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Incidents"
        description="Track and manage incident reports"
      >
        {!isReadOnly && (
          <IncidentCreateDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Incident
            </Button>
          </IncidentCreateDialog>
        )}
      </PageHeader>

      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by person, place, or incident details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading incidents...</span>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-8">
            {incidents?.length === 0 ? (
              <>
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No incidents</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by creating a new incident report.
                </p>
                {!isReadOnly && (
                  <div className="mt-6">
                    <IncidentCreateDialog>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Incident
                      </Button>
                    </IncidentCreateDialog>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                No incidents match your search criteria.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredIncidents.length} of {incidents?.length || 0}{" "}
                incidents
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIncidents.map((incident) => (
                <Card
                  key={incident.id}
                  className="transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/incidents/${incident.id}`)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            Incident #{incident.id.slice(-8)}
                          </h3>
                          {incident.banned && (
                            <Badge variant="destructive" className="mt-1">
                              Has Ban
                            </Badge>
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
                              href={`/incidents/${incident.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {!isReadOnly && (
                            <IncidentEditDialog id={incident.id}>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </IncidentEditDialog>
                          )}
                          {!isReadOnly && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(incident.id);
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
                    {/* Person */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              incident.person?.imagenProfileUrl?.[0] ||
                              "/placeholder.svg"
                            }
                            alt={getPersonName(incident)}
                          />
                          <AvatarFallback className="text-xs">
                            {getPersonName(incident)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {getPersonName(incident)}
                        </span>
                      </div>
                    </div>

                    {/* Place */}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {incident.place?.name || "Unknown Location"}
                      </span>
                    </div>

                    {/* Details */}
                    {incident.details && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">
                          Details:
                        </span>
                        <p className="text-sm bg-muted p-2 rounded text-pretty line-clamp-2">
                          {incident.details}
                        </p>
                      </div>
                    )}

                    {/* Photos */}
                    {incident.photoBook && incident.photoBook.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {incident.photoBook.length} photo(s)
                        </span>
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
