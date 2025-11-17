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
import { useDashboardSummary } from "@/hooks/queries";
import { Users, MapPin, UserX } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import dynamic from "next/dynamic";
const BannedCreateFullDialog = dynamic(
  () => import("@/components/banned/banned-create-full-dialog").then(m => m.BannedCreateFullDialog),
  { ssr: false }
);
const PersonCreateDialog = dynamic(
  () => import("@/components/person/person-create-dialog").then(m => m.PersonCreateDialog),
  { ssr: false }
);
import { RouteGuard } from "@/components/auth/route-guard";

export default function DashboardPage() {
  const { isReadOnly, user, loading } = useAuth();
  const enabled = !!user && !loading;
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(enabled);

  const stats = useMemo(() => {
    return {
      totalPersons: summary?.totals.totalPersons ?? 0,
      activeBans: summary?.totals.activeBans ?? 0,
      totalPlaces: summary?.totals.totalPlaces ?? 0,
    };
  }, [summary]);

  const isLoading = summaryLoading;

  return (
    <RouteGuard>
      <DashboardLayout>
        <PageHeader
          title="Dashboard"
          description="Overview of your admin system"
        />

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Persons
              </CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-xl sm:text-2xl font-bold">-</div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold">{stats.totalPersons}</div>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isLoading ? "Loading..." : "Registered individuals"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bans</CardTitle>
              <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-xl sm:text-2xl font-bold">-</div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-destructive">
                  {stats.activeBans}
                </div>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isLoading ? "Loading..." : "Currently active"}
              </p>
            </CardContent>
          </Card>

          {!isReadOnly && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Places
                </CardTitle>
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-xl sm:text-2xl font-bold">-</div>
                ) : (
                  <div className="text-xl sm:text-2xl font-bold">{stats.totalPlaces}</div>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {isLoading ? "Loading..." : "Registered locations"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Welcome to Admin Dashboard</CardTitle>
              <CardDescription className="text-sm">
                Manage banned persons, places, and more from this
                central dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use the sidebar navigation to access different sections:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">•</span>
                    <span>
                      <strong>Banned:</strong> View and manage banned persons
                      with photos, dates, and associated places
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">•</span>
                    <span>
                      <strong>Persons:</strong> Manage individual person records
                      and their profile information
                    </span>
                  </li>
                  {!isReadOnly && (
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>
                        <strong>Places:</strong> Manage locations and venues in
                        the system
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {!isReadOnly && (
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
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
