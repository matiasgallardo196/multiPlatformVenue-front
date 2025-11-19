"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, AlertCircle, Users, LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlaceDashboardSectionProps {
  placeName: string | null;
  placeStats: {
    activeBans: number;
    pendingBans: number;
    totalPersons: number;
  };
  totalPersons?: number; // Total persons del sistema
  isLoading?: boolean;
}

interface StatItem {
  icon: LucideIcon;
  title: string;
  value: number | undefined;
  description: string;
  variant?: "default" | "destructive" | "warning";
  linkTo?: string;
}

export function PlaceDashboardSection({
  placeName,
  placeStats,
  totalPersons,
  isLoading = false,
}: PlaceDashboardSectionProps) {
  // Construir la lista de estadísticas
  const stats: StatItem[] = [];

  if (totalPersons !== undefined) {
    stats.push({
      icon: Users,
      title: "Total Persons",
      value: totalPersons,
      description: "Registered individuals",
    });
  }

  stats.push({
    icon: UserX,
    title: "Active Bans",
    value: placeStats.activeBans,
    description: "Currently active bans",
    variant: "destructive",
  });

  stats.push({
    icon: AlertCircle,
    title: "Pending Approvals",
    value: placeStats.pendingBans,
    description: "Bans awaiting approval",
    variant: "warning",
    linkTo: "/banneds/approval-queue",
  });

  stats.push({
    icon: Users,
    title: "Related Persons",
    value: placeStats.totalPersons,
    description: "Persons with bans in this place",
  });

  const StatCard = ({ item }: { item: StatItem }) => {
    const Icon = item.icon;
    const valueClass =
      item.variant === "destructive"
        ? "text-destructive"
        : item.variant === "warning"
        ? "text-yellow-600 dark:text-yellow-500"
        : "";

    const content = (
      <div
        className={cn(
          "flex flex-col p-1.5 rounded-lg border transition-colors h-full",
          item.linkTo
            ? "hover:bg-muted/50 cursor-pointer hover:border-primary/50"
            : "bg-muted/30"
        )}
      >
        <div className="flex items-start justify-between mb-1">
          <div
            className={cn(
              "flex-shrink-0 p-1 rounded-md",
              item.variant === "destructive"
                ? "bg-destructive/10"
                : item.variant === "warning"
                ? "bg-yellow-500/10"
                : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                item.variant === "destructive"
                  ? "text-destructive"
                  : item.variant === "warning"
                  ? "text-yellow-600 dark:text-yellow-500"
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

    if (item.linkTo) {
      return (
        <Link href={item.linkTo} className="block h-full">
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <Card className="h-full flex flex-col gap-2">
      <CardHeader className="flex-shrink-0 pb-1 px-4 pt-1 gap-1">
        <CardTitle className="text-base font-semibold">
          {placeName ? `${placeName} - Overview` : "Place Overview"}
        </CardTitle>
        <CardDescription className="text-xs leading-tight">
          Complete information about your assigned place
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

