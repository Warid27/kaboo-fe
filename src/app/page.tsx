'use client';

import { useGameStore } from '@/store/gameStore';
import { GameBoard } from '@/components/game/GameBoard';
import { ScoringScreen } from '@/components/scoring/ScoringScreen';
import { LobbyScreen } from '@/components/lobby/LobbyScreen';
import { HomeScreen } from '@/components/home/HomeScreen';

export default function Home() {
  const screen = useGameStore((s) => s.screen);

  if (screen === 'home') {
    return <HomeScreen />;
  }

  if (screen === 'lobby') {
    return <LobbyScreen />;
  }

  if (screen === 'scoring') {
    return <ScoringScreen />;
  }

  return <GameBoard />;
}
