# Frontend Test Plan

## Objective
- Provide confidence in core Kaboo gameplay flows through automated tests.
- Cover state management, UI behavior, and real API integration for both offline and online modes.

## Test Suites
- **Store Unit Tests**
  - `src/test/onlineStore.test.ts`
  - `src/test/scenario/*.test.ts` (offline store scenarios)
  - `src/test/gameApi.test.ts`
- **Component & Routing Tests**
  - `src/test/onlineComponents.test.tsx`
- **Real API Tests**
  - `src/test/onlineApi.test.ts`

## Prerequisites
- **Node & pnpm** installed.
- **Vitest setup** is already configured via `vitest.config.ts` and `src/test/setup.ts`.
- For real API tests:
  - Hosted Supabase project with Edge Functions deployed.
  - Credentials:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - These must be placed in `.env.test.local`.
  - `ws` dev dependency installed to polyfill WebSocket in `jsdom`.

## Configuration (Real API)
1. Create `.env.test.local` in `kaboo-fe/`.
2. Add your hosted credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   ```

## Test Strategy
- Use Vitest in `jsdom` environment for all frontend tests.
- **WebSocket Polyfill**: `src/test/setup.ts` injects `ws` into `global.WebSocket` for Supabase Realtime.
- Keep unit tests focused:
  - Stores: assert state transitions and API calls, not DOM.
  - Components: assert rendered output and callback wiring, not store internals.
- Use env guards in real API tests to skip when Supabase credentials are not available.
- Prefer high-level assertions over deeply coupling to internal implementation details.

## Store Tests
1. **Online Store (`useOnlineStore`)**
   - Initial state and `resetStore`.
   - `syncFromRemote` mapping from backend `GameState` to local fields.
   - Online actions:
     - `createGame`, `joinGame`, `startGame`, `updateSettings`.
     - `playMove` locking, `leaveGame`, `endGame`, `kickPlayer`.
   - Error handling:
     - API failures show toasts and avoid partial state updates.
     - Subscription error `"You are not in this game"` resets client and shows “Kicked from game” toast.
2. **Offline Store (`useOfflineStore`)**
   - Scenario tests under `src/test/scenario` cover:
     - Kaboo scoring edge cases.
     - Tap / snap interactions.
     - Bot behavior and offline-only flows.
3. **API Client (`gameApi`)**
   - Unit tests verify:
     - Correct Supabase Function names and request bodies.
     - Error mapping from Supabase responses to readable messages.
     - `subscribeToGame` behavior (update callbacks and error callbacks).

## Component & Route Tests
1. **Lobby**
   - `OnlineLobbyScreen`:
     - Host vs guest behavior (host sees End Game button, guest does not).
     - Correct `isHost`, `isReady`, and `canStart` props derived from online store.
   - `LobbyView`:
     - Renders player list and room code for online games.
     - Start button disabled until all other players are ready.
     - Click handlers for Back, Ready, Leave, and optional End Game.
2. **Game Board**
   - `OnlineGameBoard`:
     - Passes `currentPlayerIndex`, `gamePhase`, and `turnPhase` into `GameBoardLayout`.
     - Implements a turn timer that counts down each second when it is the local player’s turn.
3. **Scoring**
   - `OnlineScoringScreen`:
     - Displays final scores and winner.
     - “Play Again” button either starts next round or resets to a new match via store actions.
4. **Route `/multiplayer`**
   - Renders:
     - `OnlineLobbyScreen` when `screen = "lobby"`.
     - `OnlineGameBoard` when `screen = "game"`.
     - `OnlineScoringScreen` when `screen = "scoring"`.
   - When `screen = "home"`, shows loading then redirects to `/` using `next/navigation` router.

## Real API Flow (2-Player)
Implemented in `src/test/onlineApi.test.ts`:
1. **Create Lobby**: Host signs in anonymously and calls `gameApi.createGame`. Asserts `gameId` and `roomCode` shape.
2. **Join Lobby**: Guest signs in and calls `gameApi.joinGame(roomCode)`. Asserts guest joins same game.
3. **Start Game**: Host calls `gameApi.startGame`. Asserts:
   - Response success.
   - Game phase is `initial_look`.
   - Two players are present in state and DB status becomes `playing`.
4. **Play Game**:
   - Fetches current state via `getGameState`.
   - Active player performs `DRAW_FROM_DECK` then `SWAP_WITH_OWN`.
   - Asserts `turnPhase` becomes `action` and turn passes to the opponent.
5. **Realtime Subscribe**:
   - Waiting player subscribes to `postgres_changes` on `games` table.
   - Active player performs another move.
   - Asserts that the listener receives at least one update (when backend and network cooperate).
6. **Leave and End Game**:
   - Guest leaves game via `leaveGame`; asserts only host remains in `game_players`.
   - Host ends game via `endGame`; asserts game record is deleted.

## Running
- All tests:
  - `pnpm test`
- Specific suites:
  - Store and component tests only:
    - `pnpm test src/test/onlineStore.test.ts src/test/onlineComponents.test.tsx src/test/gameApi.test.ts`
  - Real API flow:
    - `pnpm test src/test/onlineApi.test.ts`

## Maintenance
- Keep `gameApi` helpers aligned with backend Edge Function names and payload shapes.
- Update tests when:
  - Game phases or turn logic change.
  - New multiplayer features are added (e.g., new actions or views).
- Use scenario tests (`src/test/scenario`) to capture complex gameplay regressions without over-coupling to implementation details.

