'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 pb-4 pt-16 sm:p-0">
          <motion.div
            role="dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={cn(
              "relative flex w-full h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-card sm:h-[80vh] sm:max-h-[600px] sm:max-w-sm",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/30 px-4 py-3 shrink-0">
              <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
