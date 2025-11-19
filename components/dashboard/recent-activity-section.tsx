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
      <Card className="h-full flex flex-col gap-2 py-1 min-h-0">
        <CardHeader className="flex-shrink-0 pb-1 px-3 sm:px-4 pt-1 gap-1">
          <CardTitle className="text-sm sm:text-base font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-xs leading-tight">Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <Card className="h-full flex flex-col gap-2 py-1 min-h-0">
        <CardHeader className="flex-shrink-0 pb-1 px-4 pt-1 gap-1">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-xs leading-tight">
            No recent activity
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-1">
          <p className="text-xs text-muted-foreground text-center">
            No recent activity to display.
          </p>
        </CardContent>
      </Card>
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
    <Card className="h-full flex flex-col gap-2 py-1">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 pb-1 px-3 sm:px-4 pt-1 gap-1">
        <div>
          <CardTitle className="text-sm sm:text-base font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-xs leading-tight">
            Latest activities in the system
          </CardDescription>
        </div>
        <Link href="/banneds">
          <span className="text-xs text-primary hover:underline">View all</span>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-1 sm:p-2 overflow-y-auto">
        <div className="space-y-1 sm:space-y-1.5">
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
                  className="block p-1.5 sm:p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.type === "ban" ? (
                        <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium leading-tight">
                        {getActivityLabel(item.type)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {activity.length > 5 && (
              <Link href="/banneds">
                <div className="text-center text-xs text-muted-foreground hover:text-foreground pt-0.5">
                  View {activity.length - 5} more activities...
                </div>
              </Link>
            )}
          </div>
      </CardContent>
    </Card>
  );
}

