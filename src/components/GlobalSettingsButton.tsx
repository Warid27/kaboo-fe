'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsModal } from '@/components/game/SettingsModal';

export function GlobalSettingsButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server or if not mounted to prevent hydration mismatch
  if (!mounted) return null;

  // Don't show on game page as it has its own menu
  // The game route is usually /game
  if (pathname === '/game') return null;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground shadow-sm"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </motion.button>

      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
