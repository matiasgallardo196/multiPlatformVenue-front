"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BannedPlaceApproval } from "@/components/banned/banned-place-approval";
import { BannedDetailModal } from "@/components/banned/banned-detail-modal";
import { useApprovalQueueBanneds, usePlaces } from "@/hooks/queries";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { Badge } from "@/components/ui/badge";
import type { Banned } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";

export default function ApprovalQueuePage() {
  const { user } = useAuth();
  const [selectedBannedId, setSelectedBannedId] = useState<string | null>(null);
  const {
    data: banneds,
    isLoading: bannedsLoading,
    error: bannedsError,
  } = useApprovalQueueBanneds();
  const { data: places, isLoading: placesLoading } = usePlaces();

  // Only show for head-managers
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

  const isLoading = bannedsLoading || placesLoading;

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

  // Helper function to get pending places for this head-manager's place
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

  return (
    <RouteGuard>
      <DashboardLayout>
        <PageHeader
          title="Approval Queue"
          description="Review and approve pending ban requests for your place"
        />
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading approval queue...</span>
            </div>
          ) : !banneds || banneds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No pending approvals. All bans for your place have been reviewed.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {banneds.length} ban{banneds.length !== 1 ? "s" : ""}{" "}
                  pending approval
                </p>
              </div>

              <div className="space-y-4">
                {banneds.map((banned) => {
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
                              {banned.createdByUserId && (
                                <p>
                                  <span className="font-medium">Created by:</span>{" "}
                                  User ID: {banned.createdByUserId.slice(0, 8)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm font-medium">
                            Pending Place Approval:
                          </p>
                          {pendingPlaces.map((bp) => {
                            const place = places?.find(
                              (p) => p.id === bp.placeId
                            );
                            if (!place) return null;
                            return (
                              <div
                                key={bp.placeId}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <BannedPlaceApproval
                                  bannedId={banned.id}
                                  bannedPlace={bp}
                                  place={place}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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

