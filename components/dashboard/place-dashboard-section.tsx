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
  // Para el layout de cuadrantes, usar un grid más compacto
  // Máximo 3 columnas en desktop para que se vea bien en el cuadrante
  const statsCount = 3 + (totalPersons !== undefined ? 1 : 0) + (teamMembersCount !== undefined ? 1 : 0);
  // En cuadrantes, limitamos a 2-3 columnas máximo
  const gridCols = statsCount <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-3";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-base sm:text-lg">
          {placeName ? `${placeName} - Overview` : "Place Overview"}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Complete information about your assigned place
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className={`grid gap-3 grid-cols-2 ${gridCols}`}>
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
  );
}

