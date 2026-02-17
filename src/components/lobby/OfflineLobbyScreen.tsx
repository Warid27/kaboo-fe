'use client';

import { useOfflineStore } from '@/store/offlineStore';
import { LobbyView } from './LobbyView';

export function OfflineLobbyScreen() {
  const {
    players,
    settings,
    updateSettings,
    startOfflineGame,
    resetStore,
  } = useOfflineStore();

  // In offline mode, the player is always the first one
  const myPlayerId = players[0]?.id || 'offline-player';
  const isHost = true;
  const isReady = true;
  const canStart = true; // Host can always start vs bots

  return (
    <LobbyView
      roomCode=""
      players={players}
      isOffline={true}
      isHost={isHost}
      isReady={isReady}
      canStart={canStart}
      onStart={startOfflineGame}
      onLeave={resetStore}
      onToggleReady={() => {}}
      onBack={resetStore}
      settings={settings}
      updateSettings={updateSettings}
      myPlayerId={myPlayerId}
    />
  );
}
