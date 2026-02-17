'use client';

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast as sonnerToast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settingsStore";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (!registration) {
          return navigator.serviceWorker.register("/sw.js");
        }
        return registration;
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let deferredPrompt: any = null;

    const handleBeforeInstallPrompt = (event: any) => {
      event.preventDefault();
      deferredPrompt = event;

      sonnerToast("Install Kaboo", {
        description: "Add Kaboo to your home screen for faster access.",
        action: {
          label: "Install",
          onClick: async () => {
            if (!deferredPrompt) return;
            const promptEvent = deferredPrompt;
            deferredPrompt = null;
            try {
              await promptEvent.prompt();
            } catch {
              // ignore
            }
          },
        },
      });
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          {children}
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
