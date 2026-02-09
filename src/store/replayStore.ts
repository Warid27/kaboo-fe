import { create } from 'zustand';
import type { Card, Player, GamePhase, TurnPhase, EffectType, TapState } from '@/types/game';

export interface StateSnapshot {
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  heldCard: Card | null;
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayerIndex: number;
  effectType: EffectType;
  kabooCalled: boolean;
  kabooCallerIndex: number | null;
  finalRoundTurnsLeft: number;
  selectedCards: string[];
  peekedCards: string[];
  memorizedCards: string[];
  tapState: TapState | null;
  turnNumber: number;
}

interface ReplayEntry {
  action: string;
  timestamp: number;
  snapshot: StateSnapshot;
}

interface ReplayStore {
  history: ReplayEntry[];
  pushSnapshot: (action: string, snapshot: StateSnapshot) => void;
  undo: () => StateSnapshot | null;
  canUndo: boolean;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const useReplayStore = create<ReplayStore>((set, get) => ({
  history: [],
  canUndo: false,

  pushSnapshot: (action, snapshot) => {
    set((s) => {
      const newHistory = [...s.history, { action, timestamp: Date.now(), snapshot }];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return { history: newHistory, canUndo: newHistory.length > 1 };
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length < 2) return null;
    // Remove the current state, return the previous one
    const newHistory = history.slice(0, -1);
    const previousSnapshot = newHistory[newHistory.length - 1].snapshot;
    set({ history: newHistory, canUndo: newHistory.length > 1 });
    return previousSnapshot;
  },

  clearHistory: () => set({ history: [], canUndo: false }),
}));
