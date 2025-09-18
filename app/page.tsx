"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBanneds, usePersons, usePlaces, useIncidents } from "@/hooks/queries"
import { Users, MapPin, AlertTriangle, UserX } from "lucide-react"
import { useMemo } from "react"

export default function DashboardPage() {
  const { data: persons, isLoading: personsLoading } = usePersons()
  const { data: places, isLoading: placesLoading } = usePlaces()
  const { data: incidents, isLoading: incidentsLoading } = useIncidents()
  const { data: banneds, isLoading: bannedsLoading } = useBanneds()

  const stats = useMemo(() => {
    const activeBans = banneds?.filter((banned) => banned.isActive).length || 0
    const totalPersons = persons?.length || 0
    const totalPlaces = places?.length || 0
    const totalIncidents = incidents?.length || 0

    return {
      totalPersons,
      activeBans,
      totalPlaces,
      totalIncidents,
    }
  }, [persons, places, incidents, banneds])

  const isLoading = personsLoading || placesLoading || incidentsLoading || bannedsLoading

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" description="Overview of your admin system" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Persons</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">-</div>
            ) : (
              <div className="text-2xl font-bold">{stats.totalPersons}</div>
            )}
            <p className="text-xs text-muted-foreground">{isLoading ? "Loading..." : "Registered individuals"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bans</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">-</div>
            ) : (
              <div className="text-2xl font-bold text-destructive">{stats.activeBans}</div>
            )}
            <p className="text-xs text-muted-foreground">{isLoading ? "Loading..." : "Currently active"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Places</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">-</div>
            ) : (
              <div className="text-2xl font-bold">{stats.totalPlaces}</div>
            )}
            <p className="text-xs text-muted-foreground">{isLoading ? "Loading..." : "Registered locations"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">-</div>
            ) : (
              <div className="text-2xl font-bold">{stats.totalIncidents}</div>
            )}
            <p className="text-xs text-muted-foreground">{isLoading ? "Loading..." : "Reported incidents"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Admin Dashboard</CardTitle>
            <CardDescription>
              Manage banned persons, places, incidents, and more from this central dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Use the sidebar navigation to access different sections:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • <strong>Banned:</strong> View and manage banned persons with photos, dates, and associated places
                </li>
                <li>
                  • <strong>Persons:</strong> Manage individual person records and their profile information
                </li>
                <li>
                  • <strong>Places:</strong> Manage locations and venues in the system
                </li>
                <li>
                  • <strong>Incidents:</strong> Track and manage incident reports
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Create New Ban</p>
                  <p className="text-sm text-muted-foreground">Add a new ban record</p>
                </div>
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Report Incident</p>
                  <p className="text-sm text-muted-foreground">Create new incident report</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Add Person</p>
                  <p className="text-sm text-muted-foreground">Register new individual</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
