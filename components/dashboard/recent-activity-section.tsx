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
      <Card className="h-full flex flex-col gap-2">
        <CardHeader className="flex-shrink-0 pb-1 px-4 pt-1 gap-1">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-[10px] leading-tight">Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <Card className="h-full flex flex-col gap-2">
        <CardHeader className="flex-shrink-0 pb-1 px-4 pt-1 gap-1">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-[10px] leading-tight">
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
    <Card className="h-full flex flex-col gap-2">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 pb-1 px-4 pt-1 gap-1">
        <div>
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-[10px] leading-tight">
            Latest activities in the system
          </CardDescription>
        </div>
        <Link href="/banneds">
          <span className="text-[10px] text-primary hover:underline">View all</span>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-1 overflow-y-auto">
        <div className="space-y-1">
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
                  className="block p-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.type === "ban" ? (
                        <Ban className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight">
                        {getActivityLabel(item.type)}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {activity.length > 5 && (
              <Link href="/banneds">
                <div className="text-center text-[10px] text-muted-foreground hover:text-foreground pt-0.5">
                  View {activity.length - 5} more activities...
                </div>
              </Link>
            )}
          </div>
      </CardContent>
    </Card>
  );
}

