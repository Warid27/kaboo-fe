import { create } from 'zustand';

interface DevState {
  /** Whether the dev panel is open */
  isOpen: boolean;
  toggleOpen: () => void;

  /** Grid overlay */
  showGrid: boolean;
  toggleGrid: () => void;

  /** Card size multiplier (1 = default) — applied to entire table */
  cardScale: number;
  setCardScale: (scale: number) => void;

  /** Center pile offset adjustments */
  pileOffsetX: number;
  pileOffsetY: number;
  setPileOffset: (x: number, y: number) => void;

  /** Player hand gap in px */
  handGap: number;
  setHandGap: (gap: number) => void;

  /** Player (bottom) position offset */
  playerOffsetX: number;
  playerOffsetY: number;
  setPlayerOffset: (x: number, y: number) => void;

  /** Reset all dev overrides */
  resetAll: () => void;
}

const DEFAULTS = {
  isOpen: false,
  showGrid: false,
  cardScale: 1,
  pileOffsetX: 0,
  pileOffsetY: 0,
  handGap: 8,
  playerOffsetX: 0,
  playerOffsetY: 0,
};

export const useDevStore = create<DevState>((set) => ({
  ...DEFAULTS,
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setCardScale: (cardScale) => set({ cardScale }),
  setPileOffset: (pileOffsetX, pileOffsetY) => set({ pileOffsetX, pileOffsetY }),
  setHandGap: (handGap) => set({ handGap }),
  setPlayerOffset: (playerOffsetX, playerOffsetY) => set({ playerOffsetX, playerOffsetY }),
  resetAll: () => set(DEFAULTS),
}));
