import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

const TABS = ['Rules', 'Game Flow', 'Strategy'] as const;
type Tab = (typeof TABS)[number];

export function HelpModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('Rules');

  return (
    <>
      {/* Floating help button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border/40 bg-card/90 font-display text-lg font-bold text-primary shadow-card backdrop-blur-sm transition-colors hover:bg-card"
      >
        ?
      </motion.button>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="How to Play">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/30 px-4 pt-2 shrink-0">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'relative rounded-t-lg px-3 py-2 font-body text-sm font-semibold transition-colors',
                  tab === t
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
                {tab === t && (
                  <motion.div
                    layoutId="help-tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {tab === 'Rules' && <RulesContent />}
                {tab === 'Game Flow' && <GameFlowContent />}
                {tab === 'Strategy' && <StrategyContent />}
              </motion.div>
            </AnimatePresence>
          </div>
      </Modal>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-4 font-display text-sm font-bold text-primary first:mt-0">
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-body text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

function CardValue({ rank, desc }: { rank: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md bg-muted px-2 py-0.5 font-display text-xs font-bold text-foreground">
        {rank}
      </span>
      <span className="font-body text-sm text-muted-foreground">{desc}</span>
    </div>
  );
}

function RulesContent() {
  return (
    <div>
      <SectionTitle>🎯 Objective</SectionTitle>
      <Paragraph>
        Have the <strong className="text-foreground">lowest total score</strong> when
        someone calls &quot;KABOO&quot;. You can only see some of your cards — memory and
        strategy are key!
      </Paragraph>

      <SectionTitle>🃏 Card Values</SectionTitle>
      <div className="mb-3 rounded-xl border border-border/30 bg-muted/30 p-3">
        <CardValue rank="A" desc="1 point" />
        <CardValue rank="2–10" desc="Face value" />
        <CardValue rank="J, Q" desc="10 points" />
        <CardValue rank="K" desc="0 points (best!)" />
        <CardValue rank="Joker" desc="0 points" />
      </div>

      <SectionTitle>✨ Special Cards</SectionTitle>
      <div className="mb-3 rounded-xl border border-border/30 bg-muted/30 p-3">
        <CardValue rank="7, 8" desc="Peek at one of your own cards" />
        <CardValue rank="9, 10" desc="Peek at an opponent&apos;s card" />
        <CardValue rank="J" desc="Blind swap — swap your card with an opponent&apos;s" />
        <CardValue rank="Q" desc="Semi-blind swap — peek first, then decide" />
        <CardValue rank="K" desc="Full-vision swap — see both, then decide" />
      </div>

      <SectionTitle>🔔 Calling KABOO</SectionTitle>
      <Paragraph>
        When you think you have the lowest score, call <strong className="text-foreground">KABOO</strong>.
        Every other player gets one final turn, then all cards are revealed.
        If you have the lowest score, you win! If not, you receive a penalty.
      </Paragraph>
    </div>
  );
}

function GameFlowContent() {
  return (
    <div>
      <SectionTitle>1️⃣ Deal & Peek</SectionTitle>
      <Paragraph>
        Each player receives 4 face-down cards in a 2×2 grid. You get to
        secretly peek at <strong className="text-foreground">2 cards</strong> before the game
        begins. Memorize them!
      </Paragraph>

      <SectionTitle>2️⃣ Draw Phase</SectionTitle>
      <Paragraph>
        On your turn, draw a card from the <strong className="text-foreground">draw pile</strong>.
        The card is revealed only to you.
      </Paragraph>

      <SectionTitle>3️⃣ Action Phase</SectionTitle>
      <Paragraph>
        After drawing, choose one action:
      </Paragraph>
      <ul className="mb-3 ml-1 space-y-2 font-body text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-primary">•</span>
          <span><strong className="text-foreground">Swap</strong> — select one of your cards to replace with the drawn card. The old card goes to the discard pile.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 text-primary">•</span>
          <span><strong className="text-foreground">Discard</strong> — discard the drawn card. If it&apos;s a special card (7–K), its effect activates.</span>
        </li>
      </ul>

      <SectionTitle>4️⃣ Effect Phase</SectionTitle>
      <Paragraph>
        If you discarded a special card, use its power: peek at cards or swap
        cards between players. Follow the on-screen prompts.
      </Paragraph>

      <SectionTitle>5️⃣ End Turn</SectionTitle>
      <Paragraph>
        Tap <strong className="text-foreground">End Turn</strong> to pass play to the next
        player (or bot). The game continues clockwise.
      </Paragraph>

      <SectionTitle>6️⃣ Final Round</SectionTitle>
      <Paragraph>
        Once KABOO is called, every other player gets <strong className="text-foreground">one
        final turn</strong>. Then all cards are revealed and scores are tallied.
      </Paragraph>
    </div>
  );
}

function StrategyContent() {
  return (
    <div>
      <SectionTitle>🧠 Memory is Everything</SectionTitle>
      <Paragraph>
        Memorize your two initial cards. Track every swap you make and every card
        you peek at. Players who remember their cards consistently win.
      </Paragraph>

      <SectionTitle>👀 Watch Your Opponents</SectionTitle>
      <Paragraph>
        Pay attention to what opponents draw and discard. If they keep a drawn
        card, it&apos;s probably low. If they discard quickly, the card was likely high
        or they already have a low hand.
      </Paragraph>

      <SectionTitle>🎯 When to Call KABOO</SectionTitle>
      <Paragraph>
        Call KABOO when you&apos;re confident your total is <strong className="text-foreground">5 or
        less</strong>. Remember — if someone else has a lower score, you&apos;ll get
        a penalty! Don&apos;t rush it.
      </Paragraph>

      <SectionTitle>🔄 Smart Swapping</SectionTitle>
      <Paragraph>
        Always swap out your <strong className="text-foreground">highest known card</strong>. If
        you draw a King (0 points), always keep it. If you draw a mid-value card
        (5–8), only swap if you know you have something worse.
      </Paragraph>

      <SectionTitle>✨ Use Effects Wisely</SectionTitle>
      <Paragraph>
        Discarding a <strong className="text-foreground">7 or 8</strong> to peek at your own unknown
        cards is often worth it early in the game. Use <strong className="text-foreground">9 or
        10</strong> to scout opponents before calling KABOO. Jack/Queen/King swaps
        are powerful late-game plays.
      </Paragraph>

      <SectionTitle>⏱️ Timing Matters</SectionTitle>
      <Paragraph>
        Early game: focus on peeking and learning your hand. Mid game: swap out
        high cards. Late game: call KABOO when you&apos;re confident, before opponents
        optimize their hands further.
      </Paragraph>
    </div>
  );
}
