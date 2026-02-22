"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuthState = "unknown" | "authenticated" | "anonymous" | "none";

export function ProfileMenuButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("unknown");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const session = data.session;
      if (!session) {
        setAuthState("none");
      } else if (session.user?.is_anonymous) {
        setAuthState("anonymous");
      } else {
        setAuthState("authenticated");
      }
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setAuthState("none");
        } else if (session.user?.is_anonymous) {
          setAuthState("anonymous");
        } else {
          setAuthState("authenticated");
        }
      },
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [mounted]);

  if (!mounted) return null;

  if (
    pathname === "/game" ||
    pathname.startsWith("/single") ||
    pathname.startsWith("/multiplayer")
  ) {
    return null;
  }

  const handleLoginRegister = () => {
    router.push("/auth/login");
  };

  const handleMyProfile = () => {
    router.push("/profile");
    setOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  };

  const showMenu = authState === "authenticated" || authState === "anonymous";

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (!showMenu) {
            handleLoginRegister();
          } else {
            setOpen((v) => !v);
          }
        }}
        className="fixed top-4 right-16 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground shadow-sm"
        aria-label="Profile"
      >
        <User className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {showMenu && open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed right-4 top-16 z-50 w-48 rounded-2xl border border-border/40 bg-card/95 p-2 shadow-lg backdrop-blur-md"
          >
            <button
              onClick={handleMyProfile}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              My Profile
            </button>
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
