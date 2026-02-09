import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { resetStore, setupDrawPhase } from './testHelpers';

describe('Game Turns & Scoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('End Turn & Bot Turn', () => {
    function setupEndTurn() {
      setupDrawPhase(vi);

      let state = useGameStore.getState();
      state.drawCard();
      useGameStore.setState({
        heldCard: { id: 'test-2-clubs', suit: 'clubs', rank: '2', faceUp: true },
      });
      state = useGameStore.getState();
      state.discardHeldCard();

      vi.advanceTimersByTime(3500);
      return useGameStore.getState();
    }

    it('should advance to next player on end turn', () => {
      setupEndTurn();
      let state = useGameStore.getState();
      expect(state.turnPhase).toBe('end_turn');
      expect(state.currentPlayerIndex).toBe(0);

      state.endTurn();
      state = useGameStore.getState();
      expect(state.currentPlayerIndex).toBe(1);
      expect(state.turnPhase).toBe('draw');
    });

    it('should trigger bot turn in offline mode', () => {
      setupEndTurn();
      let state = useGameStore.getState();

      state.endTurn();
      state = useGameStore.getState();
      expect(state.currentPlayerIndex).toBe(1);

      vi.advanceTimersByTime(1500); // bot starts
      vi.advanceTimersByTime(1500); // bot decides
      vi.advanceTimersByTime(1500); // bot action
      vi.advanceTimersByTime(3500); // tap window
      vi.advanceTimersByTime(1500); // finalize

      state = useGameStore.getState();
      // Bot should have completed its turn
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.turnPhase).toBe('draw');
    });
  });

  describe('KABOO Calling', () => {
    function setupKabooReady() {
      setupDrawPhase(vi);
      return useGameStore.getState();
    }

    it('should call KABOO and trigger final round', () => {
      setupKabooReady();
      let state = useGameStore.getState();
      expect(state.gamePhase).toBe('playing');

      state.callKaboo();
      state = useGameStore.getState();

      expect(state.kabooCalled).toBe(true);
      expect(state.kabooCallerIndex).toBe(0);
      expect(state.gamePhase).toBe('kaboo_final');
      expect(state.showKabooAnnouncement).toBe(true);
      expect(state.finalRoundTurnsLeft).toBe(1);

      vi.advanceTimersByTime(3500);
      state = useGameStore.getState();
      expect(state.showKabooAnnouncement).toBe(false);
    });
  });

  describe('Card Selection', () => {
    it('should toggle card selection', () => {
      const store = useGameStore.getState();
      store.selectCard('card-1');
      let state = useGameStore.getState();
      expect(state.selectedCards).toContain('card-1');

      store.selectCard('card-1');
      state = useGameStore.getState();
      expect(state.selectedCards).not.toContain('card-1');
    });

    it('should clear selection', () => {
      const store = useGameStore.getState();
      store.selectCard('card-1');
      store.selectCard('card-2');
      store.clearSelection();

      const state = useGameStore.getState();
      expect(state.selectedCards).toHaveLength(0);
    });
  });
});
