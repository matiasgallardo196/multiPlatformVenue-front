"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "./stats-card";
import { Shield, UserCheck, Users, User } from "lucide-react";
import Link from "next/link";

interface UsersByRoleProps {
  usersByRole: {
    admin: number;
    "head-manager": number;
    manager: number;
    staff: number;
  };
  isLoading?: boolean;
}

export function UsersByRole({
  usersByRole,
  isLoading = false,
}: UsersByRoleProps) {
  const totalUsers =
    usersByRole.admin +
    usersByRole["head-manager"] +
    usersByRole.manager +
    usersByRole.staff;

  return (
    <div className="mt-6 sm:mt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Users by Role</CardTitle>
            <CardDescription className="text-sm">
              User distribution in the system
            </CardDescription>
          </div>
          <Link href="/users">
            <span className="text-sm text-primary hover:underline">View all</span>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Admin"
              value={usersByRole.admin}
              description="Administrators"
              icon={Shield}
              isLoading={isLoading}
            />
            <StatsCard
              title="Head Managers"
              value={usersByRole["head-manager"]}
              description="Head managers"
              icon={UserCheck}
              isLoading={isLoading}
            />
            <StatsCard
              title="Managers"
              value={usersByRole.manager}
              description="Managers"
              icon={Users}
              isLoading={isLoading}
            />
            <StatsCard
              title="Staff"
              value={usersByRole.staff}
              description="Staff members"
              icon={User}
              isLoading={isLoading}
            />
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Total users: <span className="font-semibold">{totalUsers}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

