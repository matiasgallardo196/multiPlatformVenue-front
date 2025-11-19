"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  userName: string;
  role: string;
  email: string | null;
}

interface TeamMembersSectionProps {
  users: TeamMember[];
  isLoading?: boolean;
}

const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" => {
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    "head-manager": "destructive",
    manager: "default",
    staff: "secondary",
  };
  return variants[role] || "default";
};

export function TeamMembersSection({
  users,
  isLoading = false,
}: TeamMembersSectionProps) {
  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-lg sm:text-xl">Team Members</CardTitle>
          <CardDescription className="text-sm">Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-lg sm:text-xl">Team Members</CardTitle>
          <CardDescription className="text-sm">
            Users under your management
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            No users assigned to your place yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 pb-3">
        <div>
          <CardTitle className="text-base sm:text-lg">Team Members</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Users under your management ({users.length})
          </CardDescription>
        </div>
        <Link href="/users">
          <span className="text-xs sm:text-sm text-primary hover:underline">View all</span>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-2">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2.5 sm:p-3 bg-muted rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user.userName}
                  </p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  )}
                </div>
                <Badge variant={getRoleBadgeVariant(user.role)} className="ml-2 flex-shrink-0 text-xs">
                  {user.role}
                </Badge>
              </div>
            ))}
            {users.length > 5 && (
              <Link href="/users">
                <div className="text-center text-xs sm:text-sm text-muted-foreground hover:text-foreground pt-1">
                  View {users.length - 5} more...
                </div>
              </Link>
            )}
          </div>
      </CardContent>
    </Card>
  );
}

