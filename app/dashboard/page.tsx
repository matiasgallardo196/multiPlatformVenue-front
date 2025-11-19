"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardSummary, type DashboardSummaryAdmin, type DashboardSummaryHeadManager, type DashboardSummaryManager } from "@/hooks/queries";
import { Users, MapPin, UserX, UserCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import dynamic from "next/dynamic";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PlaceDashboardSection } from "@/components/dashboard/place-dashboard-section";
import { TeamMembersSection } from "@/components/dashboard/team-members-section";
import { PlacesOverview } from "@/components/dashboard/places-overview";
import { UsersByRole } from "@/components/dashboard/users-by-role";
import { RecentActivitySection } from "@/components/dashboard/recent-activity-section";

const BannedCreateFullDialog = dynamic(
  () => import("@/components/banned/banned-create-full-dialog").then(m => m.BannedCreateFullDialog),
  { ssr: false }
);
const PersonCreateDialog = dynamic(
  () => import("@/components/person/person-create-dialog").then(m => m.PersonCreateDialog),
  { ssr: false }
);
import { RouteGuard } from "@/components/auth/route-guard";

function getDashboardDescription(role?: string | null): string {
  switch (role) {
    case "admin":
      return "Complete system overview";
    case "head-manager":
      return "Overview of your place and team";
    case "manager":
      return "Overview of your assigned place";
    case "staff":
      return "System overview";
    default:
      return "Overview of your admin system";
  }
}

export default function DashboardPage() {
  const { isReadOnly, user, loading } = useAuth();
  const enabled = !!user && !loading;
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(enabled);

  const isLoading = summaryLoading;
  const isAdmin = user?.role === "admin";
  const isHeadManager = user?.role === "head-manager";
  const isManager = user?.role === "manager";

  // Determinar qué tipo de resumen tenemos
  const adminSummary = isAdmin ? (summary as DashboardSummaryAdmin | undefined) : undefined;
  const headManagerSummary = isHeadManager ? (summary as DashboardSummaryHeadManager | undefined) : undefined;
  const managerSummary = isManager ? (summary as DashboardSummaryManager | undefined) : undefined;

  return (
    <RouteGuard>
      <DashboardLayout>
        <PageHeader
          title="Dashboard"
          description={getDashboardDescription(user?.role)}
        />

        {/* Estadísticas principales - Solo para STAFF y ADMIN */}
        {!(isHeadManager || isManager) && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Persons"
              value={summary?.totals.totalPersons}
              description="Registered individuals"
              icon={Users}
              isLoading={isLoading}
            />

            {!isAdmin && (
              <StatsCard
                title="Active Bans"
                value={summary?.totals.activeBans}
                description="Currently active"
                icon={UserX}
                isLoading={isLoading}
                variant="destructive"
              />
            )}

            {isAdmin && adminSummary && (
              <>
                <StatsCard
                  title="Active Bans"
                  value={adminSummary.totals.activeBans}
                  description="Currently active"
                  icon={UserX}
                  isLoading={isLoading}
                  variant="destructive"
                />
                <StatsCard
                  title="Total Places"
                  value={adminSummary.totals.totalPlaces}
                  description="Registered locations"
                  icon={MapPin}
                  isLoading={isLoading}
                />
                <StatsCard
                  title="Total Users"
                  value={adminSummary.totals.totalUsers}
                  description="System users"
                  icon={UserCheck}
                  isLoading={isLoading}
                />
              </>
            )}
          </div>
        )}

        {/* Secciones específicas por rol */}
        {isAdmin && adminSummary && (
          <>
            <UsersByRole usersByRole={adminSummary.usersByRole} isLoading={isLoading} />
            <PlacesOverview placesStats={adminSummary.placesStats} isLoading={isLoading} />
          </>
        )}

        {(isHeadManager || isManager) && (headManagerSummary || managerSummary) && (
          <PlaceDashboardSection
            placeName={headManagerSummary?.placeName ?? managerSummary?.placeName ?? null}
            placeStats={headManagerSummary?.placeStats ?? managerSummary?.placeStats!}
            totalPersons={summary?.totals.totalPersons}
            teamMembersCount={headManagerSummary?.usersUnderManagement?.length}
            isLoading={isLoading}
          />
        )}

        {isHeadManager && headManagerSummary && headManagerSummary.usersUnderManagement && (
          <TeamMembersSection
            users={headManagerSummary.usersUnderManagement}
            isLoading={isLoading}
          />
        )}

        {/* Actividad reciente */}
        {summary && "recentActivity" in summary && summary.recentActivity && (
          <RecentActivitySection
            activity={summary.recentActivity}
            isLoading={isLoading}
            role={user?.role}
          />
        )}

        {/* Acciones rápidas */}
        {!isReadOnly && (
          <div className="mt-6 sm:mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                <CardDescription className="text-sm">Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <PersonCreateDialog
                    onCreated={(person) => {
                      window.location.href = `/persons/${person.id}`;
                    }}
                  >
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg hover:bg-muted/80 transition cursor-pointer active:scale-[0.98]">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-medium text-sm sm:text-base">Add Person</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Register new individual
                        </p>
                      </div>
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
                    </div>
                  </PersonCreateDialog>
                  <BannedCreateFullDialog redirectOnSuccess>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg hover:bg-muted/80 transition cursor-pointer active:scale-[0.98]">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-medium text-sm sm:text-base">Create New Ban</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Add a new ban record
                        </p>
                      </div>
                      <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
                    </div>
                  </BannedCreateFullDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </RouteGuard>
  );
}
