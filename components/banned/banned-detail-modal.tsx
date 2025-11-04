"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useBanned, useBannedHistory, usePlaces } from "@/hooks/queries";
import { format } from "date-fns";
import type { Banned, BannedHistory, Place } from "@/lib/types";
import {
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Edit,
  History,
  FileText,
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface BannedDetailModalProps {
  bannedId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function BannedDetailModal({
  bannedId,
  open,
  onOpenChange,
}: BannedDetailModalProps) {
  const { data: banned, isLoading: bannedLoading } = useBanned(bannedId);
  const { data: history, isLoading: historyLoading } = useBannedHistory(bannedId);
  const { data: places } = usePlaces();

  const isLoading = bannedLoading || historyLoading;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading ban information</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading information...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!banned) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error loading information</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-destructive">Error loading ban information</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const person = banned.person;
  const personName =
    [person?.name, person?.lastName].filter(Boolean).join(" ") ||
    person?.nickname ||
    "Unknown";
  const profileImages = person?.imagenProfileUrl || [];

  const placeMap = (places || []).reduce((acc, place: Place) => {
    acc[place.id] = place.name || "Unknown Place";
    return acc;
  }, {} as Record<string, string>);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MM/dd/yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      return format(new Date(dateString), "MM/dd/yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getDurationText = () => {
    if (!banned.howlong) return "Unknown duration";
    const { years, months, days } = banned.howlong;
    const parts = [];
    if (years && years !== "0") parts.push(`${years}y`);
    if (months && months !== "0") parts.push(`${months}m`);
    if (days && days !== "0") parts.push(`${days}d`);
    return parts.length > 0 ? parts.join(" ") : "Less than a day";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5" />
            Ban Information - {personName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={profileImages[0] || "/placeholder.svg"}
                    alt={personName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {personName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{personName}</h3>
                  {person?.nickname && person.nickname !== personName && (
                    <p className="text-sm text-muted-foreground">"{person.nickname}"</p>
                  )}
                  <Badge variant={banned.isActive ? "destructive" : "secondary"}>
                    {banned.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Incident N°:</span>
                  <p className="font-medium">{banned.incidentNumber}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <p className="font-medium">{getDurationText()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">From:</span>
                  <span className="font-medium">{formatDateOnly(banned.startingDate)}</span>
                </div>
                {banned.endingDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Until:</span>
                    <span className="font-medium">{formatDateOnly(banned.endingDate)}</span>
                  </div>
                )}
              </div>

              {banned.motive && banned.motive.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Motive:</span>
                  <div className="space-y-1">
                    {banned.motive.map((m, idx) => (
                      <Badge key={idx} variant="outline" className="mr-2">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {banned.peopleInvolved && (
                <div>
                  <span className="text-sm text-muted-foreground">People Involved:</span>
                  <p className="font-medium">{banned.peopleInvolved}</p>
                </div>
              )}

              {banned.incidentReport && (
                <div>
                  <span className="text-sm text-muted-foreground">Incident Report:</span>
                  <p className="font-medium">{banned.incidentReport}</p>
                </div>
              )}

              {banned.actionTaken && (
                <div>
                  <span className="text-sm text-muted-foreground">Action Taken:</span>
                  <p className="font-medium">{banned.actionTaken}</p>
                </div>
              )}

              {banned.policeNotified && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Police Notified:</span>
                  <div className="space-y-1 pl-4">
                    {banned.policeNotifiedDate && (
                      <p className="text-sm">
                        <span className="font-medium">Date:</span>{" "}
                        {formatDateOnly(banned.policeNotifiedDate)}
                      </p>
                    )}
                    {banned.policeNotifiedTime && (
                      <p className="text-sm">
                        <span className="font-medium">Time:</span> {banned.policeNotifiedTime}
                      </p>
                    )}
                    {banned.policeNotifiedEvent && (
                      <p className="text-sm">
                        <span className="font-medium">Event:</span> {banned.policeNotifiedEvent}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Involved Places */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Involved Places
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {banned.bannedPlaces?.map((bp) => (
                  <div
                    key={bp.placeId}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <span>{placeMap[bp.placeId] || "Unknown Place"}</span>
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
                <div className="space-y-4">
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
                              {formatDate(item.performedAt)}
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
                                    {formatDateOnly(item.details.oldDates.startingDate)} -{" "}
                                    {formatDateOnly(item.details.oldDates.endingDate)}
                                  </p>
                                  <p>
                                    <span className="font-medium">New dates:</span>{" "}
                                    {formatDateOnly(item.details.newDates.startingDate)} -{" "}
                                    {formatDateOnly(item.details.newDates.endingDate)}
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
      </DialogContent>
    </Dialog>
  );
}

