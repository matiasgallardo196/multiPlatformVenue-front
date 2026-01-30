"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, User, Camera, ChevronLeft, ChevronRight, Building2, Share2, History, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  usePerson,
  usePersonBanStatus,
  usePersonBans,
  useDeletePerson,
  usePersonHistory,
} from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PersonEditDialog } from "@/components/person/person-edit-dialog";
import { BannedCreateDialog } from "@/components/banned/banned-create-dialog";
import { BannedEditDialog } from "@/components/banned/banned-edit-dialog";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { PersonHistory as PersonHistoryType } from "@/lib/types";

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: person, isLoading, error } = usePerson(id);
  const { data: banStatus } = usePersonBanStatus(id);
  const { data: bans } = usePersonBans(id);
  const { data: history } = usePersonHistory(id);
  const { isReadOnly, isManager } = useAuth();
  const deletePerson = useDeletePerson();
  const { toast } = useToast();
  const router = useRouter();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const formatHistoryAction = (action: string) => {
    const actionLabels: Record<string, string> = {
      created: "Created",
      updated: "Updated",
      shared: "Shared",
      unshared: "Unshared",
      access_removed: "Access Removed",
      ownership_transferred: "Ownership Transferred",
    };
    return actionLabels[action] || action;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calcular estados de bans basado en bannedPlaces
  const { hasActiveBans, hasPendingBans, banDisplayStatus, mostRecentBanId } = useMemo(() => {
    if (!bans || bans.length === 0) {
      return { hasActiveBans: false, hasPendingBans: false, banDisplayStatus: "None" as const, mostRecentBanId: null };
    }

    const now = new Date();
    let hasActive = false;
    let hasPending = false;

    for (const ban of bans) {
      const startingDate = ban.startingDate ? new Date(ban.startingDate) : null;
      const endingDate = ban.endingDate ? new Date(ban.endingDate) : null;
      const isInValidPeriod = startingDate && startingDate <= now && (!endingDate || endingDate >= now);

      if (!ban.bannedPlaces || ban.bannedPlaces.length === 0) continue;

      const hasApprovedPlaces = ban.bannedPlaces.some((bp: any) => bp.status === 'approved');
      const hasPendingPlaces = ban.bannedPlaces.some((bp: any) => bp.status === 'pending');

      if (hasApprovedPlaces && isInValidPeriod) {
        hasActive = true;
      }
      if (hasPendingPlaces && !hasApprovedPlaces) {
        hasPending = true;
      }
    }

    const status: "Active" | "Pending" | "None" = hasActive ? "Active" : hasPending ? "Pending" : "None";
    // Obtener el ID del ban más reciente (el primero en la lista)
    const mostRecentBanId = bans && bans.length > 0 ? bans[0].id : null;
    return { hasActiveBans: hasActive, hasPendingBans: hasPending, banDisplayStatus: status, mostRecentBanId };
  }, [bans]);

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
      >
        <Button variant="outline" asChild>
          <Link href="/persons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Avatar className="h-20 w-20 sm:h-16 sm:w-16 cursor-zoom-in flex-shrink-0">
                  <AvatarImage
                    src={person.imagenProfileUrl?.[0] || "/placeholder.svg"}
                    alt={getName()}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg sm:text-base">
                    {getName()
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </DialogTrigger>
              <DialogContent
                className="max-w-[calc(100%-2rem)] sm:max-w-4xl p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <DialogTitle className="sr-only">Image preview</DialogTitle>
                <DialogDescription className="sr-only">
                  Full size preview of the person's profile image
                </DialogDescription>
                <img
                  src={person.imagenProfileUrl?.[0] || "/placeholder.svg"}
                  alt={getName()}
                  className="w-full h-auto rounded"
                />
              </DialogContent>
            </Dialog>

            <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium break-words">{getName()}</span>
                </div>
                {hasActiveBans && (
                  <Badge variant="destructive" className="w-fit">Banned</Badge>
                )}
              </div>
              {person.nickname && (
                <div className="text-sm text-muted-foreground break-words">
                  "{person.nickname}"
                </div>
              )}
              {person.gender && (
                <div className="text-xs text-muted-foreground">
                  Gender: {person.gender}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!isReadOnly && (
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-2">
              <div className="text-sm font-medium mb-1">Actions</div>
              <PersonEditDialog id={person.id}>
                <Button
                  className="w-full bg-transparent cursor-pointer"
                  variant="outline"
                >
                  Edit Person Details
                </Button>
              </PersonEditDialog>
              {banDisplayStatus !== "None" && mostRecentBanId ? (
                <BannedEditDialog id={mostRecentBanId}>
                  <Button
                    className="w-full bg-transparent cursor-pointer"
                    variant="outline"
                  >
                    Edit Ban Details
                  </Button>
                </BannedEditDialog>
              ) : (
                <BannedCreateDialog
                  personId={person.id}
                  redirectOnSuccess
                >
                  <Button
                    className="w-full bg-transparent cursor-pointer"
                    variant="outline"
                  >
                    Create Ban for this Person
                  </Button>
                </BannedCreateDialog>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full cursor-pointer"
                    variant="destructive"
                  >
                    Delete Person
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this person?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the person and remove it from the list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Person</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await deletePerson.mutateAsync(person.id);
                          toast({
                            title: "Deleted",
                            description: "Person removed.",
                          });
                          router.replace("/persons");
                        } catch (e: any) {
                          toast({
                            title: "Error",
                            description:
                              e?.message || "Failed to delete person.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-3">
            <div className="text-sm text-muted-foreground">Bans</div>
            <div className="flex items-center gap-2">
              <Badge
                variant={banDisplayStatus === "Active" ? "destructive" : banDisplayStatus === "Pending" ? "default" : "secondary"}
              >
                {banDisplayStatus}
              </Badge>
            </div>
            {bans && bans.length > 0 && (
              <ul className="space-y-2">
                {bans.slice(0, 5).map((b: any) => (
                  <li key={b.id} className="text-sm break-words">
                    <Link className="underline break-all" href={`/banneds/${b.id}`}>
                      Ban #{typeof b.incidentNumber === "number" ? b.incidentNumber : b.id.slice(-8)}
                    </Link>
                    {b.bannedPlaces?.length ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {b.bannedPlaces.length} place(s)
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Access Info */}
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Access Information</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {person.ownerPlaceName && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1 cursor-help">
                      <Building2 className="h-3 w-3" />
                      {person.accessType === "owner" ? "Owner" : "Shared"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span className="text-xs">
                      {person.accessType === "owner" 
                        ? `Your venue (${person.ownerPlaceName})` 
                        : `Created by: ${person.ownerPlaceName}`}
                    </span>
                  </TooltipContent>
                </Tooltip>
              )}
              {person.isShared && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1 cursor-help">
                      <Share2 className="h-3 w-3" />
                      Shared with {person.sharedWithPlaces?.length || 0} venues
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-xs">
                      <p className="font-medium mb-1">Shared with:</p>
                      <ul className="list-disc list-inside">
                        {person.sharedWithPlaces?.map((place) => (
                          <li key={place.id}>{place.name}</li>
                        )) || <li>No venues</li>}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              {!person.ownerPlaceName && !person.isShared && (
                <span className="text-sm text-muted-foreground">No access information available</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History Section - Manager+ only */}
        {isManager && history && history.length > 0 && (
          <Card className="md:col-span-2">
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Change History</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto overflow-x-visible">
                {history.map((entry: PersonHistoryType & { performedByUserName?: string }) => (
                  <div key={entry.id} className="flex items-start gap-3 text-sm border-l-2 border-muted pl-3 py-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {formatHistoryAction(entry.action)}
                        </Badge>
                        {entry.place?.name && (
                          <span className="text-xs text-muted-foreground">@ {entry.place.name}</span>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1">
                        <span>by {entry.performedByUserName || "Unknown"}</span>
                        <span className="mx-1">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(entry.performedAt)}
                        </span>
                      </div>
                      {entry.changes && entry.changes.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mt-1 text-xs text-muted-foreground cursor-help underline decoration-dotted">
                              Changed: {entry.changes.map((c) => c.field).join(", ")}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="start" className="max-w-sm z-50">
                            <div className="text-xs space-y-1">
                              {entry.changes.map((change, idx) => (
                                <div key={idx} className="flex flex-col">
                                  <span className="font-medium capitalize">{change.field}:</span>
                                  <span className="text-destructive line-through">
                                    {Array.isArray(change.oldValue) 
                                      ? change.oldValue.join(", ") || "(empty)"
                                      : String(change.oldValue ?? "(empty)")}
                                  </span>
                                  <span className="text-green-400">
                                    → {Array.isArray(change.newValue) 
                                      ? change.newValue.join(", ") || "(empty)"
                                      : String(change.newValue ?? "(empty)")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {entry.notes && (
                        <div className="mt-1 text-xs italic text-muted-foreground">{entry.notes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {person.imagenProfileUrl && person.imagenProfileUrl.length > 1 && (
          <Card className="md:col-span-2">
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">Additional Photos</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {person.imagenProfileUrl
                  .slice(1)
                  .map((url: string, idx: number) => (
                    <img
                      key={idx}
                      src={url || "/placeholder.svg"}
                      alt={`Photo ${idx + 2}`}
                      className="w-full h-20 sm:h-24 object-cover rounded border transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-zoom-in active:scale-[0.98]"
                      onClick={() => {
                        setGalleryIndex(idx + 1);
                        setGalleryOpen(true);
                      }}
                    />
                  ))}
              </div>

              <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
                <DialogContent
                  className="max-w-[calc(100%-2rem)] sm:max-w-5xl p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogTitle className="sr-only">Image preview</DialogTitle>
                  <DialogDescription className="sr-only">
                    Gallery view of all person's profile images
                  </DialogDescription>
                  <div className="relative">
                    <img
                      src={person.imagenProfileUrl[galleryIndex]}
                      alt={`Photo ${galleryIndex + 1}`}
                      className="w-full h-auto rounded"
                    />
                    {person.imagenProfileUrl.length > 2 && (
                      <>
                        <button
                          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            const total = person.imagenProfileUrl.length;
                            setGalleryIndex((galleryIndex - 1 + total) % total);
                          }}
                          aria-label="Previous"
                        >
                          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <button
                          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            const total = person.imagenProfileUrl.length;
                            setGalleryIndex((galleryIndex + 1) % total);
                          }}
                          aria-label="Next"
                        >
                          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
