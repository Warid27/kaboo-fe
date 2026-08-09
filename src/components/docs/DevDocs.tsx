import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Folder, Blocks, FlaskConical, CheckCircle2, Landmark, FileText, Github } from 'lucide-react';
import { DocSection, CodeBlock, DocTable, Badge } from './DocSection';
const SUB_TABS = [
  { id: 'structure', label: 'Code Structure' },
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
          Technical architecture, code structure, and development roadmap.
        </p>
        <a 
          href="https://github.com/Warid27/kaboo-fe" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-body text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Github className="h-4 w-4" />
          <span>github.com/Warid27/kaboo-fe</span>
        </a>
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
        {subTab === 'roadmap' && <RoadmapDocs />}
      </motion.div>
    </div>
  );
}

function StructureDocs() {
  return (
    <>
      <DocSection title="Project Structure" icon={<Folder className="h-6 w-6" />}>
        <CodeBlock title="Directory tree">{`src/
├── app/                 # Next.js App Router entrypoints
│   ├── page.tsx         # Home page
│   ├── layout.tsx       # Root layout
│   ├── single/          # Offline mode (vs bots)
│   ├── multiplayer/     # Online mode (vs players)
│   ├── docs/            # Documentation route
│   └── dev/             # Internal debug pages (layout, cards)
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
├── store/               # Zustand state management
│   ├── offlineStore.ts  # Offline game store (engine-backed)
│   ├── onlineStore.ts   # Online game store (sync-backed)
│   ├── settingsStore.ts # Persisted user preferences
│   ├── devStore.ts      # Dev tools state
│   ├── helpers.ts       # Store utility functions
│   └── slices/          # Modular action slices (legacy)
│       ├── lobbyActions.ts   # Game creation, player setup
│       ├── cardActions.ts    # Draw, swap, discard
│       ├── effectActions.ts  # Peek, blind swap, etc.
│       ├── tapActions.ts     # Tap window logic
│       └── turnActions.ts    # Turn progression, KABOO, scoring
├── test/                # Vitest test suites
└── types/
    └── game.ts          # Zod schemas & TypeScript types`}</CodeBlock>
      </DocSection>

      <DocSection title="PWA & Routing" icon={<FileText className="h-6 w-6" />}>
        <DocTable
          headers={['Route', 'Purpose']}
          rows={[
            ['/', 'Home screen with mode selection and quick start'],
            ['/single', 'Offline mode vs bots (uses offlineStore and GameEngine)'],
            ['/multiplayer', 'Online mode vs players (backed by onlineStore)'],
            ['/docs', 'In-app documentation (player guide + dev docs)'],
          ]}
        />
        <p className="mt-4">
          The app ships as a Progressive Web App (PWA). A service worker is registered only in
          production builds and handles precaching of the shell and core assets. When the browser
          emits <code className="rounded bg-muted px-1.5 py-0.5 text-xs">beforeinstallprompt</code>,
          the UI shows a toast-based install prompt (&quot;Install Kaboo&quot;) using the Sonner
          toaster. In development (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">next dev</code>),
          the service worker is intentionally disabled to avoid stale-cache issues while iterating.
        </p>
        <p className="mt-3">
          PWA metadata lives in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">public/manifest.json</code>{' '}
          and icons/screenshots in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">public/</code>. The
          service worker script is <code className="rounded bg-muted px-1.5 py-0.5 text-xs">public/sw.js</code>,
          registered from <code className="rounded bg-muted px-1.5 py-0.5 text-xs">src/app/providers.tsx</code>.
          Background music tracks are served from <code className="rounded bg-muted px-1.5 py-0.5 text-xs">public/kaboo-1.mp3</code>{' '}
          and <code className="rounded bg-muted px-1.5 py-0.5 text-xs">public/kaboo-2.mp3</code>, and are cached by the
          service worker using a runtime cache strategy for <code className="rounded bg-muted px-1.5 py-0.5 text-xs">request.destination === "audio"</code>.
        </p>
      </DocSection>

      <DocSection title="Architecture" icon={<Blocks className="h-6 w-6" />}>
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
            ['offlineStore.ts', 'Core offline store. Uses gameEngine.ts for all state transitions. The primary store for single-player/local games.'],
            ['onlineStore.ts', 'Core online store. Synchronizes state with the Cloudflare Workers backend and handles multiplayer communication.'],
            ['engine/gameEngine.ts', 'The heart of the game. Contains pure, side-effect-free logic for all game rules and state transitions.'],
            ['types/game.ts', 'All data types validated with Zod schemas — Card, Player, GameSettings, game phase enums, avatar colors, and action schemas.'],
            ['slices/cardActions.ts', 'Handles draw, swap, discard flows. Manages heldCard state and card movement between piles and player hands.'],
            ['slices/effectActions.ts', 'Manages special card effects (peek own, peek opponent, blind swap, semi-blind swap). Controls the effect overlay UI state.'],
            ['slices/tapActions.ts', 'Tap window mini-game — selecting matching cards, penalty logic for wrong taps, and optional swap after successful tap.'],
            ['slices/turnActions.ts', 'Turn progression, KABOO calling, final round countdown, card reveal, scoring calculation, and game reset.'],
            ['slices/lobbyActions.ts', 'Game creation, offline bot setup, player joining, and settings management.'],
            ['lib/botAI.ts', 'Bot decision engine with 3 difficulty tiers. Manages bot memory of seen cards and makes probabilistic decisions for draw, swap, effects, and KABOO calls.'],
            ['lib/cardUtils.ts', 'Pure functions: deck creation, shuffling, card value calculation, KABOO scoring, effect type resolution, and suit/rank helpers.'],
            ['lib/sounds.ts', 'Procedural sound effects via Web Audio API plus background music loaded from public/kaboo-*.mp3.'],
            ['store/settingsStore.ts', 'Persisted user preferences: key bindings, volume controls, background track, theme, and toggles. Uses zustand/persist with localStorage.'],
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

      <DocSection title="Testing" icon={<FlaskConical className="h-6 w-6" />}>
        <p>
          Tests use <Badge>Vitest</Badge> and are located in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">src/test/</code>.
          Test suites cover game actions, turn flow, and scoring logic by directly manipulating
          the Zustand store.
        </p>
        <CodeBlock title="Run tests">{`npm run test          # or: npx vitest run`}</CodeBlock>
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

function RoadmapDocs() {
  return (
    <>
      <DocSection title="Implemented Features" icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}>
        <ul className="list-inside list-disc space-y-1.5">
          <li>Full offline gameplay vs bots (2–8 players)</li>
          <li>Next.js Migration (App Router)</li>
          <li>3 bot difficulty tiers with memory simulation</li>
          <li>All card effects: peek own, peek opponent, blind swap, semi-blind swap, full vision swap</li>
          <li>Tap window mechanic with penalty system</li>
          <li>KABOO calling with final round logic</li>
          <li>Scoring with KABOO caller bonus/penalty</li>
          <li>Multi-round scoring with target score tracking</li>
          <li>Matt&apos;s Pairs Rule (discard matching pairs)</li>
          <li>Persistent stats (games played, win rate, best score)</li>
          <li>Undo system (offline mode)</li>
          <li>Sound Toggle per Effect (granular control)</li>
          <li>Theme support (Light/Dark/System)</li>
          <li>Card flip animations with 3D perspective</li>
          <li>Flying card animations between positions</li>
          <li>Procedural sound effects (Web Audio API) and background music with selectable track</li>
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
            ['Online Multiplayer', 'High', 'Real-time WebSocket multiplayer via Cloudflare Workers + Durable Objects. Room creation and joining UI is now live.'],
            ['Mobile Touch Optimization', 'Medium', 'UI is responsive but touch targets and drag interactions need polish for mobile.'],
            ['Animations Config', 'Low', 'animationsEnabled setting exists but isn\'t wired to all animations.'],
          ]}
        />
      </DocSection>

      <DocSection title="Architecture Decisions" icon={<Landmark className="h-6 w-6" />}>
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong>Next.js App Router:</strong> Leverages modern React features, file-based routing, and built-in optimization.
          </li>
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
            reducing npmdle size and eliminating asset loading issues.
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

      <DocSection title="Environment Variables" icon={<FileText className="h-6 w-6" />}>
        <DocTable
          headers={['Variable', 'Type', 'Description']}
          rows={[
            ['NEXT_PUBLIC_DEBUG_MODE', 'boolean', 'Enables floating DEV tools button for layout debugging'],
            ['NEXT_PUBLIC_IS_ONLINE', 'boolean', 'Enables online multiplayer UI (Create/Join game). Currently disabled.'],
          ]}
        />
      </DocSection>
    </>
  );
}
