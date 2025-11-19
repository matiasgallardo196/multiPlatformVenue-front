"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Shield, UserCog, LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

interface StatItem {
  icon: LucideIcon;
  title: string;
  value: number;
  description: string;
  variant?: "default" | "secondary" | "destructive";
}

export function TeamMembersSection({
  users,
  isLoading = false,
}: TeamMembersSectionProps) {
  // Contar usuarios por rol
  const totalUsers = users?.length || 0;
  const staffCount = users?.filter((u) => u.role === "staff").length || 0;
  const managersCount = users?.filter((u) => u.role === "manager").length || 0;
  const headManagersCount = users?.filter((u) => u.role === "head-manager").length || 0;

  // Construir las estadísticas
  const stats: StatItem[] = [
    {
      icon: Users,
      title: "Total Team Members",
      value: totalUsers,
      description: "All users under management",
    },
    {
      icon: UserCheck,
      title: "Staff",
      value: staffCount,
      description: "Staff members",
      variant: "secondary",
    },
    {
      icon: Shield,
      title: "Managers",
      value: managersCount,
      description: "Manager roles",
      variant: "default",
    },
    {
      icon: UserCog,
      title: "Head Managers",
      value: headManagersCount,
      description: "Head manager roles",
      variant: "destructive",
    },
  ];

  const StatCard = ({ item }: { item: StatItem }) => {
    const Icon = item.icon;
    const valueClass =
      item.variant === "destructive"
        ? "text-destructive"
        : item.variant === "secondary"
        ? "text-muted-foreground"
        : "";

    return (
      <div
        className={cn(
          "flex flex-col p-1.5 rounded-lg border transition-colors h-full bg-muted/30"
        )}
      >
        <div className="flex items-start justify-between mb-1">
          <div
            className={cn(
              "flex-shrink-0 p-1 rounded-md",
              item.variant === "destructive"
                ? "bg-destructive/10"
                : item.variant === "secondary"
                ? "bg-muted"
                : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                item.variant === "destructive"
                  ? "text-destructive"
                  : item.variant === "secondary"
                  ? "text-muted-foreground"
                  : "text-muted-foreground"
              )}
            />
          </div>
          {isLoading ? (
            <div className="text-xl font-bold text-muted-foreground">-</div>
          ) : (
            <div className={cn("text-xl font-bold", valueClass)}>
              {item.value ?? 0}
            </div>
          )}
        </div>
        <div className="space-y-0">
          <p className="text-sm font-medium leading-tight">{item.title}</p>
          <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col gap-2">
        <CardHeader className="flex-shrink-0 pb-1 px-4 pt-1 gap-1">
          <CardTitle className="text-base font-semibold">Team Members</CardTitle>
          <CardDescription className="text-xs leading-tight">Loading...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-1">
          <div className="grid grid-cols-2 gap-1.5 h-full">
            {stats.map((stat, index) => (
              <StatCard key={index} item={stat} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card className="h-full flex flex-col gap-2">
        <CardHeader className="flex-shrink-0 pb-1 px-4 pt-1 gap-1">
          <CardTitle className="text-base font-semibold">Team Members</CardTitle>
          <CardDescription className="text-xs leading-tight">
            Users under your management
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-1">
          <div className="grid grid-cols-2 gap-1.5 h-full">
            {stats.map((stat, index) => (
              <StatCard key={index} item={stat} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col gap-2">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 pb-1 px-4 pt-1 gap-1">
        <div>
          <CardTitle className="text-base font-semibold">Team Members</CardTitle>
          <CardDescription className="text-xs leading-tight">
            Users under your management
          </CardDescription>
        </div>
        <Link href="/users">
          <span className="text-xs text-primary hover:underline">View all</span>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-1">
        <div className="grid grid-cols-2 gap-1.5 h-full">
          {stats.map((stat, index) => (
            <StatCard key={index} item={stat} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

