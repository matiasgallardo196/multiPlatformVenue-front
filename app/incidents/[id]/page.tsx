"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { IncidentEditDialog } from "@/components/incident/incident-edit-dialog";
import { BannedCreateDialog } from "@/components/banned/banned-create-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, MapPin, User, Camera } from "lucide-react";
import { useIncident } from "@/hooks/queries";
import Link from "next/link";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: incident, isLoading, error } = useIncident(id);

  const getPersonName = () => {
    const p = incident?.person;
    if (!p) return "Unknown Person";
    return (
      [p.name, p.lastName].filter(Boolean).join(" ") || p.nickname || "Unknown"
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Incident Details" />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading incident...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !incident) {
    return (
      <DashboardLayout>
        <PageHeader title="Incident Details" />
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load incident.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`Incident #${incident.id.slice(-8)}`}
        description={incident.details || undefined}
      >
        <div className="flex gap-2">
          <IncidentEditDialog id={incident.id}>
            <Button variant="outline">Edit Incident</Button>
          </IncidentEditDialog>
          <BannedCreateDialog
            incidentId={incident.id}
            defaultPlaceId={incident.place?.id}
          >
            <Button>Create Ban</Button>
          </BannedCreateDialog>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium">General</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={
                    incident.person?.imagenProfileUrl?.[0] || "/placeholder.svg"
                  }
                  alt={getPersonName()}
                />
                <AvatarFallback className="text-xs">
                  {getPersonName()
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/persons/${incident.person?.id || ""}`}
                className="text-sm underline"
              >
                {getPersonName()}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {incident.place?.name || "Unknown Location"}
              </span>
            </div>

            {incident.banned && <Badge variant="destructive">Has Ban</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Photos</span>
            </div>
            {incident.photoBook && incident.photoBook.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {incident.photoBook.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`photo-${idx + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No photos.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
