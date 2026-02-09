'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerDocs } from './PlayerDocs';
import { DevDocs } from './DevDocs';

const TABS = [
  { id: 'player', label: 'Player Guide', icon: BookOpen },
  { id: 'dev', label: 'Developer', icon: Code2 },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function DocsLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('player');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-body text-sm font-semibold">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-gradient-primary">KABOO</span>
            <span className="font-body text-sm text-muted-foreground">Docs</span>
          </div>

          <div className="ml-auto flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-body text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="docs-tab-indicator"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'player' ? <PlayerDocs /> : <DevDocs />}
        </motion.div>
      </main>
    </div>
  );
}
