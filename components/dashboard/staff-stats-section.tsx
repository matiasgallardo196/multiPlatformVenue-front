"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, Users, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffStatsSectionProps {
  placeName: string | null;
  placeStats: {
    activeBans: number;
    pendingBans: number;
    totalPersons: number;
  };
  totalPersons?: number;
  isLoading?: boolean;
}

interface StatItem {
  icon: LucideIcon;
  title: string;
  value: number | undefined;
  description: string;
  variant?: "default" | "destructive";
}

export function StaffStatsSection({
  placeName,
  placeStats,
  totalPersons,
  isLoading = false,
}: StaffStatsSectionProps) {
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
    icon: Users,
    title: "Related Persons",
    value: placeStats.totalPersons,
    description: "Persons with bans in this place",
  });

  const StatCard = ({ item }: { item: StatItem }) => {
    const Icon = item.icon;
    const valueClass = item.variant === "destructive" ? "text-destructive" : "";

    return (
      <div
        className={cn(
          "flex flex-col p-1 lg:p-1.5 rounded-lg border transition-colors h-full min-h-0 bg-muted/30"
        )}
      >
        <div className="flex items-start justify-between mb-0.5 lg:mb-1">
          <div
            className={cn(
              "flex-shrink-0 p-0.5 lg:p-1 rounded-md",
              item.variant === "destructive" ? "bg-destructive/10" : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                item.variant === "destructive"
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            />
          </div>
          {isLoading ? (
            <div className="text-lg sm:text-xl font-bold text-muted-foreground">-</div>
          ) : (
            <div className={cn("text-lg sm:text-xl font-bold", valueClass)}>
              {item.value ?? 0}
            </div>
          )}
        </div>
        <div className="space-y-0 flex-1 min-h-0 flex flex-col justify-end">
          <p className="text-xs sm:text-sm font-medium leading-tight">{item.title}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col gap-0.5 lg:gap-1 py-1 min-h-0">
      <CardHeader className="flex-shrink-0 pb-0.5 lg:pb-0 px-3 sm:px-4 pt-0.5 lg:pt-0.5 gap-0.5">
        <CardTitle className="text-sm sm:text-base font-semibold">
          {placeName ? `${placeName} - Statistics` : "Place Statistics"}
        </CardTitle>
        <CardDescription className="text-xs leading-tight">
          Information about your assigned place
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0.5 lg:p-1 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-1 lg:gap-1 h-full">
          {stats.map((stat, index) => (
            <StatCard key={index} item={stat} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

