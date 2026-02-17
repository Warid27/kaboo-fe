import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useOfflineStore, resetStore } from '@/store/offlineStore';

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
      const store = useOfflineStore.getState();
      store.setPlayerName('TestPlayer');
      store.updateSettings({ numPlayers: 3 });
      store.startOfflineGame();

      const state = useOfflineStore.getState();
      expect(state.screen).toBe('game');
      expect(state.players).toHaveLength(3);
      expect(state.players[0].name).toBe('TestPlayer');
    });

    it('should deal cards and transition to initial_look', () => {
      const store = useOfflineStore.getState();
      store.setPlayerName('TestPlayer');
      store.updateSettings({ numPlayers: 2 });
      store.startOfflineGame();

      let state = useOfflineStore.getState();
      expect(state.screen).toBe('game');
      expect(state.gamePhase).toBe('dealing');
      expect(state.players[0].cards).toHaveLength(4);
      expect(state.players[1].cards).toHaveLength(4);
      expect(state.drawPile.length).toBeGreaterThan(0);
      expect(state.discardPile).toHaveLength(1);

      vi.advanceTimersByTime(2500);
      state = useOfflineStore.getState();
      expect(state.gamePhase).toBe('initial_look');
    });
  });

  describe('Initial Look Phase', () => {
    function setupInitialLook() {
      const store = useOfflineStore.getState();
      store.setPlayerName('TestPlayer');
      store.updateSettings({ numPlayers: 2 });
      store.startOfflineGame();
      vi.advanceTimersByTime(2500);
      return useOfflineStore.getState();
    }

    it('should allow peeking at 2 cards', () => {
      setupInitialLook();
      let state = useOfflineStore.getState();
      expect(state.gamePhase).toBe('initial_look');
      expect(state.initialLooksRemaining).toBe(2);

      const card1Id = state.players[0].cards[0].id;
      const card2Id = state.players[0].cards[1].id;

      state.peekCard(card1Id);
      state = useOfflineStore.getState();
      expect(state.initialLooksRemaining).toBe(1);
      expect(state.peekedCards).toContain(card1Id);

      vi.advanceTimersByTime(2500);
      state = useOfflineStore.getState();
      expect(state.peekedCards).not.toContain(card1Id);

      state.peekCard(card2Id);
      vi.advanceTimersByTime(2500);
      state = useOfflineStore.getState();

      // Now manual ready click is required for all players
      state.readyToPlay(); // Local player ready
      
      state = useOfflineStore.getState();
      expect(state.gamePhase).toBe('playing');
      expect(state.turnPhase).toBe('draw');
    });

    it('should not allow peeking more than 2 cards during initial_look', () => {
      setupInitialLook();
      let state = useOfflineStore.getState();

      const cards = state.players[0].cards;
      state.peekCard(cards[0].id);
      vi.advanceTimersByTime(2500);
      state.peekCard(cards[1].id);
      vi.advanceTimersByTime(2500);
      
      state = useOfflineStore.getState();
      expect(state.initialLooksRemaining).toBe(0);
      
      state.peekCard(cards[2].id);
      state = useOfflineStore.getState();
      expect(state.peekedCards).not.toContain(cards[2].id);
    });
  });

  describe('Draw Phase', () => {
    function setupDrawPhaseLocal() {
      const store = useOfflineStore.getState();
      store.setPlayerName('TestPlayer');
      store.updateSettings({ numPlayers: 2 });
      store.startOfflineGame();
      vi.advanceTimersByTime(2500);

      let state = useOfflineStore.getState();
      const cards = state.players[0].cards;
      state.peekCard(cards[0].id);
      vi.advanceTimersByTime(2500);
      state = useOfflineStore.getState();
      state.peekCard(cards[1].id);
      vi.advanceTimersByTime(2500);
      
      state.readyToPlay();
      return useOfflineStore.getState();
    }

    it('should draw a card and transition to action phase', () => {
      setupDrawPhaseLocal();
      let state = useOfflineStore.getState();
      expect(state.gamePhase).toBe('playing');
      expect(state.turnPhase).toBe('draw');
      expect(state.currentPlayerIndex).toBe(0);

      const drawPileSize = state.drawPile.length;
      state.drawCard();

      state = useOfflineStore.getState();
      expect(state.turnPhase).toBe('action');
      expect(state.heldCard).not.toBeNull();
      expect(state.heldCard!.faceUp).toBe(true);
      expect(state.drawPile).toHaveLength(drawPileSize - 1);
    });

    it('should not draw when not in draw phase', () => {
      setupDrawPhaseLocal();
      let state = useOfflineStore.getState();
      state.drawCard();
      state = useOfflineStore.getState();
      expect(state.turnPhase).toBe('action');

      const heldCard = state.heldCard;
      state.drawCard();
      state = useOfflineStore.getState();
      expect(state.heldCard).toBe(heldCard);
    });
  });
});
