"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApproveBannedPlace } from "@/hooks/queries";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import type { BannedPlace, Place } from "@/lib/types";
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

interface BannedPlaceApprovalProps {
  bannedId: string;
  bannedPlace: BannedPlace;
  place: Place;
}

export function BannedPlaceApproval({
  bannedId,
  bannedPlace,
  place,
}: BannedPlaceApprovalProps) {
  const { toast } = useToast();
  const approveMutation = useApproveBannedPlace();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        bannedId,
        data: {
          placeId: bannedPlace.placeId,
          approved: true,
        },
      });
      toast({
        title: "Success",
        description: `Place "${place.name}" has been approved.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "Failed to approve place. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      await approveMutation.mutateAsync({
        bannedId,
        data: {
          placeId: bannedPlace.placeId,
          approved: false,
        },
      });
      toast({
        title: "Success",
        description: `Place "${place.name}" has been rejected and removed from the ban.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "Failed to reject place. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isProcessing = approveMutation.isPending;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-md">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
          Pending
        </Badge>
        <span className="font-medium">{place.name || "Unknown Place"}</span>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
        >
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Reject this place?</AlertDialogTitle>
              <AlertDialogDescription>
                Rejecting will remove "{place.name}" from this ban. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReject}>
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}




