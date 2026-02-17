'use client';

import { useOnlineStore } from '@/store/onlineStore';
import { ScoringView } from './ScoringView';

export function OnlineScoringScreen() {
  const { 
    players, 
    kabooCallerIndex, 
    gamePhase,
    settings,
    resetStore,
    leaveGame,
    startGame
  } = useOnlineStore();

  const matchOver = gamePhase === 'reveal'; // Or 'game_over' if we add it

  const handlePlayAgain = () => {
    if (matchOver) {
      // For online, match over usually means back to lobby or home
      resetStore();
    } else {
      // Host might need to trigger next round, or it's automatic
      // For now, we'll assume the host can call startGame again if the server allows
      startGame();
    }
  };

  return (
    <ScoringView
      players={players}
      kabooCallerIndex={kabooCallerIndex}
      onPlayAgain={handlePlayAgain}
      onBackToLobby={leaveGame}
      matchOver={matchOver}
      roundNumber={1} // Online store currently doesn't track round number
      settings={settings}
    />
  );
}
