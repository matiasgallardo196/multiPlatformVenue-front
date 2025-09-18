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
import {
  Loader2,
  AlertTriangle,
  MapPin,
  User,
  Camera,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useIncident, useDeleteIncident } from "@/hooks/queries";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: incident, isLoading, error } = useIncident(id);
  const { isReadOnly } = useAuth();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const deleteIncident = useDeleteIncident();
  const { toast } = useToast();
  const router = useRouter();

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
      <PageHeader title={`Incident #${incident.id.slice(-8)}`}>
        <Button variant="outline" asChild>
          <Link href="/incidents">Back to List</Link>
        </Button>
        {/* Actions moved to the Actions block below; header actions removed to avoid duplication */}
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

        {!isReadOnly && (
          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="text-sm font-medium mb-1">Actions</div>

              <IncidentEditDialog id={incident.id}>
                <Button
                  className="w-full bg-transparent cursor-pointer"
                  variant="outline"
                >
                  Edit Incident
                </Button>
              </IncidentEditDialog>

              {!incident.banned && (
                <BannedCreateDialog
                  incidentId={incident.id}
                  defaultPlaceId={incident.place?.id}
                >
                  <Button
                    className="w-full bg-transparent cursor-pointer"
                    variant="outline"
                  >
                    Create Ban
                  </Button>
                </BannedCreateDialog>
              )}

              <Button
                className="w-full cursor-pointer"
                variant="destructive"
                onClick={async () => {
                  if (
                    !confirm("Are you sure you want to delete this incident?")
                  )
                    return;
                  try {
                    await deleteIncident.mutateAsync(incident.id);
                    toast({
                      title: "Deleted",
                      description: "Incident removed.",
                    });
                    router.replace("/incidents");
                  } catch (e: any) {
                    toast({
                      title: "Error",
                      description: e?.message || "Failed to delete incident.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Delete Incident
              </Button>
            </CardContent>
          </Card>
        )}

        {incident.details && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Details</span>
              </div>
              <p className="text-sm bg-muted p-3 rounded text-pretty">
                {incident.details}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Photos</span>
            </div>
            {incident.photoBook && incident.photoBook.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {incident.photoBook.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`photo-${idx + 1}`}
                      className="w-full h-24 object-cover rounded border transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-zoom-in"
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxOpen(true);
                      }}
                    />
                  ))}
                </div>
                <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                  <DialogContent
                    className="max-w-5xl p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DialogTitle className="sr-only">Image preview</DialogTitle>
                    <div className="relative">
                      <img
                        src={incident.photoBook[lightboxIndex]}
                        alt={`photo-${lightboxIndex + 1}`}
                        className="w-full h-auto rounded"
                      />
                      {incident.photoBook.length > 1 && (
                        <>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxIndex(
                                (lightboxIndex -
                                  1 +
                                  incident.photoBook.length) %
                                  incident.photoBook.length
                              );
                            }}
                            aria-label="Previous"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxIndex(
                                (lightboxIndex + 1) % incident.photoBook.length
                              );
                            }}
                            aria-label="Next"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No photos.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
