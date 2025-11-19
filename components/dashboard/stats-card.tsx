"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";

interface StatsCardProps {
  title: string;
  value: number | string | null | undefined;
  description?: string;
  icon: LucideIcon;
  isLoading?: boolean;
  variant?: "default" | "destructive" | "warning";
  linkTo?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading = false,
  variant = "default",
  linkTo,
}: StatsCardProps) {
  const valueClass =
    variant === "destructive"
      ? "text-destructive"
      : variant === "warning"
      ? "text-yellow-600 dark:text-yellow-500"
      : "";

  const content = (
    <Card className={`h-full ${linkTo ? "hover:bg-muted/50 transition-colors" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {isLoading ? (
          <div className="text-lg sm:text-xl font-bold">-</div>
        ) : (
          <div className={`text-lg sm:text-xl font-bold ${valueClass}`}>
            {value ?? 0}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {isLoading ? "Loading..." : description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

