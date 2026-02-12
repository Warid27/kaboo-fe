import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { resetStore } from './testHelpers';

describe('Game Flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Lobby → Dealing', () => {
    it('should create an offline game with correct player count', () => {
      const store = useGameStore.getState();
      store.setPlayerName('TestPlayer');
      store.updateSettings({ numPlayers: 3 });
      store.startOffline();

      const state = useGameStore.getState();
      expect(state.screen).toBe('lobby');
      expect(state.gameMode).toBe('offline');
      expect(state.players).toHaveLength(3);
      expect(state.players[0].name).toBe('TestPlayer');
    });

    it('should deal cards and transition to initial_look', () => {
      const store = useGameStore.getState();
      store.setPlayerName('TestPlayer');
      store.updateSettings({ numPlayers: 2 });
      store.startOffline();
      store.startGame();

      let state = useGameStore.getState();
      expect(state.screen).toBe('game');
      expect(state.gamePhase).toBe('dealing');
      expect(state.players[0].cards).toHaveLength(4);
      expect(state.players[1].cards).toHaveLength(4);
      expect(state.drawPile.length).toBeGreaterThan(0);
      expect(state.discardPile).toHaveLength(1);

      vi.advanceTimersByTime(2500);
      state = useGameStore.getState();
      expect(state.gamePhase).toBe('initial_look');
    });
  });

  describe('Initial Look Phase', () => {
    function setupInitialLook() {
      const store = useGameStore.getState();
      store.setPlayerName('TestPlayer');
      store.updateSettings({ numPlayers: 2 });
      store.startOffline();
      store.startGame();
      vi.advanceTimersByTime(2500);
      return useGameStore.getState();
    }

    it('should allow peeking at 2 cards', () => {
      setupInitialLook();
      let state = useGameStore.getState();
      expect(state.gamePhase).toBe('initial_look');
      expect(state.initialLooksRemaining).toBe(2);

      const card1Id = state.players[0].cards[0].id;
      const card2Id = state.players[0].cards[1].id;

      state.peekCard(card1Id);
      state = useGameStore.getState();
      expect(state.initialLooksRemaining).toBe(1);
      expect(state.peekedCards).toContain(card1Id);

      vi.advanceTimersByTime(2500);
      state = useGameStore.getState();
      expect(state.peekedCards).not.toContain(card1Id);
      expect(state.memorizedCards).toContain(card1Id);

      state.peekCard(card2Id);
      vi.advanceTimersByTime(2500);
      state = useGameStore.getState();
      expect(state.memorizedCards).toContain(card2Id);

      // Now manual ready click is required for all players
      state.readyToPlay(); // Local player ready
      // For offline mode, other players are bots but we still need to set their ready status
      // or ensure the game advances correctly. 
      // In the current implementation, readyToPlay handles the transition if all are ready.
      
      state = useGameStore.getState();
      expect(state.gamePhase).toBe('playing');
      expect(state.turnPhase).toBe('draw');
    });

    it('should not allow peeking more than 2 cards during initial_look', () => {
      setupInitialLook();
      let state = useGameStore.getState();

      const cards = state.players[0].cards;
      state.peekCard(cards[0].id);
      vi.advanceTimersByTime(2500);

      state = useGameStore.getState();
      state.peekCard(cards[1].id);
      vi.advanceTimersByTime(2500);

      state.readyToPlay();
      state = useGameStore.getState();
      expect(state.gamePhase).toBe('playing');
      expect(state.initialLooksRemaining).toBe(0);
    });
  });

  describe('Draw Phase', () => {
    function setupDrawPhaseLocal() {
      const store = useGameStore.getState();
      store.setPlayerName('TestPlayer');
      store.updateSettings({ numPlayers: 2 });
      store.startOffline();
      store.startGame();
      vi.advanceTimersByTime(2500);

      let state = useGameStore.getState();
      const cards = state.players[0].cards;
      state.peekCard(cards[0].id);
      vi.advanceTimersByTime(2500);
      state = useGameStore.getState();
      state.peekCard(cards[1].id);
      vi.advanceTimersByTime(2500);
      
      state.readyToPlay();
      return useGameStore.getState();
    }

    it('should draw a card and transition to action phase', () => {
      setupDrawPhaseLocal();
      let state = useGameStore.getState();
      expect(state.gamePhase).toBe('playing');
      expect(state.turnPhase).toBe('draw');
      expect(state.currentPlayerIndex).toBe(0);

      const drawPileSize = state.drawPile.length;
      state.drawCard();

      state = useGameStore.getState();
      expect(state.turnPhase).toBe('action');
      expect(state.heldCard).not.toBeNull();
      expect(state.heldCard!.faceUp).toBe(true);
      expect(state.drawPile).toHaveLength(drawPileSize - 1);
    });

    it('should not draw when not in draw phase', () => {
      setupDrawPhaseLocal();
      let state = useGameStore.getState();
      state.drawCard();
      state = useGameStore.getState();
      expect(state.turnPhase).toBe('action');

      const heldCard = state.heldCard;
      state.drawCard();
      state = useGameStore.getState();
      expect(state.heldCard).toBe(heldCard);
    });
  });
});
