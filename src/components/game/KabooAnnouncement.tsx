import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useAnimationConfig } from '@/hooks/useAnimationConfig';
import type { Player } from '@/types/game';

export interface KabooAnnouncementProps {
  showKabooAnnouncement: boolean;
  kabooCallerIndex: number | null;
  players: Player[];
}

export function KabooAnnouncement({
  showKabooAnnouncement,
  kabooCallerIndex,
  players,
}: KabooAnnouncementProps) {
  const anim = useAnimationConfig();

  const callerName = kabooCallerIndex !== null ? players[kabooCallerIndex]?.name : '';

  return (
    <AnimatePresence>
      {showKabooAnnouncement && (
        <motion.div
          initial={anim.initial({ opacity: 0 })}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={anim.fade}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-md"
        >
          <motion.div
            initial={anim.initial({ scale: 0, rotate: -20 })}
            animate={{ scale: 1, rotate: 0 }}
            exit={anim.enabled ? { scale: 0, rotate: 20 } : undefined}
            transition={anim.enabled ? { type: 'spring', stiffness: 200, damping: 12 } : { duration: 0 }}
            className="text-center"
          >
            <motion.div
              animate={anim.enabled ? {
                scale: [1, 1.2, 1],
                rotate: [0, -5, 5, 0],
              } : undefined}
              transition={anim.enabled ? { duration: 1.5, repeat: Infinity } : undefined}
              className="mb-4 flex justify-center"
            >
              <Flame className="h-24 w-24 text-orange-500 fill-orange-500 animate-pulse drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            </motion.div>

            <motion.h1
              initial={anim.initial({ opacity: 0, y: 30 })}
              animate={{ opacity: 1, y: 0 }}
              transition={anim.enabled ? { delay: 0.3 } : { duration: 0 }}
              className="font-display text-6xl font-bold text-gradient-gold sm:text-7xl"
            >
              KABOO!
            </motion.h1>

            <motion.p
              initial={anim.initial({ opacity: 0 })}
              animate={{ opacity: 1 }}
              transition={anim.enabled ? { delay: 0.6 } : { duration: 0 }}
              className="mt-3 font-body text-xl font-semibold text-foreground"
            >
              {callerName} called it!
            </motion.p>

            <motion.p
              initial={anim.initial({ opacity: 0 })}
              animate={{ opacity: 1 }}
              transition={anim.enabled ? { delay: 0.9 } : { duration: 0 }}
              className="mt-2 font-body text-sm text-muted-foreground"
            >
              Final round — everyone gets one more turn!
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
