import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DocSection, CodeBlock, DocTable, Badge } from './DocSection';

const SUB_TABS = [
  { id: 'structure', label: 'Code Structure' },
  { id: 'migration', label: 'Next.js Migration' },
  { id: 'roadmap', label: 'Roadmap' },
] as const;

type SubTab = (typeof SUB_TABS)[number]['id'];

export function DevDocs() {
  const [subTab, setSubTab] = useState<SubTab>('structure');

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-gradient-primary">Developer Docs</h1>
        <p className="mt-2 font-body text-base text-muted-foreground">
          Technical architecture, code structure, and migration guide.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="mb-8 flex gap-1 rounded-xl bg-muted/50 p-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={cn(
              'relative flex-1 rounded-lg px-3 py-2 font-body text-sm font-semibold transition-colors',
              subTab === tab.id
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {subTab === tab.id && (
              <motion.div
                layoutId="dev-sub-tab"
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={subTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {subTab === 'structure' && <StructureDocs />}
        {subTab === 'migration' && <MigrationDocs />}
        {subTab === 'roadmap' && <RoadmapDocs />}
      </motion.div>
    </div>
  );
}

function StructureDocs() {
  return (
    <>
      <DocSection title="📁 Project Structure">
        <CodeBlock title="Directory tree">{`src/
├── assets/              # Static assets (card-back image)
├── components/
│   ├── docs/            # Documentation pages
│   ├── game/            # Core gameplay components
│   │   ├── GameBoard.tsx       # Main game layout & orchestration
│   │   ├── PlayerHand.tsx      # Player's card grid (bottom)
│   │   ├── OpponentHand.tsx    # Opponent card display (positioned)
│   │   ├── PlayingCard.tsx     # Individual card (flip, highlight, peek)
│   │   ├── DrawPile.tsx        # Draw pile with count
│   │   ├── DiscardPile.tsx     # Discard pile (top card visible)
│   │   ├── HeldCard.tsx        # Drawn card awaiting action
│   │   ├── ActionButtons.tsx   # Swap / Discard / KABOO buttons
│   │   ├── EffectOverlay.tsx   # Effect card UI (peek, swap flows)
│   │   ├── TapWindow.tsx       # Tap mini-game overlay
│   │   ├── TurnTimer.tsx       # Countdown timer ring
│   │   ├── TurnLog.tsx         # Turn-by-turn action feed
│   │   ├── FlyingCardLayer.tsx # Card flight animations
│   │   ├── KabooAnnouncement.tsx # KABOO call splash
│   │   ├── CardBackPattern.tsx # Card back design
│   │   ├── DevTools.tsx        # Debug layout tools (DEV mode)
│   │   ├── HelpModal.tsx       # In-game rules reference
│   │   ├── OptionsMenu.tsx     # Pause / settings menu
│   │   ├── SettingsModal.tsx   # Key bindings & volume
│   │   └── useGameInstruction.ts # Context-aware instruction text
│   ├── home/            # Home screen components
│   ├── lobby/           # Pre-game lobby
│   ├── scoring/         # Round-end score display
│   └── ui/              # shadcn/ui primitives
├── hooks/               # Custom React hooks
├── lib/                 # Pure utilities
│   ├── cardUtils.ts     # Deck creation, scoring, effects
│   ├── botAI.ts         # Bot decision engine
│   ├── sounds.ts        # Web Audio API sound effects
│   └── utils.ts         # General helpers (cn, etc.)
├── pages/               # Route-level components
├── store/               # Zustand state management
│   ├── gameStore.ts     # Root store & interface
│   ├── settingsStore.ts # Persisted user preferences
│   ├── devStore.ts      # Dev tools state
│   ├── helpers.ts       # Store utility functions
│   └── slices/          # Modular action slices
│       ├── lobbyActions.ts   # Game creation, player setup
│       ├── cardActions.ts    # Draw, swap, discard
│       ├── effectActions.ts  # Peek, blind swap, etc.
│       ├── tapActions.ts     # Tap window logic
│       └── turnActions.ts    # Turn progression, KABOO, scoring
├── test/                # Vitest test suites
└── types/
    └── game.ts          # Zod schemas & TypeScript types`}</CodeBlock>
      </DocSection>

      <DocSection title="🏗️ Architecture">
        <h3 className="font-display text-lg font-bold text-foreground mb-2">State Machine</h3>
        <p className="mb-3">
          The game is modeled as a <strong>finite state machine</strong> managed by Zustand.
          State transitions flow through well-defined phases:
        </p>
        <CodeBlock title="Game phases">{`Screen:  home → lobby → game → scoring → (home)

GamePhase:  waiting → dealing → initial_look → playing → kaboo_final → reveal
TurnPhase:  draw → action → effect → tap_window → end_turn`}</CodeBlock>

        <h3 className="mt-6 font-display text-lg font-bold text-foreground mb-2">Key Files Explained</h3>
        <DocTable
          headers={['File', 'Purpose']}
          rows={[
            ['gameStore.ts', 'Root Zustand store. Defines the GameStore interface, initial state constants, and composes all action slices. This is the single source of truth for the entire game.'],
            ['types/game.ts', 'All data types validated with Zod schemas — Card, Player, GameSettings, game phase enums, avatar colors, and action schemas.'],
            ['slices/cardActions.ts', 'Handles draw, swap, discard flows. Manages heldCard state and card movement between piles and player hands.'],
            ['slices/effectActions.ts', 'Manages special card effects (peek own, peek opponent, blind swap, semi-blind swap). Controls the effect overlay UI state.'],
            ['slices/tapActions.ts', 'Tap window mini-game — selecting matching cards, penalty logic for wrong taps, and optional swap after successful tap.'],
            ['slices/turnActions.ts', 'Turn progression, KABOO calling, final round countdown, card reveal, scoring calculation, and game reset.'],
            ['slices/lobbyActions.ts', 'Game creation, offline bot setup, player joining, and settings management.'],
            ['lib/botAI.ts', 'Bot decision engine with 3 difficulty tiers. Manages bot memory of seen cards and makes probabilistic decisions for draw, swap, effects, and KABOO calls.'],
            ['lib/cardUtils.ts', 'Pure functions: deck creation, shuffling, card value calculation, KABOO scoring, effect type resolution, and suit/rank helpers.'],
            ['lib/sounds.ts', 'Procedural audio via Web Audio API. No external assets needed — generates card flip, draw, success, and error sounds programmatically.'],
            ['store/settingsStore.ts', 'Persisted user preferences: key bindings, volume controls, animation toggle. Uses zustand/persist with localStorage.'],
            ['store/devStore.ts', 'Dev-only layout debugging state: grid overlay, card scaling, pile offsets, hand gap, and player position adjustments.'],
          ]}
        />

        <h3 className="mt-6 font-display text-lg font-bold text-foreground mb-2">Design System</h3>
        <p>
          Styles use <Badge>Tailwind CSS</Badge> with semantic HSL tokens defined in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">index.css</code>.
          The color palette is dark-mode-first with teal primary, purple secondary, and pink accent.
          Fonts: <strong>Fredoka</strong> (display) + <strong>Nunito</strong> (body).
        </p>
      </DocSection>

      <DocSection title="🧪 Testing">
        <p>
          Tests use <Badge>Vitest</Badge> and are located in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">src/test/</code>.
          Test suites cover game actions, turn flow, and scoring logic by directly manipulating
          the Zustand store.
        </p>
        <CodeBlock title="Run tests">{`bun run test          # or: bunx vitest run`}</CodeBlock>
        <DocTable
          headers={['Test File', 'Coverage']}
          rows={[
            ['gameActions.test.ts', 'Card draw, swap, discard, effect resolution'],
            ['gameFlow.test.ts', 'Game phase transitions, initial look, turn order'],
            ['gameTurnsScoring.test.ts', 'KABOO calls, final round, scoring math'],
          ]}
        />
      </DocSection>
    </>
  );
}

function MigrationDocs() {
  return (
    <>
      <DocSection title="🚀 Migrating to Next.js">
        <p>
          The codebase is designed for portability. Here&apos;s a step-by-step guide to migrate
          from the current Vite + React SPA to a Next.js application.
        </p>
      </DocSection>

      <DocSection title="Step 1: Initialize Next.js Project">
        <CodeBlock title="Terminal">{`npx create-next-app@latest kaboo-next --typescript --tailwind --app
cd kaboo-next

# Install dependencies
npm install zustand zod framer-motion lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-popover  # + other radix primitives
npm install class-variance-authority clsx tailwind-merge`}</CodeBlock>
      </DocSection>

      <DocSection title="Step 2: Move Source Files">
        <DocTable
          headers={['From (Vite)', 'To (Next.js)', 'Notes']}
          rows={[
            ['src/components/', 'src/components/', 'Copy as-is — all React components are compatible'],
            ['src/store/', 'src/store/', 'Zustand stores work unchanged in Next.js'],
            ['src/lib/', 'src/lib/', 'Pure utilities, no changes needed'],
            ['src/types/', 'src/types/', 'Zod schemas work everywhere'],
            ['src/hooks/', 'src/hooks/', 'Custom hooks are framework-agnostic'],
            ['src/index.css', 'src/app/globals.css', 'Move Tailwind config + design tokens'],
            ['src/assets/', 'public/ or src/assets/', 'Static assets — adjust import paths'],
            ['tailwind.config.ts', 'tailwind.config.ts', 'Merge with Next.js generated config'],
          ]}
        />
      </DocSection>

      <DocSection title="Step 3: Convert Pages to App Router">
        <CodeBlock title="src/app/page.tsx">{`'use client';

import { useGameStore } from '@/store/gameStore';
import { HomeScreen } from '@/components/home/HomeScreen';
import { LobbyScreen } from '@/components/lobby/LobbyScreen';
import { GameBoard } from '@/components/game/GameBoard';
import { ScoringScreen } from '@/components/scoring/ScoringScreen';
import { HelpModal } from '@/components/game/HelpModal';

export default function Home() {
  const screen = useGameStore((s) => s.screen);

  return (
    <>
      {screen === 'home' && <HomeScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'game' && <GameBoard />}
      {screen === 'scoring' && <ScoringScreen />}
      <HelpModal />
    </>
  );
}`}</CodeBlock>
        <p className="mt-3">
          <strong>Key:</strong> The <code className="rounded bg-muted px-1.5 py-0.5 text-xs">&apos;use client&apos;</code> directive
          is required because the game uses Zustand, Framer Motion, and browser APIs (Web Audio).
          Game state lives entirely on the client — no server components needed for gameplay.
        </p>
      </DocSection>

      <DocSection title="Step 4: Create Docs Route">
        <CodeBlock title="src/app/docs/page.tsx">{`'use client';

import { DocsLayout } from '@/components/docs/DocsLayout';

export default function DocsPage() {
  return <DocsLayout />;
}`}</CodeBlock>
        <p>
          In Next.js, each route is a folder with a <code className="rounded bg-muted px-1.5 py-0.5 text-xs">page.tsx</code>.
          Remove <code className="rounded bg-muted px-1.5 py-0.5 text-xs">react-router-dom</code> and replace
          {' '}<code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'<Link>'}</code> imports
          with <code className="rounded bg-muted px-1.5 py-0.5 text-xs">next/link</code>.
        </p>
      </DocSection>

      <DocSection title="Step 5: Path Alias & Environment Variables">
        <CodeBlock title="tsconfig.json">{`{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]   // Same alias as Vite
    }
  }
}`}</CodeBlock>
        <CodeBlock title=".env.local">{`# Vite uses VITE_ prefix, Next.js uses NEXT_PUBLIC_
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_IS_ONLINE=false`}</CodeBlock>
        <p className="mt-3">
          <strong>Search & replace</strong> all <code className="rounded bg-muted px-1.5 py-0.5 text-xs">import.meta.env.VITE_</code> with{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">process.env.NEXT_PUBLIC_</code>.
        </p>
      </DocSection>

      <DocSection title="Step 6: Cleanup">
        <ul className="list-inside list-disc space-y-1.5">
          <li>Remove <code className="rounded bg-muted px-1.5 py-0.5 text-xs">react-router-dom</code> — use Next.js file-based routing</li>
          <li>Remove <code className="rounded bg-muted px-1.5 py-0.5 text-xs">vite.config.ts</code>, <code className="rounded bg-muted px-1.5 py-0.5 text-xs">vitest.config.ts</code> — use <code className="rounded bg-muted px-1.5 py-0.5 text-xs">next.config.js</code></li>
          <li>Replace <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'<Link to="...">'}</code> with <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'<Link href="...">'}</code></li>
          <li>Move <code className="rounded bg-muted px-1.5 py-0.5 text-xs">index.html</code> font links into <code className="rounded bg-muted px-1.5 py-0.5 text-xs">src/app/layout.tsx</code></li>
          <li>Add <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'<html>'}</code> and <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{'<body>'}</code> to layout</li>
        </ul>
      </DocSection>

      <DocSection title="⚠️ Gotchas">
        <ul className="list-inside list-disc space-y-1.5">
          <li><strong>Zustand + SSR:</strong> Zustand works on the client. Wrap game pages with <code className="rounded bg-muted px-1.5 py-0.5 text-xs">&apos;use client&apos;</code>.</li>
          <li><strong>Web Audio API:</strong> Only available in the browser. The <code className="rounded bg-muted px-1.5 py-0.5 text-xs">sounds.ts</code> file already handles this gracefully.</li>
          <li><strong>Framer Motion:</strong> Requires client components. All animation components need <code className="rounded bg-muted px-1.5 py-0.5 text-xs">&apos;use client&apos;</code>.</li>
          <li><strong>localStorage:</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">settingsStore.ts</code> uses <code className="rounded bg-muted px-1.5 py-0.5 text-xs">zustand/persist</code> which accesses localStorage — client-only.</li>
        </ul>
      </DocSection>
    </>
  );
}

function RoadmapDocs() {
  return (
    <>
      <DocSection title="✅ Implemented Features">
        <ul className="list-inside list-disc space-y-1.5">
          <li>Full offline gameplay vs bots (2–8 players)</li>
          <li>3 bot difficulty tiers with memory simulation</li>
          <li>All card effects: peek own, peek opponent, blind swap, semi-blind swap</li>
          <li>Tap window mechanic with penalty system</li>
          <li>KABOO calling with final round logic</li>
          <li>Scoring with KABOO caller bonus/penalty</li>
          <li>Card flip animations with 3D perspective</li>
          <li>Flying card animations between positions</li>
          <li>Procedural sound effects (Web Audio API)</li>
          <li>Keyboard shortcuts (fully customizable)</li>
          <li>Turn timer with configurable duration</li>
          <li>Turn-by-turn action log</li>
          <li>Dev tools for layout debugging</li>
          <li>Responsive dark-mode UI</li>
        </ul>
      </DocSection>

      <DocSection title="🚧 Missing / Future Implementation">
        <DocTable
          headers={['Feature', 'Priority', 'Description']}
          rows={[
            ['Online Multiplayer', 'High', 'Real-time WebSocket multiplayer via Supabase Realtime or Socket.io. Room creation and joining UI exists but is disabled (VITE_IS_ONLINE flag).'],
            ['Full Vision Swap (Q)', 'Medium', 'The full_vision_swap effect type is defined but not fully wired. Queen currently uses semi_blind_swap.'],
            ['Matt\'s Pairs Rule', 'Medium', 'Setting exists in GameSettings but the rule (matching pairs discard) is not implemented in game logic.'],
            ['Multi-Round Scoring', 'Medium', 'totalScore field exists on Player but multi-round tracking with a target score (e.g., 100 pts) is not built.'],
            ['Sound Toggle per Effect', 'Low', 'Global volume exists but no per-sound-type toggle. Some actions still lack sound feedback.'],
            ['Mobile Touch Optimization', 'Medium', 'UI is responsive but touch targets and drag interactions need polish for mobile.'],
            ['Replay / Undo System', 'Low', 'No action history or undo capability. Would need action log refactor.'],
            ['Animations Config', 'Low', 'animationsEnabled setting exists but isn\'t wired to all animations.'],
            ['Persistent Stats', 'Low', 'No win/loss tracking across sessions.'],
            ['Theming / Light Mode', 'Low', 'Dark-mode-only currently. CSS tokens support light mode but no toggle exists.'],
          ]}
        />
      </DocSection>

      <DocSection title="🏛️ Architecture Decisions">
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong>Zustand over Redux:</strong> Simpler API, no boilerplate. Slices pattern provides
            modularity without Redux Toolkit&apos;s complexity.
          </li>
          <li>
            <strong>Zod for types:</strong> Runtime validation + TypeScript inference from one source.
            Prepares for multiplayer where server-side validation is needed.
          </li>
          <li>
            <strong>No external sound files:</strong> Web Audio API generates all sounds procedurally,
            reducing bundle size and eliminating asset loading issues.
          </li>
          <li>
            <strong>State machine pattern:</strong> Game phases enforce valid transitions, preventing
            impossible states (e.g., drawing during effect resolution).
          </li>
          <li>
            <strong>Bot AI separation:</strong> Bot logic is pure functions that read state and return
            decisions — decoupled from UI and store mutations.
          </li>
        </ul>
      </DocSection>

      <DocSection title="📝 Environment Variables">
        <DocTable
          headers={['Variable', 'Type', 'Description']}
          rows={[
            ['VITE_DEBUG_MODE', 'boolean', 'Enables floating DEV tools button for layout debugging'],
            ['VITE_IS_ONLINE', 'boolean', 'Enables online multiplayer UI (Create/Join game). Currently disabled.'],
          ]}
        />
      </DocSection>
    </>
  );
}
