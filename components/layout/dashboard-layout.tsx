"use client";
import type React from "react";
import { Sidebar } from "@/components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 pt-14 sm:pt-4 md:pt-6 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
