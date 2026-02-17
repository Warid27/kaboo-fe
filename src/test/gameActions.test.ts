import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useOfflineStore, resetStore } from '@/store/offlineStore';
import type { Rank, Suit } from '@/types/game';
import { setupDrawPhase } from './testHelpers';

describe('Game Actions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Action Phase — Swap', () => {
    function setupActionPhase() {
      setupDrawPhase(vi);
      const state = useOfflineStore.getState();
      state.drawCard();
      return useOfflineStore.getState();
    }

    it('should swap a card and move to end_turn or effect', () => {
      setupActionPhase();
      let state = useOfflineStore.getState();

      const playerCard = state.players[0].cards[0];
      const discardPileSize = state.discardPile.length;

      state.swapCard(playerCard.id);
      state = useOfflineStore.getState();

      const hasEffect = ['7', '8', '9', '10', 'J', 'Q'].includes(playerCard.rank);
      if (hasEffect) {
        expect(state.turnPhase).toBe('effect');
      } else {
        // Non-effect swaps open a tap window before end_turn
        expect(state.turnPhase).toBe('tap_window');
        vi.advanceTimersByTime(3500);
        state = useOfflineStore.getState();
        expect(state.turnPhase).toBe('end_turn');
      }
      expect(state.heldCard).toBeNull();
      expect(state.discardPile).toHaveLength(discardPileSize + 1);
      const newCard = state.players[0].cards[0];
      expect(newCard.faceUp).toBe(false);
    });
  });

  describe('Action Phase — Discard', () => {
    function setupActionPhase() {
      setupDrawPhase(vi);
      const state = useOfflineStore.getState();
      state.drawCard();
      return useOfflineStore.getState();
    }

    it('should discard held card with no effect → tap_window → end_turn', () => {
      setupActionPhase();

      useOfflineStore.setState({
        heldCard: { id: 'test-3-clubs', suit: 'clubs', rank: '3', faceUp: true },
      });
      let state = useOfflineStore.getState();
      const discardPileSize = state.discardPile.length;

      state.discardHeldCard();
      state = useOfflineStore.getState();

      expect(state.heldCard).toBeNull();
      expect(state.discardPile).toHaveLength(discardPileSize + 1);
      expect(state.turnPhase).toBe('tap_window');
      expect(state.tapState).not.toBeNull();
      expect(state.tapState?.phase).toBe('window');

      vi.advanceTimersByTime(3500);
      state = useOfflineStore.getState();
      expect(state.tapState).toBeNull();
      expect(state.turnPhase).toBe('end_turn');
    });

    it('should discard an effect card → show effect overlay', () => {
      setupActionPhase();

      useOfflineStore.setState({
        heldCard: { id: 'test-7-hearts', suit: 'hearts', rank: '7', faceUp: true },
      });
      let state = useOfflineStore.getState();

      state.discardHeldCard();
      state = useOfflineStore.getState();

      expect(state.turnPhase).toBe('effect');
      expect(state.effectType).toBe('peek_own');
    });
  });

  describe('Effect Resolution', () => {
    function setupEffectPhase(rank: Rank, suit: Suit = 'hearts') {
      setupDrawPhase(vi);
      let state = useOfflineStore.getState();
      state.drawCard();

      useOfflineStore.setState({
        heldCard: { id: `test-${rank}-${suit}`, suit, rank, faceUp: true },
      });

      state = useOfflineStore.getState();
      state.discardHeldCard();
      return useOfflineStore.getState();
    }

    it('peek_own: should peek at a card and transition to end_turn', () => {
      setupEffectPhase('7');
      let state = useOfflineStore.getState();
      expect(state.effectType).toBe('peek_own');

      const cardToPeek = state.players[0].cards[2].id;
      state.resolveEffect(cardToPeek);
      state = useOfflineStore.getState();
      expect(state.peekedCards).toContain(cardToPeek);

      vi.advanceTimersByTime(2500);
      state = useOfflineStore.getState();
      expect(state.turnPhase).toBe('end_turn');
      expect(state.effectType).toBeNull();
    });

    it('peek_opponent: should peek opponent card → end_turn', () => {
      setupEffectPhase('9');
      let state = useOfflineStore.getState();
      expect(state.effectType).toBe('peek_opponent');

      const oppCardId = state.players[1].cards[0].id;
      state.resolveEffect(oppCardId);
      state = useOfflineStore.getState();
      expect(state.peekedCards).toContain(oppCardId);

      vi.advanceTimersByTime(2500);
      state = useOfflineStore.getState();
      expect(state.turnPhase).toBe('end_turn');
    });

    it('blind_swap: select 2 cards and confirm → end_turn', () => {
      setupEffectPhase('J');
      let state = useOfflineStore.getState();
      expect(state.effectType).toBe('blind_swap');

      const ownCardId = state.players[0].cards[0].id;
      const oppCardId = state.players[1].cards[0].id;

      state.selectCard(ownCardId);
      state = useOfflineStore.getState();
      state.selectCard(oppCardId);
      state = useOfflineStore.getState();
      expect(state.selectedCards).toHaveLength(2);

      state.confirmEffect();
      state = useOfflineStore.getState();
      expect(state.turnPhase).toBe('end_turn');
      expect(state.effectType).toBeNull();
      expect(state.selectedCards).toHaveLength(0);
    });

    it('decline effect → end_turn', () => {
      setupEffectPhase('7');
      let state = useOfflineStore.getState();

      state.declineEffect();
      state = useOfflineStore.getState();
      expect(state.turnPhase).toBe('end_turn');
      expect(state.effectType).toBeNull();
      expect(state.showEffectOverlay).toBe(false);
    });
  });
});
