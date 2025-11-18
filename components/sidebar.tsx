"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  MapPin,
  AlertTriangle,
  UserX,
  Menu,
  X,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { User as UserIcon } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "staff", "head-manager"] },
  { name: "Banned", href: "/banneds", icon: UserX, roles: ["admin", "manager", "staff", "head-manager"] },
  { name: "Pending Bans", href: "/banneds/pending", icon: Clock, roles: ["admin", "manager"] },
  { name: "Approval Queue", href: "/banneds/approval-queue", icon: CheckCircle2, roles: ["admin", "head-manager"] },
  { name: "Persons", href: "/persons", icon: Users, roles: ["admin", "manager", "staff", "head-manager"] },
  { name: "Places", href: "/places", icon: MapPin, roles: ["admin", "head-manager"] },
  { name: "Users", href: "/users", icon: UserIcon, roles: ["admin", "head-manager"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { user: currentUser } = useAuth();

  const visibleNavigation = currentUser?.role
    ? navigation.filter((item) => item.roles.includes(currentUser.role))
    : [];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background shadow-lg h-10 w-10"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-4 sm:px-6 pt-14 lg:pt-0">
            <h1 className="text-base sm:text-lg font-semibold text-sidebar-foreground">Admin Dashboard</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3 sm:p-4 overflow-y-auto">
            {currentUser && (
              <div className="mb-3 rounded bg-sidebar-accent px-3 py-2 text-xs text-sidebar-accent-foreground">
                <div className="truncate">{currentUser.userName}</div>
                <div className="text-[10px] opacity-75">({currentUser.role})</div>
              </div>
            )}
            {visibleNavigation.map((item) => {
              const candidates = visibleNavigation.filter((nav) => {
                if (pathname === nav.href) return true;
                if (nav.href === "/") return false;
                // match only segment-prefixed (avoid marking parent when a more specific match exists)
                return pathname.startsWith(nav.href + "/");
              });
              const bestMatch = candidates.sort((a, b) => b.href.length - a.href.length)[0];
              const isActive = bestMatch ? bestMatch.href === item.href : pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-3 sm:p-4">
            <div className="space-y-2">
              <ThemeToggle />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-xs text-sidebar-foreground/60">Admin Dashboard v1.0</p>
                {currentUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await supabase.auth.signOut();
                        toast.success("Sesión cerrada");
                        router.replace("/");
                        router.refresh();
                      } catch (error) {
                        toast.error("Error al cerrar sesión");
                      }
                    }}
                    className="w-full sm:w-auto text-xs"
                  >
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

