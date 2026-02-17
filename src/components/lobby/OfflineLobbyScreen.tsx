'use client';

import { useOfflineStore } from '@/store/offlineStore';
import { createMockPlayers } from '@/store/helpers';
import { LobbyView } from './LobbyView';

export function OfflineLobbyScreen() {
  const {
    players,
    settings,
    updateSettings,
    startOfflineGame,
    resetStore,
    playerName,
  } = useOfflineStore();

  const lobbyPlayers =
    players.length > 0 ? players : createMockPlayers(settings.numPlayers, playerName || 'You');

  const myPlayerId = lobbyPlayers[0]?.id || 'offline-player';
  const isHost = true;
  const isReady = true;
  const canStart = true;

  return (
    <LobbyView
      roomCode=""
      players={lobbyPlayers}
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
