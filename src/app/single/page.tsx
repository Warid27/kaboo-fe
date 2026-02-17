'use client';

import { useOfflineStore } from '@/store/offlineStore';
import { OfflineLobbyScreen } from '@/components/lobby/OfflineLobbyScreen';
import { OfflineGameBoard } from '@/components/game/OfflineGameBoard';
import { OfflineScoringScreen } from '@/components/scoring/OfflineScoringScreen';

export default function SinglePage() {
  const { screen } = useOfflineStore();

  switch (screen) {
    case 'lobby':
      return <OfflineLobbyScreen />;
    case 'game':
      return <OfflineGameBoard />;
    case 'scoring':
      return <OfflineScoringScreen />;
    case 'home':
    default:
      return <OfflineLobbyScreen />;
  }
}
