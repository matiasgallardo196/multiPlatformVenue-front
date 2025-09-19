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
import { Loader2, User, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  usePerson,
  usePersonBanStatus,
  usePersonBans,
  useDeletePerson,
} from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PersonEditDialog } from "@/components/person/person-edit-dialog";
import { IncidentCreateDialog } from "@/components/incident/incident-create-dialog";
import { useState } from "react";

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: person, isLoading, error } = usePerson(id);
  const { data: banStatus } = usePersonBanStatus(id);
  const { data: bans } = usePersonBans(id);
  const { isReadOnly } = useAuth();
  const deletePerson = useDeletePerson();
  const { toast } = useToast();
  const router = useRouter();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Avatar className="h-16 w-16 cursor-zoom-in">
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
              </DialogTrigger>
              <DialogContent
                className="max-w-4xl p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <DialogTitle className="sr-only">Image preview</DialogTitle>
                <img
                  src={person.imagenProfileUrl?.[0] || "/placeholder.svg"}
                  alt={getName()}
                  className="w-full h-auto rounded"
                />
              </DialogContent>
            </Dialog>

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
            <CardContent className="p-6 space-y-2">
              <div className="text-sm font-medium mb-1">Actions</div>
              <PersonEditDialog id={person.id}>
                <Button
                  className="w-full bg-transparent cursor-pointer"
                  variant="outline"
                >
                  Edit Person Details
                </Button>
              </PersonEditDialog>
              <IncidentCreateDialog
                lockedPersonId={person.id}
                shouldRedirect={true}
              >
                <Button
                  className="w-full bg-transparent cursor-pointer"
                  variant="outline"
                >
                  Create Incident for this Person
                </Button>
              </IncidentCreateDialog>
              <Button
                className="w-full cursor-pointer"
                variant="destructive"
                onClick={async () => {
                  if (!confirm("Are you sure you want to delete this person?"))
                    return;
                  try {
                    await deletePerson.mutateAsync(person.id);
                    toast({ title: "Deleted", description: "Person removed." });
                    router.replace("/persons");
                  } catch (e: any) {
                    toast({
                      title: "Error",
                      description: e?.message || "Failed to delete person.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Delete Person
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="text-sm text-muted-foreground">Incidents</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{person.incidents?.length || 0}</Badge>
            </div>
            {person.incidents && person.incidents.length > 0 && (
              <ul className="space-y-2">
                {person.incidents.slice(0, 5).map((inc) => (
                  <li key={inc.id} className="text-sm">
                    <Link className="underline" href={`/incidents/${inc.id}`}>
                      Incident #{inc.id.slice(-8)}
                    </Link>
                    {inc.place?.name && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {inc.place.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="text-sm text-muted-foreground">Bans</div>
            <div className="flex items-center gap-2">
              <Badge
                variant={banStatus?.isBanned ? "destructive" : "secondary"}
              >
                {banStatus?.isBanned ? "Active" : "None"}
              </Badge>
            </div>
            {bans && bans.length > 0 && (
              <ul className="space-y-2">
                {bans.slice(0, 5).map((b) => (
                  <li key={b.id} className="text-sm">
                    <Link className="underline" href={`/banneds/${b.id}`}>
                      Ban #{b.id.slice(-8)}
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
        {person.imagenProfileUrl && person.imagenProfileUrl.length > 1 && (
          <Card className="md:col-span-2">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Additional Photos</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {person.imagenProfileUrl.slice(1).map((url, idx) => (
                  <img
                    key={idx}
                    src={url || "/placeholder.svg"}
                    alt={`Photo ${idx + 2}`}
                    className="w-full h-24 object-cover rounded border transition-transform duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-zoom-in"
                    onClick={() => {
                      setGalleryIndex(idx + 1);
                      setGalleryOpen(true);
                    }}
                  />
                ))}
              </div>

              <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
                <DialogContent
                  className="max-w-5xl p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogTitle className="sr-only">Image preview</DialogTitle>
                  <div className="relative">
                    <img
                      src={person.imagenProfileUrl[galleryIndex]}
                      alt={`Photo ${galleryIndex + 1}`}
                      className="w-full h-auto rounded"
                    />
                    {person.imagenProfileUrl.length > 2 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            const total = person.imagenProfileUrl.length;
                            setGalleryIndex((galleryIndex - 1 + total) % total);
                          }}
                          aria-label="Previous"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            const total = person.imagenProfileUrl.length;
                            setGalleryIndex((galleryIndex + 1) % total);
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
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
