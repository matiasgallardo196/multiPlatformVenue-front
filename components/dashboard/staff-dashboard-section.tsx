"use client";

import { StaffStatsSection } from "./staff-stats-section";
import { StaffQuickActions } from "./staff-quick-actions";
import { AppGuideSection } from "./app-guide-section";
import { ContactInfoSection } from "./contact-info-section";
import type { DashboardSummaryStaff } from "@/hooks/queries";

interface StaffDashboardSectionProps {
  summary: DashboardSummaryStaff | undefined;
  isLoading?: boolean;
}

export function StaffDashboardSection({
  summary,
  isLoading = false,
}: StaffDashboardSectionProps) {
  // Si no tiene placeId asignado, mostrar mensaje
  if (!summary?.placeId || !summary?.placeStats) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-rows-2 lg:h-[calc(100vh-8rem)]">
        {/* Cuadrante 1: Quick Actions */}
        <div className="lg:row-span-1 h-full">
          <StaffQuickActions />
        </div>

        {/* Cuadrante 2: App Guide */}
        <div className="lg:row-span-1 h-full">
          <AppGuideSection />
        </div>

        {/* Cuadrante 3 y 4: Mensaje de no lugar asignado */}
        <div className="lg:col-span-2 lg:row-span-1">
          <div className="h-full flex items-center justify-center p-6 bg-muted/30 rounded-lg border">
            <p className="text-sm text-muted-foreground text-center">
              No place assigned. Contact your administrator to get assigned to a place.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-rows-2 lg:h-[calc(100vh-8rem)]">
      {/* Cuadrante 1: Place Statistics - Columna izquierda, fila 1 */}
      <div className="lg:row-span-1 h-full">
        <StaffStatsSection
          placeName={summary.placeName ?? null}
          placeStats={summary.placeStats}
          totalPersons={summary.totals.totalPersons}
          isLoading={isLoading}
        />
      </div>

      {/* Cuadrante 2: Quick Actions - Columna derecha, fila 1 */}
      <div className="lg:row-span-1 h-full">
        <StaffQuickActions />
      </div>

      {/* Cuadrante 3: Contact Information - Columna izquierda, fila 2 */}
      <div className="lg:row-span-1 h-full">
        <ContactInfoSection
          contactInfo={summary.contactInfo}
          isLoading={isLoading}
        />
      </div>

      {/* Cuadrante 4: App Guide - Columna derecha, fila 2 */}
      <div className="lg:row-span-1 h-full">
        <AppGuideSection />
      </div>
    </div>
  );
}

