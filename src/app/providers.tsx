'use client';

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settingsStore";
import { useOnlineGame } from "@/hooks/useOnlineGame";

function GameManager() {
  useOnlineGame();
  return null;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (!prefersDark) root.classList.add("light");
    } else if (theme === "light") {
      root.classList.add("light");
    }
    // dark is the default (no class needed)
  }, [theme]);

  // Prevent hydration mismatch for theme
  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <GameManager />
          {children}
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
