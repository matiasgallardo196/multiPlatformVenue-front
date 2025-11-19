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
    <Card className={linkTo ? "hover:bg-muted/50 transition-colors" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-xl sm:text-2xl font-bold">-</div>
        ) : (
          <div className={`text-xl sm:text-2xl font-bold ${valueClass}`}>
            {value ?? 0}
          </div>
        )}
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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

