"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "./stats-card";
import { MapPin, UserX, AlertCircle, Users } from "lucide-react";
import Link from "next/link";

interface PlaceStat {
  placeId: string;
  placeName: string;
  activeBans: number;
  pendingBans: number;
  totalPersons: number;
}

interface PlacesOverviewProps {
  placesStats: PlaceStat[];
  isLoading?: boolean;
}

export function PlacesOverview({
  placesStats,
  isLoading = false,
}: PlacesOverviewProps) {
  if (isLoading) {
    return (
      <div className="mt-6 sm:mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Places Overview</CardTitle>
            <CardDescription className="text-sm">Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!placesStats || placesStats.length === 0) {
    return (
      <div className="mt-6 sm:mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Places Overview</CardTitle>
            <CardDescription className="text-sm">
              No registered places
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-6 sm:mt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Places Overview</CardTitle>
            <CardDescription className="text-sm">
              Statistics of all places ({placesStats.length})
            </CardDescription>
          </div>
          <Link href="/places">
            <span className="text-sm text-primary hover:underline">View all</span>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {placesStats.slice(0, 5).map((place) => (
              <div
                key={place.placeId}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {place.placeName}
                  </h3>
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">{place.activeBans}</p>
                      <p className="text-xs text-muted-foreground">Active bans</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">{place.pendingBans}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{place.totalPersons}</p>
                      <p className="text-xs text-muted-foreground">Persons</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {placesStats.length > 5 && (
              <Link href="/places">
                <div className="text-center text-sm text-muted-foreground hover:text-foreground pt-2">
                  View {placesStats.length - 5} more places...
                </div>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

