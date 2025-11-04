"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { BannedCard } from "@/components/banned/banned-card";
import { BannedDetailModal } from "@/components/banned/banned-detail-modal";
import { usePendingBanneds, usePlaces } from "@/hooks/queries";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/auth/route-guard";
import { Badge } from "@/components/ui/badge";
import type { Banned } from "@/lib/types";

export default function PendingBannedsPage() {
  const { user } = useAuth();
  const [selectedBannedId, setSelectedBannedId] = useState<string | null>(null);
  const {
    data: banneds,
    isLoading: bannedsLoading,
    error: bannedsError,
  } = usePendingBanneds();
  const { data: places, isLoading: placesLoading } = usePlaces();

  // Only show for managers
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

  const isLoading = bannedsLoading || placesLoading;

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

  // Helper function to get pending places for a ban
  const getPendingPlaces = (banned: Banned) => {
    return banned.bannedPlaces?.filter(
      (bp) => bp.status === 'pending'
    ) || [];
  };

  const hasPendingPlaces = (banned: Banned) => {
    return getPendingPlaces(banned).length > 0;
  };

  return (
    <RouteGuard>
      <DashboardLayout>
        <PageHeader
          title="Pending Bans"
          description="Bans waiting for approval from head-managers"
        />
        <div className="space-y-6">
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

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {banneds
                  .filter(hasPendingPlaces)
                  .map((banned) => {
                    const pendingPlaces = getPendingPlaces(banned);
                    const approvedPlaces =
                      banned.bannedPlaces?.filter(
                        (bp) => bp.status === 'approved'
                      ) || [];

                    return (
                      <div key={banned.id} className="relative">
                        <div
                          onClick={() => setSelectedBannedId(banned.id)}
                          className="cursor-pointer"
                        >
                          <BannedCard
                            banned={banned}
                            places={places || []}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            readOnly={true}
                          />
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2">
                          {pendingPlaces.length > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                              {pendingPlaces.length} Pending
                            </Badge>
                          )}
                          {approvedPlaces.length > 0 && (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                              {approvedPlaces.length} Approved
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="text-xs font-medium mb-1">
                            Pending Places:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {pendingPlaces.map((bp) => {
                              const place = places?.find((p) => p.id === bp.placeId);
                              return (
                                <Badge
                                  key={bp.placeId}
                                  variant="outline"
                                  className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800"
                                >
                                  {place?.name || "Unknown Place"}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
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

