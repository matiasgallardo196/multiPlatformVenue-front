"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search, Filter } from "lucide-react"
import type { Place } from "@/lib/types"

interface BannedSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: "all" | "active" | "inactive"
  onStatusFilterChange: (status: "all" | "active" | "inactive") => void
  selectedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
  places: Place[]
  onClearFilters: () => void
}

export function BannedSearch({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedPlaces,
  onPlaceToggle,
  places,
  onClearFilters,
}: BannedSearchProps) {
  const hasActiveFilters = searchQuery || statusFilter !== "all" || selectedPlaces.length > 0

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, last name, or nickname..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Place Filter */}
        <Select onValueChange={onPlaceToggle}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Add place filter" />
          </SelectTrigger>
          <SelectContent>
            {places.map((place) => (
              <SelectItem key={place.id} value={place.id} disabled={selectedPlaces.includes(place.id)}>
                {place.name || "Unnamed Place"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(statusFilter !== "all" || selectedPlaces.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onStatusFilterChange("all")} />
            </Badge>
          )}
          {selectedPlaces.map((placeId) => {
            const place = places.find((p) => p.id === placeId)
            return (
              <Badge key={placeId} variant="secondary" className="gap-1">
                {place?.name || "Unknown Place"}
                <X className="h-3 w-3 cursor-pointer" onClick={() => onPlaceToggle(placeId)} />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
