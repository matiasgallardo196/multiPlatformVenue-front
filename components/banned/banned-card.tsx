"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
} from "lucide-react";
import { BannedEditDialog } from "@/components/banned/banned-edit-dialog";
import { format } from "date-fns";
import type { Banned, Place } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface BannedCardProps {
  banned: Banned;
  places: Place[];
  onEdit: (banned: Banned) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  showApprovalBadge?: boolean;
  actionsAtTopRight?: boolean;
}

export function BannedCard({
  banned,
  places,
  onEdit,
  onDelete,
  readOnly = false,
  showApprovalBadge = true,
  actionsAtTopRight = false,
}: BannedCardProps) {
  const router = useRouter();
  const person = banned.person;
  const personName =
    [person?.name, person?.lastName].filter(Boolean).join(" ") ||
    person?.nickname ||
    "Unknown";
  const profileImages = person?.imagenProfileUrl || [];

  // Create place name map for quick lookup
  const placeMap = places.reduce((acc, place) => {
    acc[place.id] = place.name || "Unknown Place";
    return acc;
  }, {} as Record<string, string>);

  const bannedPlaceNames = (banned.bannedPlaces ?? [])
    .map((bp) => placeMap[bp.placeId])
    .filter(Boolean);

  // Calculate approval status
  const approvalStatus = useMemo(() => {
    if (!banned.bannedPlaces || banned.bannedPlaces.length === 0) {
      return null;
    }
    const pendingCount = banned.bannedPlaces.filter(
      (bp) => bp.status === 'pending'
    ).length;
    const approvedCount = banned.bannedPlaces.filter(
      (bp) => bp.status === 'approved'
    ).length;
    const totalCount = banned.bannedPlaces.length;

    if (pendingCount === 0) {
      return { status: "approved", label: "Approved" };
    } else if (approvedCount > 0) {
      return {
        status: "partial",
        label: `${approvedCount}/${totalCount} Approved`,
      };
    } else {
      return { status: "pending", label: "Pending" };
    }
  }, [banned.bannedPlaces]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getDurationText = () => {
    if (!banned.howlong) return "Duration unknown";
    const { years, months, days } = banned.howlong;
    const parts = [];
    if (years && years !== "0") parts.push(`${years}y`);
    if (months && months !== "0") parts.push(`${months}m`);
    if (days && days !== "0") parts.push(`${days}d`);
    return parts.length > 0 ? parts.join(" ") : "Less than a day";
  };

  return (
    <Card
      className="relative overflow-hidden transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      onClick={() => router.push(`/banneds/${banned.id}`)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/banneds/${banned.id}`);
      }}
    >
      {/* Incident number top-left */}
      <div className="absolute top-2 left-2">
        <Badge variant="outline" className="text-xs md:text-sm px-2 py-0.5">
          #{banned.incidentNumber}
        </Badge>
      </div>
      {/* Active & Violations top-right */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <Badge
          variant={banned.isActive ? "destructive" : "secondary"}
          className="text-xs md:text-sm px-2.5 py-1"
        >
          {banned.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant="outline" className="text-xs md:text-sm px-2.5 py-1">
          Violations: {banned.violationsCount ?? 0}
        </Badge>
        {actionsAtTopRight && !readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  href={`/banneds/${banned.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <BannedEditDialog id={banned.id}>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </BannedEditDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this ban?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the ban and remove it from the list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Ban</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(banned.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-8 md:gap-10">
          <div className="flex-shrink-0 flex flex-col items-center gap-3 md:gap-4">
            <Avatar className="h-40 w-40 md:h-48 md:w-48">
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

            {profileImages.length > 1 && (
              <div className="w-full">
                <span className="block text-xs text-muted-foreground mb-1 text-center">
                  Additional Photos:
                </span>
                <div className="flex justify-center gap-2 md:gap-3">
                  {profileImages.slice(1, 4).map((url, index) => (
                    <Avatar key={index} className="h-12 w-12 flex-shrink-0">
                      <AvatarImage
                        src={url || "/placeholder.svg"}
                        alt={`${personName} ${index + 2}`}
                      />
                      <AvatarFallback className="text-xs">
                        {index + 2}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {profileImages.length > 4 && (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{profileImages.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-card-foreground text-xl md:text-2xl">
                  {personName}
                </h3>
                {person?.nickname && person.nickname !== personName && (
                  <p className="text-sm md:text-base text-muted-foreground">
                    "{person.nickname}"
                  </p>
                )}
                {person?.gender && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gender: {person.gender}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showApprovalBadge && approvalStatus && (
                  <Badge
                    variant="outline"
                    className={`text-xs md:text-sm px-2.5 py-1 ${
                      approvalStatus.status === "approved"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : approvalStatus.status === "partial"
                        ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    {approvalStatus.label}
                  </Badge>
                )}
                {!actionsAtTopRight && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link
                          href={`/banneds/${banned.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {!readOnly && (
                        <BannedEditDialog id={banned.id}>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            onClick={(e) => e.stopPropagation()}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </BannedEditDialog>
                      )}
                      {!readOnly && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this ban?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the ban and remove it from the
                                list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Ban</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(banned.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Date Information */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>From:</span>
              </div>
              <span className="font-medium">
                {formatDate(banned.startingDate)}
              </span>
            </div>

            {banned.endingDate && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Until:</span>
                </div>
                <span className="font-medium">
                  {formatDate(banned.endingDate)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{getDurationText()}</span>
            </div>

            {/* Motive */}
            {banned.motive && banned.motive.length > 0 && (
              <div className="space-y-1 w-full min-w-0">
                <span className="text-sm text-muted-foreground">Motive:</span>
                <div className="space-y-1 w-full min-w-0">
                  {banned.motive.map((m, idx) => (
                    <p
                      key={idx}
                      className="text-sm bg-muted p-2 rounded text-pretty break-words whitespace-pre-wrap overflow-hidden max-w-full hyphens-auto"
                    >
                      {m}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Banned Places */}
            {bannedPlaceNames.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Banned from:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {bannedPlaceNames.map((placeName, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {placeName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
