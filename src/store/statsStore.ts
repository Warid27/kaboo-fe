import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StatsState {
  gamesPlayed: number;
  gamesWon: number;
  totalRoundsPlayed: number;
  bestScore: number | null;
  kaboosCalled: number;
  kaboosSuccessful: number;
  lifetimeScore: number;
  recordRound: (playerScore: number, isWinner: boolean, calledKaboo: boolean, kabooSuccess: boolean) => void;
  resetStats: () => void;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      gamesPlayed: 0,
      gamesWon: 0,
      totalRoundsPlayed: 0,
      bestScore: null,
      kaboosCalled: 0,
      kaboosSuccessful: 0,
      lifetimeScore: 0,

      recordRound: (playerScore, isWinner, calledKaboo, kabooSuccess) =>
        set((s) => ({
          totalRoundsPlayed: s.totalRoundsPlayed + 1,
          gamesWon: isWinner ? s.gamesWon + 1 : s.gamesWon,
          bestScore: s.bestScore === null ? playerScore : Math.min(s.bestScore, playerScore),
          kaboosCalled: calledKaboo ? s.kaboosCalled + 1 : s.kaboosCalled,
          kaboosSuccessful: kabooSuccess ? s.kaboosSuccessful + 1 : s.kaboosSuccessful,
          lifetimeScore: s.lifetimeScore + playerScore,
        })),

      resetStats: () =>
        set({
          gamesPlayed: 0,
          gamesWon: 0,
          totalRoundsPlayed: 0,
          bestScore: null,
          kaboosCalled: 0,
          kaboosSuccessful: 0,
          lifetimeScore: 0,
        }),
    }),
    { name: 'kaboo-stats' }
  )
);
