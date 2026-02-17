'use client';

import { useOnlineStore } from '@/store/onlineStore';
import { LobbyView } from './LobbyView';

export function OnlineLobbyScreen() {
  const { 
    roomCode, 
    players, 
    myPlayerId, 
    settings, 
    startGame, 
    leaveGame, 
    updateSettings,
    resetStore,
    toggleReady,
    kickPlayer,
    endGame
  } = useOnlineStore();

  const me = players.find(p => p.id === myPlayerId);
  const isHost = me?.isHost ?? false;
  const isReady = me?.isReady ?? false;

  const otherPlayers = players.filter(p => p.id !== myPlayerId);
  const allOthersReady = otherPlayers.length > 0 && otherPlayers.every(p => p.isReady);
  const canStart = players.length >= 2 && allOthersReady;

  return (
    <LobbyView
      roomCode={roomCode}
      players={players}
      isOffline={false}
      isHost={isHost}
      isReady={isReady}
      canStart={canStart}
      onStart={startGame}
      onLeave={leaveGame}
      onEndGame={isHost ? endGame : undefined}
      onToggleReady={toggleReady}
      onBack={resetStore}
      settings={settings}
      updateSettings={updateSettings}
      myPlayerId={myPlayerId}
      onKickPlayer={kickPlayer}
    />
  );
}
