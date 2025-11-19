"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "./stats-card";
import { UserX, AlertCircle, Users, UserCheck } from "lucide-react";

interface PlaceDashboardSectionProps {
  placeName: string | null;
  placeStats: {
    activeBans: number;
    pendingBans: number;
    totalPersons: number;
  };
  totalPersons?: number; // Total persons del sistema
  teamMembersCount?: number; // Solo para head-manager
  isLoading?: boolean;
}

export function PlaceDashboardSection({
  placeName,
  placeStats,
  totalPersons,
  teamMembersCount,
  isLoading = false,
}: PlaceDashboardSectionProps) {
  // Determinar cuántas columnas necesitamos según las estadísticas disponibles
  const statsCount = 3 + (totalPersons !== undefined ? 1 : 0) + (teamMembersCount !== undefined ? 1 : 0);
  const gridCols = statsCount <= 3 ? "lg:grid-cols-3" : statsCount === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5";

  return (
    <div className="mt-6 sm:mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            {placeName ? `${placeName} - Overview` : "Place Overview"}
          </CardTitle>
          <CardDescription className="text-sm">
            Complete information about your assigned place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${gridCols}`}>
            {totalPersons !== undefined && (
              <StatsCard
                title="Total Persons"
                value={totalPersons}
                description="Registered individuals"
                icon={Users}
                isLoading={isLoading}
              />
            )}
            
            {teamMembersCount !== undefined && (
              <StatsCard
                title="Team Members"
                value={teamMembersCount}
                description="Users under management"
                icon={UserCheck}
                isLoading={isLoading}
              />
            )}

            <StatsCard
              title="Active Bans"
              value={placeStats.activeBans}
              description="Currently active bans"
              icon={UserX}
              isLoading={isLoading}
              variant="destructive"
            />
            
            <StatsCard
              title="Pending Approvals"
              value={placeStats.pendingBans}
              description="Bans awaiting approval"
              icon={AlertCircle}
              isLoading={isLoading}
              variant="warning"
              linkTo="/banneds/approval-queue"
            />
            
            <StatsCard
              title="Related Persons"
              value={placeStats.totalPersons}
              description="Persons with bans in this place"
              icon={Users}
              isLoading={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

