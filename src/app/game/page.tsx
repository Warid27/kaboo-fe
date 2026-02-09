'use client';

import { useGameStore } from '@/store/gameStore';
import { GameBoard } from '@/components/game/GameBoard';
import { ScoringScreen } from '@/components/scoring/ScoringScreen';

export default function GamePage() {
  const screen = useGameStore((s) => s.screen);

  if (screen === 'scoring') {
    return <ScoringScreen />;
  }
  return <GameBoard />;
}
