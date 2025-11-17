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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Persons
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">-</div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalPersons}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Loading..." : "Registered individuals"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bans</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">-</div>
              ) : (
                <div className="text-2xl font-bold text-destructive">
                  {stats.activeBans}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
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
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-2xl font-bold">-</div>
                ) : (
                  <div className="text-2xl font-bold">{stats.totalPlaces}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Loading..." : "Registered locations"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Admin Dashboard</CardTitle>
              <CardDescription>
                Manage banned persons, places, and more from this
                central dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use the sidebar navigation to access different sections:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    • <strong>Banned:</strong> View and manage banned persons
                    with photos, dates, and associated places
                  </li>
                  <li>
                    • <strong>Persons:</strong> Manage individual person records
                    and their profile information
                  </li>
                  {!isReadOnly && (
                    <li>
                      • <strong>Places:</strong> Manage locations and venues in
                      the system
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {!isReadOnly && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <PersonCreateDialog
                    onCreated={(person) => {
                      window.location.href = `/persons/${person.id}`;
                    }}
                  >
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition cursor-pointer">
                      <div>
                        <p className="font-medium">Add Person</p>
                        <p className="text-sm text-muted-foreground">
                          Register new individual
                        </p>
                      </div>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </PersonCreateDialog>
                  <BannedCreateFullDialog redirectOnSuccess>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition cursor-pointer">
                      <div>
                        <p className="font-medium">Create New Ban</p>
                        <p className="text-sm text-muted-foreground">
                          Add a new ban record
                        </p>
                      </div>
                      <UserX className="h-5 w-5 text-muted-foreground" />
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
