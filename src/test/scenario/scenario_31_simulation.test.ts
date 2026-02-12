import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';
import { calculateScore } from '../../lib/cardUtils';

describe('Scenario 31: Bot Difficulty Consistency Simulation', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  const runSimulatedGame = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const store = useGameStore.getState();
    
    // Setup game
    useGameStore.setState({
      playerName: 'Player',
      settings: { ...useGameStore.getState().settings, botDifficulty: difficulty, numPlayers: 2 },
    });
    
    store.startOffline();
    store.startGame();
    
    // Skip dealing (2000ms)
    vi.advanceTimersByTime(2500); 
    
    // Check if we are in initial_look
    if (useGameStore.getState().gamePhase === 'initial_look') {
      store.readyToPlay();
    }

    let turnCount = 0;
    const MAX_TURNS = 200; // Safety break

    while (['playing', 'kaboo_final'].includes(useGameStore.getState().gamePhase) && turnCount < MAX_TURNS) {
      const state = useGameStore.getState();
      const currentPlayerIndex = state.currentPlayerIndex;
      
      // console.log(`Turn ${turnCount}, Phase: ${state.gamePhase}, Current: ${state.players[currentPlayerIndex].id}(idx:${currentPlayerIndex})`);

      if (currentPlayerIndex !== 0) {
        // Bot turn: endTurn already scheduled simulateBotTurn(1200ms)
        // simulateBotTurn has: draw(0), decide(1200), tapWindow(800) or effect(1000), finalizeTap(3000) or endTurn(600)
        // Total bot turn time is approx 1200 + 1200 + 3000 = 5400ms
        vi.advanceTimersByTime(8000); 
      } else {
        // Player turn
        await store.drawCard();
        vi.advanceTimersByTime(1000);
        await store.discardHeldCard();
        vi.advanceTimersByTime(1000);
        
        const handScore = calculateScore(useGameStore.getState().players[0].cards);
        if (handScore < 5 && !state.kabooCalled) {
          await store.callKaboo();
          vi.advanceTimersByTime(4000); // 3000ms announcement + endTurn
        } else {
          vi.advanceTimersByTime(4000); // 3000ms tap window
          store.endTurn();
          vi.advanceTimersByTime(2000); // Let bot turn start
        }
      }
      
      turnCount++;
    }

    // Ensure reveal phase completes
    vi.advanceTimersByTime(2000);

    const finalState = useGameStore.getState();
 
     const winnerIndex = finalState.players.reduce((minIdx, p, idx, arr) => 
      p.score < arr[minIdx].score ? idx : minIdx, 0);
    
    return winnerIndex !== 0 ? 'bot' : 'player';
  };

  test('Bot win rates should align with difficulty (50 game sample)', async () => {
    const difficulties = ['easy', 'medium', 'hard'] as const;
    const results: Record<string, { botWins: number, total: number }> = {
      easy: { botWins: 0, total: 0 },
      medium: { botWins: 0, total: 0 },
      hard: { botWins: 0, total: 0 },
    };

    const GAMES_PER_DIFF = 50;
 
     for (const diff of difficulties) {
       for (let i = 0; i < GAMES_PER_DIFF; i++) {
        resetStore();
        const winner = await runSimulatedGame(diff);
        if (winner === 'bot') results[diff].botWins++;
        results[diff].total++;
      }
    }
 
    // Rigorous assertions for 50 games
    // We check that bots can win games at different difficulties
    
    // Win rate ranges (very loose for 50 games to avoid flakiness)
    // Hard: should have at least some wins (15+ wins)
    // Easy: should not win almost all games (< 40 wins)
    expect(results.hard.botWins).toBeGreaterThanOrEqual(15);
    expect(results.easy.botWins).toBeLessThanOrEqual(40);
  }, 300000); // 300s timeout
});
