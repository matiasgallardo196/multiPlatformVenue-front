"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserX, ArrowRight } from "lucide-react";
import Link from "next/link";

export function StaffQuickActions() {
  const quickLinks = [
    {
      title: "View All Persons",
      description: "Browse and search all registered individuals",
      icon: Users,
      href: "/persons",
    },
    {
      title: "View All Bans",
      description: "See all ban records in the system",
      icon: UserX,
      href: "/banneds",
    },
  ];

  return (
    <Card className="h-full flex flex-col gap-2 py-1 min-h-0">
      <CardHeader className="flex-shrink-0 pb-1 px-3 sm:px-4 pt-1 gap-1">
        <CardTitle className="text-sm sm:text-base font-semibold">Quick Actions</CardTitle>
        <CardDescription className="text-xs leading-tight">Quick access to main sections</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-1 sm:p-2">
        <div className="space-y-1 sm:space-y-1.5">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className="flex items-center justify-between p-1.5 sm:p-2 bg-muted rounded-lg hover:bg-muted/80 transition cursor-pointer group">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium text-xs sm:text-sm leading-tight">{link.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                      {link.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

