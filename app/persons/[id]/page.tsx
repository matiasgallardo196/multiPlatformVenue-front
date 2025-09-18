"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";
import { usePerson, usePersonBanStatus } from "@/hooks/queries";

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: person, isLoading, error } = usePerson(id);
  const { data: banStatus } = usePersonBanStatus(id);

  const getName = () => {
    if (!person) return "";
    return (
      [person.name, person.lastName].filter(Boolean).join(" ") ||
      person.nickname ||
      "Unknown"
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Person Details" />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading person...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !person) {
    return (
      <DashboardLayout>
        <PageHeader title="Person Details" />
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load person.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={getName()}
        description={person.nickname ? `"${person.nickname}"` : undefined}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={person.imagenProfileUrl?.[0] || "/placeholder.svg"}
                alt={getName()}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getName()
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{getName()}</span>
                {banStatus?.isBanned && (
                  <Badge variant="destructive">Banned</Badge>
                )}
              </div>
              {person.nickname && (
                <div className="text-sm text-muted-foreground">
                  "{person.nickname}"
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="text-sm text-muted-foreground">Incidents</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{person.incidents?.length || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
