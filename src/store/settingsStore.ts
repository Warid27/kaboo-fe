import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSoundVolume } from '@/lib/sounds';

// ── Key Action Types ──

export type KeyAction =
  | 'draw' | 'discard' | 'swap' | 'kaboo' | 'endTurn'
  | 'confirm' | 'skip'
  | 'card1' | 'card2' | 'card3' | 'card4'
  | 'tap';

export const KEY_ACTION_LABELS: Record<KeyAction, string> = {
  draw: 'Draw Card',
  discard: 'Discard',
  swap: 'Swap Card',
  kaboo: 'Call KABOO',
  endTurn: 'End Turn',
  confirm: 'Confirm',
  skip: 'Skip / Decline',
  card1: 'Card 1',
  card2: 'Card 2',
  card3: 'Card 3',
  card4: 'Card 4',
  tap: 'Tap',
};

export const DEFAULT_KEY_BINDINGS: Record<KeyAction, string> = {
  draw: 'KeyD',
  discard: 'KeyX',
  swap: 'KeyS',
  kaboo: 'KeyK',
  endTurn: 'KeyE',
  confirm: 'Enter',
  skip: 'Escape',
  card1: 'Digit1',
  card2: 'Digit2',
  card3: 'Digit3',
  card4: 'Digit4',
  tap: 'KeyT',
};

export function getKeyDisplayName(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const special: Record<string, string> = {
    Enter: '↵',
    Escape: 'Esc',
    Space: 'Space',
    Backspace: '⌫',
    Tab: 'Tab',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    ShiftLeft: 'L⇧',
    ShiftRight: 'R⇧',
  };
  return special[code] ?? code;
}

// ── Sound Toggle Types ──

export type SoundCategory = 'draw' | 'swap' | 'discard' | 'effect' | 'peek' | 'tap' | 'kaboo';

export const SOUND_CATEGORY_LABELS: Record<SoundCategory, string> = {
  draw: 'Draw',
  swap: 'Swap',
  discard: 'Discard',
  effect: 'Effects',
  peek: 'Peek',
  tap: 'Tap',
  kaboo: 'KABOO',
};

export type ThemeMode = 'dark' | 'light' | 'system';

// ── Settings Store ──

interface SettingsState {
  keyBindings: Record<KeyAction, string>;
  masterVolume: number;
  sfxVolume: number;
  animationsEnabled: boolean;
  soundToggles: Record<SoundCategory, boolean>;
  theme: ThemeMode;
  setKeyBinding: (action: KeyAction, code: string) => void;
  resetKeyBindings: () => void;
  setMasterVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setAnimationsEnabled: (v: boolean) => void;
  setSoundToggle: (category: SoundCategory, enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
}

const DEFAULT_SOUND_TOGGLES: Record<SoundCategory, boolean> = {
  draw: true,
  swap: true,
  discard: true,
  effect: true,
  peek: true,
  tap: true,
  kaboo: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      keyBindings: { ...DEFAULT_KEY_BINDINGS },
      masterVolume: 0.5,
      sfxVolume: 0.8,
      animationsEnabled: true,
      soundToggles: { ...DEFAULT_SOUND_TOGGLES },
      theme: 'dark' as ThemeMode,
      setKeyBinding: (action, code) =>
        set((s) => ({ keyBindings: { ...s.keyBindings, [action]: code } })),
      resetKeyBindings: () => set({ keyBindings: { ...DEFAULT_KEY_BINDINGS } }),
      setMasterVolume: (v) => set({ masterVolume: Math.max(0, Math.min(1, v)) }),
      setSfxVolume: (v) => set({ sfxVolume: Math.max(0, Math.min(1, v)) }),
      setAnimationsEnabled: (v) => set({ animationsEnabled: v }),
      setSoundToggle: (category, enabled) =>
        set((s) => ({ soundToggles: { ...s.soundToggles, [category]: enabled } })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'kaboo-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          setSoundVolume(state.masterVolume * state.sfxVolume);
        }
      },
    }
  )
);

// Keep sound volume in sync with settings changes
useSettingsStore.subscribe((state) => {
  setSoundVolume(state.masterVolume * state.sfxVolume);
});
