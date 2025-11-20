"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBanned, usePlaces, useDeleteBanned, useBannedHistory, useIncrementBannedViolation } from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import type { Place, BannedHistory } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  User,
  Camera,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Edit,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BannedEditDialog } from "@/components/banned/banned-edit-dialog";
import { useToast } from "@/hooks/use-toast";
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

export default function BannedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: banned, isLoading, error } = useBanned(id);
  const { data: places } = usePlaces();
  const { data: history, isLoading: historyLoading } = useBannedHistory(id);
  const { isReadOnly, isManager, isHeadManager, isAdmin } = useAuth();
  const deleteBanned = useDeleteBanned();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const incViolation = useIncrementBannedViolation();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">Loading banned person details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !banned) {
    return (
      <DashboardLayout>
        <PageHeader title="Banned Person Details" />
        <div className="text-center py-8">
          <p className="text-destructive">
            Error loading banned person details
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const person = banned.person;
  const personName =
    [person?.name, person?.lastName].filter(Boolean).join(" ") ||
    person?.nickname ||
    "Unknown";
  const profileImages = person?.imagenProfileUrl || [];

  // Create place name map
  const placeMap =
    places?.reduce((acc: Record<string, string>, place: Place) => {
      acc[place.id] = place.name || "Unknown Place";
      return acc;
    }, {} as Record<string, string>) || {};

  const bannedPlaceNames = banned.bannedPlaces
    .map((bp: { placeId: string }) => placeMap[bp.placeId])
    .filter(Boolean) as string[];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MM/dd/yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MM/dd/yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  const getDurationText = () => {
    if (!banned.howlong) return "Unknown duration";
    const { years, months, days } = banned.howlong;
    const parts = [];
    if (years && years !== "0")
      parts.push(`${years} year${years !== "1" ? "s" : ""}`);
    if (months && months !== "0")
      parts.push(`${months} month${months !== "1" ? "s" : ""}`);
    if (days && days !== "0")
      parts.push(`${days} day${days !== "1" ? "s" : ""}`);
    return parts.length > 0 ? parts.join(", ") : "Less than a day";
  };

  const actionIcons: Record<string, any> = {
    created: Plus,
    updated: Edit,
    approved: CheckCircle2,
    rejected: XCircle,
    place_added: Plus,
    place_removed: Minus,
    dates_changed: Calendar,
  };

  const actionLabels: Record<string, string> = {
    created: "Ban created",
    updated: "Ban updated",
    approved: "Place approved",
    rejected: "Place rejected",
    place_added: "Place added",
    place_removed: "Place removed",
    dates_changed: "Dates changed",
  };

  const actionColors: Record<string, string> = {
    created: "bg-green-50 border-green-200 text-green-800",
    updated: "bg-blue-50 border-blue-200 text-blue-800",
    approved: "bg-green-50 border-green-200 text-green-800",
    rejected: "bg-red-50 border-red-200 text-red-800",
    place_added: "bg-blue-50 border-blue-200 text-blue-800",
    place_removed: "bg-orange-50 border-orange-200 text-orange-800",
    dates_changed: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Banned Person Details"
        description={`Details for ${personName}`}
      >
        <Button variant="outline" asChild>
          <Link href="/banneds">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </PageHeader>

      {/* Row 1: Person Information (left) + Actions (right) with equal height */}
      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        <Card className="lg:col-span-2 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Person Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Avatar className="h-16 w-16 cursor-zoom-in">
                    <AvatarImage
                      src={profileImages[0] || "/placeholder.svg"}
                      alt={personName}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {personName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </DialogTrigger>
                <DialogContent
                  className="max-w-4xl p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogTitle className="sr-only">Image preview</DialogTitle>
                  <img
                    src={profileImages[0] || "/placeholder.svg"}
                    alt={personName}
                    className="w-full h-auto rounded"
                  />
                </DialogContent>
              </Dialog>
              <div>
                <h3 className="text-xl font-semibold">{personName}</h3>
                {person?.nickname && person.nickname !== personName && (
                  <p className="text-muted-foreground">
                    Nickname: "{person.nickname}"
                  </p>
                )}
              </div>
            </div>

            {profileImages.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Additional Photos</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {profileImages.slice(1).map((url: string, index: number) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <Avatar className="h-12 w-12 cursor-zoom-in">
                          <AvatarImage
                            src={url || "/placeholder.svg"}
                            alt={`${personName} ${index + 2}`}
                          />
                          <AvatarFallback className="text-xs">
                            {index + 2}
                          </AvatarFallback>
                        </Avatar>
                      </DialogTrigger>
                      <DialogContent
                        className="max-w-4xl p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DialogTitle className="sr-only">
                          Image preview
                        </DialogTitle>
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`${personName} ${index + 2}`}
                          className="w-full h-auto rounded"
                        />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!isReadOnly && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(isManager || isHeadManager) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full cursor-pointer" variant="default">
                      Add violation
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm adding a violation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will increment the violations counter and record the current date/time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            await incViolation.mutateAsync(banned.id);
                            toast({ title: "Violation added", description: "The violation was recorded." });
                          } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : "Failed to add violation.";
                            toast({ title: "Error", description: errorMessage, variant: "destructive" });
                          }
                        }}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <BannedEditDialog id={banned.id}>
                <Button
                  className="w-full bg-transparent cursor-pointer"
                  variant="outline"
                >
                  Edit Ban Details
                </Button>
              </BannedEditDialog>
              {person?.id && (
                <Button
                  className="w-full bg-transparent cursor-pointer"
                  variant="outline"
                  asChild
                >
                  <Link href={`/persons/${person.id}`}>
                    View Person Details
                  </Link>
                </Button>
              )}
              {(isHeadManager || isAdmin) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full cursor-pointer"
                      variant="destructive"
                    >
                      Delete Ban Record
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this ban?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        the ban and remove it from the list.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Ban</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            setDeleting(true);
                            router.replace("/banneds");
                            await deleteBanned.mutateAsync(banned.id);
                            toast({
                              title: "Deleted",
                              description: "Ban removed.",
                            });
                          } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : "Failed to delete ban.";
                            toast({
                              title: "Error",
                              description: errorMessage,
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
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 2: Rest of content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ban Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ban Details
              </CardTitle>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">Incident N°</span>
                <span className="text-sm font-semibold">{banned.incidentNumber}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Start Date</span>
                  </div>
                  <p className="text-sm">{formatDate(banned.startingDate)}</p>
                </div>

                {banned.endingDate && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">End Date</span>
                    </div>
                    <p className="text-sm">{formatDate(banned.endingDate)}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-sm font-medium">Duration</span>
                  <p className="text-sm">{getDurationText()}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={banned.isActive ? "destructive" : "secondary"}
                  >
                    {banned.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Violations</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{banned.violationsCount ?? 0}</Badge>
                    {Array.isArray(banned.violationDates) && banned.violationDates.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Last: {formatDateTime(banned.violationDates[banned.violationDates.length - 1] as unknown as string)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {banned.motive && banned.motive.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Motive</span>
                  <div className="space-y-2">
                    {banned.motive.map((m: string, idx: number) => (
                      <p key={idx} className="text-sm bg-muted p-3 rounded text-pretty">
                        {m}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {banned.peopleInvolved && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">People Involved</span>
                  <p className="text-sm bg-muted p-3 rounded text-pretty">
                    {banned.peopleInvolved}
                  </p>
                </div>
              )}

              {banned.incidentReport && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Incident Report</span>
                  <p className="text-sm bg-muted p-3 rounded text-pretty">
                    {banned.incidentReport}
                  </p>
                </div>
              )}

              {banned.actionTaken && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Action Taken</span>
                  <p className="text-sm bg-muted p-3 rounded text-pretty">
                    {banned.actionTaken}
                  </p>
                </div>
              )}

              {banned.policeNotified && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Police Notified</span>
                    <div className="space-y-3">
                      {banned.policeNotifiedDate && (
                        <div>
                          <span className="text-xs text-muted-foreground">Date:</span>
                          <p className="text-sm">
                            {new Date(banned.policeNotifiedDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {banned.policeNotifiedTime && (
                        <div>
                          <span className="text-xs text-muted-foreground">Time:</span>
                          <p className="text-sm">{banned.policeNotifiedTime}</p>
                        </div>
                      )}
                      {banned.policeNotifiedEvent && (
                        <div>
                          <span className="text-xs text-muted-foreground">Event:</span>
                          <p className="text-sm bg-muted p-2 rounded">
                            {banned.policeNotifiedEvent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Banned Places */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Banned Places
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bannedPlaceNames.length > 0 ? (
                <div className="space-y-2">
                  {banned.bannedPlaces?.map((bp: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <Badge variant="outline" className="block w-fit">
                        {placeMap[bp.placeId] || "Unknown Place"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          bp.status === "approved"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : bp.status === "pending"
                            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }
                      >
                        {bp.status === "approved"
                          ? "Approved"
                          : bp.status === "pending"
                          ? "Pending"
                          : "Rejected"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific places restricted
                </p>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading history...</span>
                </div>
              ) : !history || history.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No history available
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {history.map((item: BannedHistory) => {
                    const Icon = actionIcons[item.action] || Clock;
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={`flex-shrink-0 p-2 rounded-full ${actionColors[item.action] || "bg-gray-50"}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={actionColors[item.action] || ""}
                              >
                                {actionLabels[item.action] || item.action}
                              </Badge>
                              {item.place && (
                                <span className="text-sm text-muted-foreground">
                                  - {placeMap[item.placeId || ""] || "Unknown Place"}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.performedAt)}
                            </span>
                          </div>
                          {item.performedBy && (
                            <p className="text-sm">
                              By: <span className="font-medium">{item.performedBy.userName}</span>{" "}
                              ({item.performedBy.role})
                            </p>
                          )}
                          {item.details && Object.keys(item.details).length > 0 && (
                            <div className="text-xs text-muted-foreground pl-4 border-l-2 border-muted">
                              {item.action === "dates_changed" && item.details.oldDates && (
                                <div>
                                  <p>
                                    <span className="font-medium">Previous dates:</span>{" "}
                                    {formatDate(item.details.oldDates.startingDate)} -{" "}
                                    {formatDate(item.details.oldDates.endingDate)}
                                  </p>
                                  <p>
                                    <span className="font-medium">New dates:</span>{" "}
                                    {formatDate(item.details.newDates.startingDate)} -{" "}
                                    {formatDate(item.details.newDates.endingDate)}
                                  </p>
                                </div>
                              )}
                              {item.action === "created" && (
                                <div>
                                  <p>
                                    <span className="font-medium">Places:</span>{" "}
                                    {(item.details.placeIds as string[])?.length || 0}
                                  </p>
                                  <p>
                                    <span className="font-medium">Incident N°:</span>{" "}
                                    {item.details.incidentNumber}
                                  </p>
                                </div>
                              )}
                              {item.action === "place_added" && item.details.autoApproved && (
                                <p className="text-green-600">Auto-approved</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
