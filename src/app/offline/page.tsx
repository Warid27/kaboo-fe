'use client';

import { useOfflineStore } from '@/store/offlineStore';
import { OfflineLobbyScreen } from '@/components/lobby/OfflineLobbyScreen';
import { OfflineGameBoard } from '@/components/game/OfflineGameBoard';
import { OfflineScoringScreen } from '@/components/scoring/OfflineScoringScreen';

export default function OfflinePage() {
  const { screen } = useOfflineStore();

  // Handle screen switching
  switch (screen) {
    case 'lobby':
      return <OfflineLobbyScreen />;
    case 'game':
      return <OfflineGameBoard />;
    case 'scoring':
      return <OfflineScoringScreen />;
    case 'home':
    default:
      // On /offline, treat "home" as "lobby" so users can always reach offline mode
      return <OfflineLobbyScreen />;
  }
}
