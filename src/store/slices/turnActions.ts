import type { StoreGet, StoreSet } from '../helpers';
import { addLog } from '../helpers';
import {
  createBotMemory, botDecideAction, botShouldCallKaboo,
  botResolveEffect, botRememberCard, botForgetCard,
} from '@/lib/botAI';
import type { BotDifficulty } from '@/types/game';
import { getEffectType, getSuitToken, calculateScore } from '@/lib/cardUtils';
import { playKabooSound } from '@/lib/sounds';
import { useReplayStore } from '../replayStore';
import { useStatsStore } from '../statsStore';
import { captureSnapshot } from '../snapshotHelper';
import { gameApi } from '@/services/gameApi';
import { toast } from '@/components/ui/use-toast';

export function createTurnActions(set: StoreSet<any>, get: StoreGet<any>) {
  return {
    callKaboo: async (overrideCallerIndex?: number | null) => {
      const { currentPlayerIndex, players, gameMode, gameId } = get() as any;
      const callerIndex = (overrideCallerIndex !== undefined && overrideCallerIndex !== null) ? overrideCallerIndex : currentPlayerIndex;

      if (gameMode === 'online') {
          try {
              await gameApi.playMove(gameId, { type: 'CALL_KABOO' });
          } catch {
              toast({ title: 'Action Failed', description: 'Failed to call Kaboo.', variant: 'destructive' });
          }
          return;
      }

      addLog(get, set, callerIndex, '[KABOO] called KABOO!');
      playKabooSound();
      set({
        kabooCalled: true,
        kabooCallerIndex: callerIndex,
        showKabooAnnouncement: true,
        gamePhase: 'kaboo_final',
        finalRoundTurnsLeft: players.length - 1,
      });

      useReplayStore.getState().pushSnapshot('kaboo', captureSnapshot(get()));

      setTimeout(() => {
        set({ showKabooAnnouncement: false });
        get().endTurn();
      }, 3000);
    },

    endTurn: () => {
      const { players, currentPlayerIndex, kabooCalled, finalRoundTurnsLeft, settings, turnNumber } = get() as any;

      // Check if any player has 0 cards and trigger auto-Kaboo if not already called
      const playerWithNoCardsIndex = players.findIndex((p: any) => p.cards.length === 0);
      if (playerWithNoCardsIndex !== -1 && !kabooCalled) {
        get().callKaboo(playerWithNoCardsIndex);
        return;
      }

      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

      if (kabooCalled && finalRoundTurnsLeft <= 0) {
        set({ gamePhase: 'reveal' });
        setTimeout(() => { get().revealAllCards(); }, 500);
        return;
      }

      if ((get() as any).drawPile.length === 0) {
        addLog(get, set, -1, 'Deck exhausted! Auto-Kaboo triggered.');
        set({ gamePhase: 'reveal', kabooCalled: true, kabooCallerIndex: -1 });
        setTimeout(() => { get().revealAllCards(); }, 500);
        return;
      }

      const newTurnNumber = nextPlayerIndex === 0 ? turnNumber + 1 : turnNumber;

      set({
        currentPlayerIndex: nextPlayerIndex,
        turnPhase: 'draw',
        heldCard: null,
        effectType: null,
        effectStep: null,
        showEffectOverlay: false,
        tapState: null,
        selectedCards: [],
        peekedCards: [],
        effectPreviewCardIds: [],
        turnTimeRemaining: parseInt(settings.turnTimer),
        effectTimeRemaining: 10,
        finalRoundTurnsLeft: kabooCalled ? finalRoundTurnsLeft - 1 : finalRoundTurnsLeft,
        turnNumber: newTurnNumber,
      });

      useReplayStore.getState().pushSnapshot('endTurn', captureSnapshot(get()));

      if (nextPlayerIndex === 0 && (get() as any).penaltySkipTurn) {
        set({ penaltySkipTurn: false });
        addLog(get, set, 0, '⏭ turn skipped (penalty)');
        setTimeout(() => get().endTurn(), 500);
        return;
      }

      if (nextPlayerIndex !== 0 && (get() as any).gameMode === 'offline') {
        setTimeout(() => { get().simulateBotTurn(); }, 1200);
      }
    },

    simulateBotTurn: () => {
      const state = get() as any;
      const { players, currentPlayerIndex, drawPile, botMemories, kabooCalled, turnNumber, gamePhase, settings } = state;
      const difficulty: BotDifficulty = settings.botDifficulty;

      if (currentPlayerIndex === 0 || drawPile.length === 0) return;
      if (gamePhase !== 'playing' && gamePhase !== 'kaboo_final') return;

      const bot = players[currentPlayerIndex];
      const memory = botMemories[bot.id] ?? createBotMemory();

      // Should the bot call KABOO?
      if (!kabooCalled && gamePhase === 'playing' && botShouldCallKaboo(bot, memory, turnNumber, difficulty)) {
        addLog(get, set, currentPlayerIndex, '[KABOO] called KABOO!');
        playKabooSound();
        set({
          kabooCalled: true,
          kabooCallerIndex: currentPlayerIndex,
          showKabooAnnouncement: true,
          gamePhase: 'kaboo_final',
          finalRoundTurnsLeft: players.length - 1,
        });
        setTimeout(() => {
          set({ showKabooAnnouncement: false });
          get().endTurn();
        }, 3000);
        return;
      }

      // Draw a card
      const drawnCard = { ...drawPile[0], faceUp: true };
      get().addFlyingCard(drawnCard, 'draw-pile', 'held-card');
      set({
        drawPile: drawPile.slice(1),
        heldCard: drawnCard,
        turnPhase: 'action',
      });
      addLog(get, set, currentPlayerIndex, 'drew a card');

      // Decide action after delay
      setTimeout(() => {
        const currentState = get();
        if (currentState.currentPlayerIndex !== currentPlayerIndex) return;

        const currentBot = currentState.players[currentPlayerIndex];
        const currentMemory = currentState.botMemories[bot.id] ?? memory;
        const decision = botDecideAction(currentBot, drawnCard, currentMemory, turnNumber, difficulty);

        if (decision.action === 'swap' && decision.swapCardId) {
          const cardIndex = currentBot.cards.findIndex((c: any) => c.id === decision.swapCardId);
          if (cardIndex !== -1) {
            const oldCard = { ...currentBot.cards[cardIndex], faceUp: true };
            get().addFlyingCard(oldCard, `card-${decision.swapCardId}`, 'discard-pile');
            const newCard = { ...drawnCard, faceUp: false };

            const updatedCards = [...currentBot.cards];
            updatedCards[cardIndex] = newCard;

            const updatedPlayers = currentState.players.map((p: any, i: number) =>
              i === currentPlayerIndex ? { ...p, cards: updatedCards } : p
            );

            const updatedMem = { ...currentState.botMemories };
            let mem = updatedMem[bot.id] ?? createBotMemory();
            mem = botForgetCard(mem, decision.swapCardId!);
            mem = botRememberCard(mem, newCard.id, drawnCard, turnNumber);
            updatedMem[bot.id] = mem;

            set({
              players: updatedPlayers,
              discardPile: [...currentState.discardPile, oldCard],
              heldCard: null,
              botMemories: updatedMem,
            });
            addLog(get, set, currentPlayerIndex, `swapped → discarded ${oldCard.rank}${getSuitToken(oldCard.suit)}`);

            setTimeout(() => { get().openTapWindow(currentPlayerIndex); }, 800);
          } else {
            set({
              discardPile: [...currentState.discardPile, { ...drawnCard, faceUp: true }],
              heldCard: null,
            });
            setTimeout(() => { get().openTapWindow(currentPlayerIndex); }, 800);
          }
        } else {
          // Bot discards
          const discarded = { ...drawnCard, faceUp: true };
          get().addFlyingCard(discarded, 'held-card', 'discard-pile');
          const effect = get().settings.useEffectCards ? getEffectType(discarded.rank) : null;

          set({
            discardPile: [...currentState.discardPile, discarded],
            heldCard: null,
          });
          addLog(get, set, currentPlayerIndex, `discarded ${discarded.rank}${getSuitToken(discarded.suit)}`);

          if (effect) {
            setTimeout(() => {
              const effState = get();
              if (effState.currentPlayerIndex !== currentPlayerIndex) return;

              const effBot = effState.players[currentPlayerIndex];
              const opponents = effState.players.filter((_: any, i: number) => i !== currentPlayerIndex);
              const effMemory = effState.botMemories[bot.id] ?? createBotMemory();
              const resolution = botResolveEffect(effBot, opponents, effect, effMemory, turnNumber, difficulty);

              if (effect === 'peek_own' && resolution.targetCardIds[0]) {
                const targetCard = effBot.cards.find((c: any) => c.id === resolution.targetCardIds[0]);
                if (targetCard) {
                  const updatedMem = { ...effState.botMemories };
                  updatedMem[bot.id] = botRememberCard(effMemory, targetCard.id, targetCard, turnNumber);
                  set({ botMemories: updatedMem });
                  addLog(get, set, currentPlayerIndex, '[EYE] peeked at own card');
                }
              } else if (effect === 'peek_opponent' && resolution.targetCardIds[0]) {
                const allCards = effState.players.flatMap((p: any) => p.cards);
                const targetCard = allCards.find((c: any) => c.id === resolution.targetCardIds[0]);
                if (targetCard) {
                  const updatedMem = { ...effState.botMemories };
                  updatedMem[bot.id] = botRememberCard(effMemory, targetCard.id, targetCard, turnNumber);
                  set({ botMemories: updatedMem });
                  addLog(get, set, currentPlayerIndex, "[SEARCH] peeked at an opponent's card");
                }
              } else if (resolution.targetCardIds.length >= 2) {
                addLog(get, set, currentPlayerIndex, '[SHUFFLE] swapped two cards');
                const updatedPlayers = [...effState.players];
                let c1: { pi: number; ci: number } | null = null;
                let c2: { pi: number; ci: number } | null = null;

                for (let pi = 0; pi < updatedPlayers.length; pi++) {
                  const p = updatedPlayers[pi];
                  for (let ci = 0; ci < p.cards.length; ci++) {
                    const c = p.cards[ci];
                    if (c.id === resolution.targetCardIds[0]) c1 = { pi, ci };
                    if (c.id === resolution.targetCardIds[1]) c2 = { pi, ci };
                  }
                }

                if (c1 && c2) {
                  const temp = updatedPlayers[c1.pi].cards[c1.ci];
                  updatedPlayers[c1.pi] = {
                    ...updatedPlayers[c1.pi],
                    cards: updatedPlayers[c1.pi].cards.map((card: any, i: number) =>
                      i === (c1 as { pi: number; ci: number }).ci
                        ? { ...updatedPlayers[(c2 as { pi: number; ci: number }).pi].cards[(c2 as { pi: number; ci: number }).ci], faceUp: false }
                        : card
                    ),
                  };
                  updatedPlayers[c2.pi] = {
                    ...updatedPlayers[c2.pi],
                    cards: updatedPlayers[c2.pi].cards.map((card: any, i: number) =>
                      i === (c2 as { pi: number; ci: number }).ci ? { ...temp, faceUp: false } : card
                    ),
                  };
                  
                  // Memory Corruption: All bots forget swapped cards if it was blind
                  // Even if not blind, spectators should forget them.
                  const updatedMemories = { ...effState.botMemories } as any;
                  Object.keys(updatedMemories).forEach((bid: string) => {
                     let m = updatedMemories[bid];
                     m = botForgetCard(m, resolution.targetCardIds[0]);
                     m = botForgetCard(m, resolution.targetCardIds[1]);
                     updatedMemories[bid] = m;
                   });
 
                   // If it was a vision swap, the current bot remembers the cards it saw/swapped
                   if (effect === 'semi_blind_swap' || effect === 'full_vision_swap') {
                     const allCards = updatedPlayers.flatMap((p: any) => p.cards);
                     const card1 = allCards.find((c: any) => c.id === resolution.targetCardIds[0]);
                     const card2 = allCards.find((c: any) => c.id === resolution.targetCardIds[1]);
                     if (card1) updatedMemories[bot.id] = botRememberCard(updatedMemories[bot.id], card1.id, card1, turnNumber);
                     if (card2) updatedMemories[bot.id] = botRememberCard(updatedMemories[bot.id], card2.id, card2, turnNumber);
                   }

                   set({ 
                     players: updatedPlayers,
                     botMemories: updatedMemories
                   });
                }
              }

              setTimeout(() => get().endTurn(), 600);
            }, 1000);
          } else {
            setTimeout(() => { get().openTapWindow(currentPlayerIndex); }, 800);
          }
        }
      }, 1200);
    },

    revealAllCards: () => {
      const { players, kabooCallerIndex, settings } = get();
      const targetScore = parseInt(settings.targetScore);

      const updatedPlayers = players.map((p: any) => ({
        ...p,
        cards: p.cards.map((c: any) => ({ ...c, faceUp: true })),
        score: calculateScore(p.cards),
      }));

      if (kabooCallerIndex !== null && updatedPlayers[kabooCallerIndex]) {
        const callerScore = updatedPlayers[kabooCallerIndex].score;
        const otherScores = updatedPlayers.filter((_: any, i: number) => i !== kabooCallerIndex).map((p: any) => p.score);
        const minOtherScore = Math.min(...otherScores);

        if (callerScore < minOtherScore) {
          // Success: Caller has the strictly lowest score. No penalty.
        } else {
          // Penalty: Caller tied or has higher score
          updatedPlayers[kabooCallerIndex] = {
            ...updatedPlayers[kabooCallerIndex],
            score: callerScore + 20,
          };
        }
      }

      const withTotals = updatedPlayers.map((p: any) => ({
        ...p,
        totalScore: p.totalScore + p.score,
      }));

      const roundScores = withTotals.map((p: any) => ({
        playerId: p.id,
        score: p.score,
      }));

      // Check if any player has reached the target score
      const matchOver = withTotals.some((p: any) => p.totalScore >= targetScore);

      set({ players: withTotals, roundScores, matchOver });

      // Record stats for the human player
      const humanPlayer = withTotals[0];
      const isWinner = withTotals.every((p: any) => humanPlayer.score <= p.score);
      const calledKaboo = kabooCallerIndex === 0;
      const kabooSuccess = calledKaboo && isWinner;
      useStatsStore.getState().recordRound(humanPlayer.score, isWinner, calledKaboo, kabooSuccess);

      if (matchOver) {
        useStatsStore.getState().recordRound(0, false, false, false); // just increment gamesPlayed
        // Actually let's just use a simpler approach — increment gamesPlayed directly
      }

      setTimeout(() => {
        set({ screen: 'scoring' });
      }, 3000);
    },

    nextRound: () => {
      const { roundNumber } = get();
      set({ roundNumber: roundNumber + 1 });
      get().startGame();
    },
  };
}
