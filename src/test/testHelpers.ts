import { useOfflineStore, resetStore as offlineResetStore } from '@/store/offlineStore';
import type { vi as ViType } from 'vitest';

export function resetStore() {
  offlineResetStore();
}

export function setupDrawPhase(vi: typeof ViType) {
  const store = useOfflineStore.getState();
  store.setPlayerName('TestPlayer');
  store.updateSettings({ numPlayers: 2 });
  store.startOfflineGame();
  
  // Wait for initial dealing and dealing -> initial_look transition
  vi.advanceTimersByTime(2500);

  let state = useOfflineStore.getState();
  const cards = state.players[0].cards;
  state.peekCard(cards[0].id);
  vi.advanceTimersByTime(2500);
  
  state = useOfflineStore.getState();
  state.peekCard(cards[1].id);
  vi.advanceTimersByTime(2500);
  
  // Transition to playing phase
  state = useOfflineStore.getState();
  state.readyToPlay();
  
  vi.advanceTimersByTime(1000);
  return useOfflineStore.getState();
}
