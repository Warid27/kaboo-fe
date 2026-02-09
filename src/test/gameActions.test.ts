import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { resetStore, setupDrawPhase } from './testHelpers';

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
      const state = useGameStore.getState();
      state.drawCard();
      return useGameStore.getState();
    }

    it('should swap a card and move to end_turn or effect', () => {
      setupActionPhase();
      let state = useGameStore.getState();

      const playerCard = state.players[0].cards[0];
      const discardPileSize = state.discardPile.length;

      state.selectCard(playerCard.id);
      state = useGameStore.getState();
      expect(state.selectedCards).toContain(playerCard.id);

      state.swapCard(playerCard.id);
      state = useGameStore.getState();

      const hasEffect = ['7', '8', '9', '10', 'J', 'Q', 'K'].includes(playerCard.rank);
      if (hasEffect) {
        expect(state.turnPhase).toBe('effect');
      } else {
        // Non-effect swaps open a tap window before end_turn
        expect(state.turnPhase).toBe('tap_window');
        vi.advanceTimersByTime(3500);
        state = useGameStore.getState();
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
      const state = useGameStore.getState();
      state.drawCard();
      return useGameStore.getState();
    }

    it('should discard held card with no effect → tap_window → end_turn', () => {
      setupActionPhase();

      useGameStore.setState({
        heldCard: { id: 'test-3-clubs', suit: 'clubs', rank: '3', faceUp: true },
      });
      let state = useGameStore.getState();
      const discardPileSize = state.discardPile.length;

      state.discardHeldCard();
      state = useGameStore.getState();

      expect(state.heldCard).toBeNull();
      expect(state.discardPile).toHaveLength(discardPileSize + 1);
      expect(state.turnPhase).toBe('tap_window');
      expect(state.tapState).not.toBeNull();
      expect(state.tapState?.phase).toBe('window');

      vi.advanceTimersByTime(3500);
      state = useGameStore.getState();
      expect(state.tapState).toBeNull();
      expect(state.turnPhase).toBe('end_turn');
    });

    it('should discard an effect card → show effect overlay', () => {
      setupActionPhase();

      useGameStore.setState({
        heldCard: { id: 'test-7-hearts', suit: 'hearts', rank: '7', faceUp: true },
      });
      let state = useGameStore.getState();

      state.discardHeldCard();
      state = useGameStore.getState();

      expect(state.turnPhase).toBe('effect');
      expect(state.effectType).toBe('peek_own');
      expect(state.showEffectOverlay).toBe(true);
    });
  });

  describe('Effect Resolution', () => {
    function setupEffectPhase(rank: string, suit: string = 'hearts') {
      setupDrawPhase(vi);
      let state = useGameStore.getState();
      state.drawCard();

      useGameStore.setState({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        heldCard: { id: `test-${rank}-${suit}`, suit: suit as any, rank: rank as any, faceUp: true },
      });

      state = useGameStore.getState();
      state.discardHeldCard();
      return useGameStore.getState();
    }

    it('peek_own: should peek at a card and transition to end_turn', () => {
      setupEffectPhase('7');
      let state = useGameStore.getState();
      expect(state.effectType).toBe('peek_own');

      const cardToPeek = state.players[0].cards[2].id;
      state.resolveEffect(cardToPeek);
      state = useGameStore.getState();
      expect(state.peekedCards).toContain(cardToPeek);

      vi.advanceTimersByTime(2500);
      state = useGameStore.getState();
      expect(state.turnPhase).toBe('end_turn');
      expect(state.effectType).toBeNull();
    });

    it('peek_opponent: should peek opponent card → end_turn', () => {
      setupEffectPhase('9');
      let state = useGameStore.getState();
      expect(state.effectType).toBe('peek_opponent');

      const oppCardId = state.players[1].cards[0].id;
      state.resolveEffect(oppCardId);
      state = useGameStore.getState();
      expect(state.peekedCards).toContain(oppCardId);

      vi.advanceTimersByTime(2500);
      state = useGameStore.getState();
      expect(state.turnPhase).toBe('end_turn');
    });

    it('blind_swap: select 2 cards and confirm → end_turn', () => {
      setupEffectPhase('J');
      let state = useGameStore.getState();
      expect(state.effectType).toBe('blind_swap');

      const ownCardId = state.players[0].cards[0].id;
      const oppCardId = state.players[1].cards[0].id;

      state.selectCard(ownCardId);
      state = useGameStore.getState();
      state.selectCard(oppCardId);
      state = useGameStore.getState();
      expect(state.selectedCards).toHaveLength(2);

      state.confirmEffect();
      state = useGameStore.getState();
      expect(state.turnPhase).toBe('end_turn');
      expect(state.effectType).toBeNull();
      expect(state.selectedCards).toHaveLength(0);
    });

    it('decline effect → end_turn', () => {
      setupEffectPhase('7');
      let state = useGameStore.getState();

      state.declineEffect();
      state = useGameStore.getState();
      expect(state.turnPhase).toBe('end_turn');
      expect(state.effectType).toBeNull();
      expect(state.showEffectOverlay).toBe(false);
    });
  });
});
