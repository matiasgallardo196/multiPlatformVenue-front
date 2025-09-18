"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useBanned, usePlaces } from "@/hooks/queries"
import { ArrowLeft, Calendar, MapPin, FileText, Camera, User, Building } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function BannedDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: banned, isLoading, error } = useBanned(id)
  const { data: places } = usePlaces()

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">Loading banned person details...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !banned) {
    return (
      <DashboardLayout>
        <PageHeader title="Banned Person Details" />
        <div className="text-center py-8">
          <p className="text-destructive">Error loading banned person details</p>
        </div>
      </DashboardLayout>
    )
  }

  const person = banned.incident.person
  const personName = [person?.name, person?.lastName].filter(Boolean).join(" ") || person?.nickname || "Unknown"
  const profileImages = person?.imagenProfileUrl || []

  // Create place name map
  const placeMap =
    places?.reduce(
      (acc, place) => {
        acc[place.id] = place.name || "Unknown Place"
        return acc
      },
      {} as Record<string, string>,
    ) || {}

  const bannedPlaceNames = banned.bannedPlaces.map((bp) => placeMap[bp.placeId]).filter(Boolean)

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM dd, yyyy 'at' h:mm a")
    } catch {
      return "Invalid date"
    }
  }

  const getDurationText = () => {
    if (!banned.howlong) return "Duration unknown"
    const { years, months, days } = banned.howlong
    const parts = []
    if (years && years !== "0") parts.push(`${years} year${years !== "1" ? "s" : ""}`)
    if (months && months !== "0") parts.push(`${months} month${months !== "1" ? "s" : ""}`)
    if (days && days !== "0") parts.push(`${days} day${days !== "1" ? "s" : ""}`)
    return parts.length > 0 ? parts.join(", ") : "Less than a day"
  }

  return (
    <DashboardLayout>
      <PageHeader title="Banned Person Details" description={`Details for ${personName}`}>
        <Button variant="outline" asChild>
          <Link href="/banneds">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Person Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Person Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profileImages[0] || "/placeholder.svg"} alt={personName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {personName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{personName}</h3>
                  {person?.nickname && person.nickname !== personName && (
                    <p className="text-muted-foreground">Nickname: "{person.nickname}"</p>
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
                    {profileImages.slice(1).map((url, index) => (
                      <Avatar key={index} className="h-12 w-12">
                        <AvatarImage src={url || "/placeholder.svg"} alt={`${personName} ${index + 2}`} />
                        <AvatarFallback className="text-xs">{index + 2}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ban Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ban Details
              </CardTitle>
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
                  <Badge variant={banned.isActive ? "destructive" : "secondary"}>
                    {banned.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {banned.motive && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Motive</span>
                  <p className="text-sm bg-muted p-3 rounded text-pretty">{banned.motive}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Related Incident
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Location</span>
                <p className="text-sm">{banned.incident.place?.name || "Unknown Location"}</p>
              </div>

              {banned.incident.details && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Incident Details</span>
                  <p className="text-sm bg-muted p-3 rounded text-pretty">{banned.incident.details}</p>
                </div>
              )}

              {banned.incident.photoBook && banned.incident.photoBook.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Incident Photos</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {banned.incident.photoBook.map((url, index) => (
                      <Avatar key={index} className="h-12 w-12">
                        <AvatarImage src={url || "/placeholder.svg"} alt={`Incident photo ${index + 1}`} />
                        <AvatarFallback className="text-xs">#{index + 1}</AvatarFallback>
                      </Avatar>
                    ))}
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
                  {bannedPlaceNames.map((placeName, index) => (
                    <Badge key={index} variant="outline" className="block w-fit">
                      {placeName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specific places restricted</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-transparent" variant="outline">
                Edit Ban Details
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                View Related Incidents
              </Button>
              <Button className="w-full" variant="destructive">
                Delete Ban Record
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
