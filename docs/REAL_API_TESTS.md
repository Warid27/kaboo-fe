# Real API Testing Plan

## Objective
- Replace mocked API calls with tests that hit deployed Supabase Edge Functions.
- Validate end-to-end flows: create game, join game, start game, fetch state, optional move.

## Prerequisites
- **Hosted Supabase Project**: You must have a live Supabase project.
- **Credentials**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - *These must be placed in `.env.test.local`*
- **No Docker Required**: These tests run against the live URL. Docker is not used.
- **Dependencies**: `ws` package installed (dev) to polyfill WebSocket for Realtime tests.
- **Warning**: Use a dedicated *testing* project or ensure you are okay with test data being created.

## Configuration
1. Create `.env.test.local` in `kaboo-fe/`.
2. Add your hosted credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   ```


## Test Strategy
- Use Vitest in jsdom environment; leverage supabase-js client.
- **WebSocket Polyfill**: `setup.ts` injects `ws` into `global.WebSocket` to enable Realtime subscriptions in `jsdom`.
- Authenticate via signInAnonymously and capture session tokens.
- Switch identity within a single test using supabase.auth.setSession.
- Guard tests with env presence; skip when vars missing or placeholders.
- Keep assertions high-level to avoid coupling to internal game details.

## Test Flow (2-Player Perspective)
1. **Create Lobby**: Host signs in, creates game. Verify `gameId` and `roomCode`.
2. **Join Lobby**: Guest signs in, joins with `roomCode`. Verify success.
3. **Start Game**: Host starts game. Verify state phase is `playing` and 2 players exist.
4. **Play Game**:
   - Identify current turn owner (Host or Guest).
   - Switch session to active player.
   - Perform `DRAW_FROM_DECK`. Verify `turnPhase` -> `action`.
   - Perform `SWAP_WITH_OWN`. Verify turn passes to opponent.
5. **Subscribe (Realtime)**:
   - Setup `postgres_changes` listener on `games` table for the *waiting* player.
   - Active player performs a move (triggering DB update).
   - Verify listener receives the update event.

## Risks and Mitigations
- **Realtime in Test Env**: `jsdom` lacks WebSocket. Mitigation: Polyfilled `ws` in `setup.ts`.
- **Turn Order Randomness**: Backend randomizes start order. Mitigation: Test dynamically checks `currentTurnUserId` to decide who plays.
- Flakiness from network or backend availability → use env guard and minimal assertions.

## Running
- `pnpm test`
- Tests are skipped automatically if `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set.
- To run locally with real backend:
  1. `cp .env.local.example .env.test.local`
  2. Fill in Supabase credentials.
  3. `pnpm test`

## Maintenance
- Keep API routes in gameApi aligned with backend function names.
- Update assertions if backend response shape evolves.
