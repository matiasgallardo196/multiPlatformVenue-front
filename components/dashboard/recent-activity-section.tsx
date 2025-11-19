"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Ban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import Link from "next/link";

interface ActivityItem {
  id: string;
  startingDate: string;
  type: string;
}

interface RecentActivitySectionProps {
  activity: ActivityItem[];
  isLoading?: boolean;
  role?: string;
}

export function RecentActivitySection({
  activity,
  isLoading = false,
  role,
}: RecentActivitySectionProps) {
  if (isLoading) {
    return (
      <div className="mt-6 sm:mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
            <CardDescription className="text-sm">Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="mt-6 sm:mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
            <CardDescription className="text-sm">
              No recent activity
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "ban":
        return "Ban created";
      default:
        return "Activity";
    }
  };

  return (
    <div className="mt-6 sm:mt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
            <CardDescription className="text-sm">
              Latest activities in the system
            </CardDescription>
          </div>
          <Link href="/banneds">
            <span className="text-sm text-primary hover:underline">View all</span>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.slice(0, 5).map((item) => {
              const date = new Date(item.startingDate);
              const timeAgo = formatDistanceToNow(date, {
                addSuffix: true,
                locale: enUS,
              });

              return (
                <Link
                  key={item.id}
                  href={`/banneds/${item.id}`}
                  className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.type === "ban" ? (
                        <Ban className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {getActivityLabel(item.type)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {activity.length > 5 && (
              <Link href="/banneds">
                <div className="text-center text-sm text-muted-foreground hover:text-foreground pt-2">
                  View {activity.length - 5} more activities...
                </div>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

