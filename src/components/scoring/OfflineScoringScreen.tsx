'use client';

import { useOfflineStore } from '@/store/offlineStore';
import { ScoringView } from './ScoringView';

export function OfflineScoringScreen() {
  const { 
    players, 
    kabooCallerIndex, 
    nextRound,
    resetStore,
    roundNumber,
    settings,
    gamePhase
  } = useOfflineStore();

  const matchOver = gamePhase === 'reveal';

  const handlePlayAgain = () => {
    if (matchOver) {
      resetStore();
    } else {
      nextRound();
    }
  };

  return (
    <ScoringView
      players={players}
      kabooCallerIndex={kabooCallerIndex}
      onPlayAgain={handlePlayAgain}
      onBackToLobby={resetStore}
      matchOver={matchOver}
      roundNumber={roundNumber}
      settings={settings}
    />
  );
}
