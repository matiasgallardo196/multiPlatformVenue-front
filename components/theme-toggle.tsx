"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        Theme
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <Button
      variant="outline"
      className="w-full justify-between"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="flex items-center gap-2">
        <Moon className="h-4 w-4" />
        Theme
      </span>
      <Sun className="h-4 w-4" />
    </Button>
  );
}
