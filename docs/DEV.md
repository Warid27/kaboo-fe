# Developer Documentation & Project Status Analysis

**Version:** 0.1.0  
**Last Updated:** 2026-02-17  
**Status:** Alpha / MVP (Offline Mode)

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [PWA & Routing](#pwa--routing)
4. [Already Implemented](#already-implemented)
    - [Core Game Logic](#core-game-logic)
    - [State Management](#state-management)
    - [UI Components & UX](#ui-components--ux)
    - [Offline Mode & AI](#offline-mode--ai)
5. [Missing Features & Gaps](#missing-features--gaps)
    - [Online Multiplayer](#online-multiplayer)
    - [Backend & Persistence](#backend--persistence)
    - [Authentication](#authentication)
    - [Testing & QA](#testing--qa)
6. [Getting Started](#getting-started)

---

## Project Overview

**Kaboo Frontend** is a web-based implementation of the card game "Kaboo" (similar to Golf or Cabo). The project is currently a Single Page Application (SPA) focused on a polished single-player experience against AI bots. It is built with modern React patterns and aims for a high-fidelity visual experience with smooth animations.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Testing:** Vitest + React Testing Library
- **Routing:** Next.js App Router

---

## PWA & Routing

Kaboo is installable as a Progressive Web App (PWA) with a service worker and web app manifest.

- **Canonical routes:**
  - `/` – Home screen and mode selection
  - `/single` – Offline mode vs bots (uses the `offlineStore` and `GameEngine`)
  - `/multiplayer` – Online mode vs other players (backed by `onlineStore` and the Supabase backend)
  - `/docs` – In-app documentation (player guide + developer docs)
- Legacy routes `/offline` and `/online` have been removed from the App Router. Any historic references should be updated to `/single` and `/multiplayer`.

### Service worker behavior

- The service worker script lives at `public/sw.js` and is registered from `src/app/providers.tsx`.
- Registration is **production-only**:
  - In `next dev`, the service worker is intentionally not registered to avoid stale-cache issues while developing.
  - In `next build && next start`, the service worker precaches the shell and core assets, enabling offline play for the main flows.
- The install experience is driven by the `beforeinstallprompt` event:
  - When the browser emits `beforeinstallprompt`, the app shows a Sonner toast with an “Install Kaboo” action.
  - The handler stores the deferred prompt event and calls `prompt()` only when the user clicks the install action.

### Manifest, icons, and screenshots

- Manifest: `public/manifest.json`
  - Provides app name, start URL, theme, icons, and screenshots.
  - Uses both `any` and `maskable` icon purposes so Chrome has valid generic icons while still supporting maskable shapes.
- Icons:
  - `public/web-app-manifest-192x192.png`
  - `public/web-app-manifest-512x512.png`
- Screenshots:
  - `public/screenshot-mobile.png` – narrow (mobile) preview
  - `public/screenshot-desktop.png` – wide (desktop) preview

When debugging installability issues, use Chrome DevTools → Application → Manifest to verify that:

- The manifest reports the app as installable.
- At least one icon is ≥144×144 with `purpose` including `any`.
- The screenshots match the sizes declared in the manifest.

## Already Implemented

### Core Game Logic
The core rules and mechanics of Kaboo are fully implemented in the frontend logic.
- **Card System:** Complete deck management including creation, shuffling, dealing, and discard pile logic.
- **Turn Management:** State machine handling all turn phases:
    - `draw` (from deck or discard pile)
    - `action` (play card, use power)
    - `effect` (resolving card powers)
    - `tap_window` (opportunity to snap/tap cards)
    - `end_turn`
- **Card Effects:** Implementation of all standard card powers:
    - Peek Own Card (7, 8)
    - Peek Opponent Card (9, 10)
    - Blind Swap (J, Q)
    - Full Vision Swap (Exchange)
- **Kaboo Mechanic:** Logic for calling "Kaboo", triggering the final round, and calculating scores.
- **Scoring:** Automatic score calculation based on card values and penalty logic.

### State Management
The application uses **Zustand** for a centralized, reactive game store.
- **Store Structure:** Split into slices for maintainability:
    - `lobbyActions`: Game setup and player management.
    - `cardActions`: Card manipulation (draw, swap, discard).
    - `turnActions`: Phase transitions and turn orchestration.
    - `effectActions`: Handling complex card effect interactions.
- **Type Safety:** Comprehensive TypeScript definitions in `src/types/game.ts` ensuring type safety across the store and components.

### UI Components & UX
A polished user interface using Shadcn UI components and custom game elements.
- **[Card Design Guide](./card-design.md):** Instructions for customizing card visuals.
- **Game Board:** Responsive layout supporting up to 8 players.
- **Animations:** Extensive use of Framer Motion for:
    - Card dealing and shuffling.
    - "Flying cards" effect when moving between hands and piles.
    - Smooth transitions for UI overlays.
- **Interactive Elements:**
    - `PlayerHand`: Interactive card container for the user.
    - `OpponentHand`: Compact view for AI/remote players.
    - `ActionButtons`: Context-aware buttons for game actions.
    - `EffectOverlay`: Visual cues during card effect resolution.
- **Lobby:** Functional setup screen for customizing game rules (bot difficulty, player count).

### Offline Mode & AI
A robust single-player mode against computer opponents.
- **Bot AI Engine:** `src/lib/botAI.ts` implements decision-making logic.
    - **Difficulty Levels:** Easy, Medium, Hard.
    - **Memory Simulation:** Bots "remember" cards they've seen based on a reliability factor (Easy bots forget more often).
    - **Heuristics:** Logic for deciding when to swap, when to use effects, and when to call Kaboo.
- **Simulation:** `simulateBotTurn` action automatically executes bot moves with realistic delays.

---

## Missing Features & Gaps

### Online Multiplayer
The most significant gap is the lack of real networking.
- **Networking Layer:** No WebSocket or HTTP implementation for multiplayer communication.
- **Lobby Logic:** `createGame` and `joinGame` are currently stubs that mock an online session locally.
- **Synchronization:** No mechanism to sync game state between clients.

### Backend & Persistence
- **API:** No backend server exists. The project is currently client-side only.
- **Database:** No persistence for:
    - User accounts.
    - Match history.
    - Leaderboards.
    - Game session state (refreshing the page resets the game).

### Authentication
- **User System:** No login/signup functionality.
- **Profiles:** Users act as "Guest" with a temporary name.

### Testing & QA
- **Test Coverage:** Basic unit tests exist in `src/test/`, but integration tests for full game flows are limited.
- **E2E Testing:** No End-to-End (Cypress/Playwright) tests setup.
- **Edge Cases:** Complex interaction chains (e.g., multiple taps in quick succession) may need more robust stress testing.

---

## Getting Started

### Installation
```bash
npm install
# or
pnpm install
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm run test
```
