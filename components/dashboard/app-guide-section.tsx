"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search, Eye, HelpCircle } from "lucide-react";

export function AppGuideSection() {
  const guideItems = [
    {
      icon: Search,
      title: "Search Persons",
      description: "Use the search bar to find individuals by name or nickname",
    },
    {
      icon: Eye,
      title: "View Ban Records",
      description: "Browse ban records to see active bans and their details",
    },
    {
      icon: HelpCircle,
      title: "Need Help?",
      description: "Contact your manager or head manager for assistance",
    },
  ];

  return (
    <Card className="h-full flex flex-col gap-2 py-1 min-h-0">
      <CardHeader className="flex-shrink-0 pb-1 px-3 sm:px-4 pt-1 gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm sm:text-base font-semibold">How to Use the App</CardTitle>
        </div>
        <CardDescription className="text-xs leading-tight">Quick guide to get started</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-1 sm:p-2 overflow-y-auto">
        <div className="space-y-2 sm:space-y-2.5">
          {guideItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-2 sm:gap-2.5 p-1.5 sm:p-2 bg-muted/30 rounded-lg"
              >
                <div className="flex-shrink-0 p-1 rounded-md bg-muted">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium leading-tight mb-0.5">
                    {item.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

