"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/hooks/use-auth";
import { usePlaceSettings, useUpdatePlaceSettings, usePlaces, useMigratePersonAccess } from "@/hooks/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Settings, Users, Ban, Save, Database, Loader2 } from "lucide-react";
import type { Place } from "@/lib/types";

function SettingsContent() {
  const { user, isHeadManager, isAdmin } = useAuth();
  const placeId = user?.placeId || "";

  const { data: settings, isLoading: settingsLoading } = usePlaceSettings(placeId, {
    enabled: !!placeId && (isHeadManager || isAdmin),
  });

  const { data: placesData, isLoading: placesLoading } = usePlaces(
    { page: 1, limit: 100, enabled: !!placeId || isAdmin }
  );
  const otherPlaces = (placesData?.items || []).filter((p: Place) => p.id !== placeId);

  const updateSettings = useUpdatePlaceSettings(placeId);
  const migrateAccess = useMigratePersonAccess();

  // Local state
  const [acceptExternalBans, setAcceptExternalBans] = useState(false);
  const [acceptBansFromPlaceIds, setAcceptBansFromPlaceIds] = useState<string[]>([]);
  const [sharePersons, setSharePersons] = useState(false);
  const [sharePersonsWithPlaceIds, setSharePersonsWithPlaceIds] = useState<string[]>([]);

  // Sync from server
  useEffect(() => {
    if (settings) {
      setAcceptExternalBans(settings.acceptExternalBans);
      setAcceptBansFromPlaceIds(settings.acceptBansFromPlaceIds);
      setSharePersons(settings.sharePersons);
      setSharePersonsWithPlaceIds(settings.sharePersonsWithPlaceIds);
    }
  }, [settings]);

  const handleSave = () => {
    const payload = {
      acceptExternalBans,
      acceptBansFromPlaceIds: acceptExternalBans ? acceptBansFromPlaceIds : [],
      sharePersons,
      sharePersonsWithPlaceIds: sharePersons ? sharePersonsWithPlaceIds : [],
    };
    updateSettings.mutate(payload);
  };

  const togglePlaceInList = (placeIdToToggle: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(placeIdToToggle)) {
      setList(list.filter((id) => id !== placeIdToToggle));
    } else {
      setList([...list, placeIdToToggle]);
    }
  };

  const canSaveBans = !acceptExternalBans || acceptBansFromPlaceIds.length > 0;
  const canSavePersons = !sharePersons || sharePersonsWithPlaceIds.length > 0;
  const canSave = canSaveBans && canSavePersons;

  // ADMIN without placeId can still see migration section
  if (!placeId && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">No Venue Assigned</h1>
        <p className="text-muted-foreground">You must be assigned to a venue to manage settings.</p>
      </div>
    );
  }

  if (settingsLoading || placesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Venue Settings"
        description="Configure sharing and collaboration settings for your venue"
      />

      {/* ADMIN Migration Section */}
      {isAdmin && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Data Migration (Admin Only)</CardTitle>
            </div>
            <CardDescription>
              Run this once to create access records for existing persons based on their approved bans.
              This is needed after enabling the new access control system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => migrateAccess.mutate()}
              disabled={migrateAccess.isPending}
              variant="outline"
              className="gap-2 border-orange-500/50 hover:bg-orange-500/10"
            >
              {migrateAccess.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Migration...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Run Person Access Migration
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Only show venue settings if user has a placeId */}
      {placeId && (
        <>
          {/* External Ban Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">External Ban Requests</CardTitle>
              </div>
              <CardDescription>
                Control whether other venues can send you ban requests for approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="accept-external-bans" className="text-base font-medium">
                  Allow other venues to send me ban requests
                </Label>
                <Switch
                  id="accept-external-bans"
                  checked={acceptExternalBans}
                  onCheckedChange={setAcceptExternalBans}
                />
              </div>

              {acceptExternalBans && (
                <div className="space-y-3 pt-4 border-t">
                  {acceptBansFromPlaceIds.length === 0 && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      You must select at least one venue
                    </p>
                  )}
                  <Label className="text-sm text-muted-foreground">Accept requests from:</Label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/30">
                    {otherPlaces.map((place: Place) => (
                      <div key={place.id} className="flex items-center gap-3 py-1">
                        <Checkbox
                          id={`ban-${place.id}`}
                          checked={acceptBansFromPlaceIds.includes(place.id)}
                          onCheckedChange={() =>
                            togglePlaceInList(place.id, acceptBansFromPlaceIds, setAcceptBansFromPlaceIds)
                          }
                        />
                        <Label htmlFor={`ban-${place.id}`} className="font-normal cursor-pointer flex-1">
                          {place.name} {place.city && <span className="text-muted-foreground">- {place.city}</span>}
                        </Label>
                      </div>
                    ))}
                    {otherPlaces.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No other venues available</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Person Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Share Person Database</CardTitle>
              </div>
              <CardDescription>
                Allow other venues to see and use persons from your database when creating bans.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="share-persons" className="text-base font-medium">
                  Share my persons with other venues
                </Label>
                <Switch
                  id="share-persons"
                  checked={sharePersons}
                  onCheckedChange={setSharePersons}
                />
              </div>

              {sharePersons && (
                <div className="space-y-3 pt-4 border-t">
                  {sharePersonsWithPlaceIds.length === 0 && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      You must select at least one venue
                    </p>
                  )}
                  <Label className="text-sm text-muted-foreground">Share with:</Label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/30">
                    {otherPlaces.map((place: Place) => (
                      <div key={place.id} className="flex items-center gap-3 py-1">
                        <Checkbox
                          id={`share-${place.id}`}
                          checked={sharePersonsWithPlaceIds.includes(place.id)}
                          onCheckedChange={() =>
                            togglePlaceInList(place.id, sharePersonsWithPlaceIds, setSharePersonsWithPlaceIds)
                          }
                        />
                        <Label htmlFor={`share-${place.id}`} className="font-normal cursor-pointer flex-1">
                          {place.name} {place.city && <span className="text-muted-foreground">- {place.city}</span>}
                        </Label>
                      </div>
                    ))}
                    {otherPlaces.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No other venues available</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!canSave || updateSettings.isPending}
              size="lg"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RouteGuard requireHeadManager>
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </RouteGuard>
  );
}

