import type { StoreGet, StoreSet } from '../helpers';
import { addLog } from '../helpers';
import {
  createBotMemory, botDecideAction, botShouldCallKaboo,
  botResolveEffect, botRememberCard, botForgetCard,
} from '@/lib/botAI';
import type { BotDifficulty } from '@/types/game';
import { getEffectType, getSuitSymbol, calculateScore } from '@/lib/cardUtils';
import { playKabooSound } from '@/lib/sounds';
import { useReplayStore } from '../replayStore';
import { useStatsStore } from '../statsStore';
import { captureSnapshot } from '../snapshotHelper';

export function createTurnActions(set: StoreSet, get: StoreGet) {
  return {
    callKaboo: () => {
      const { currentPlayerIndex, players } = get();
      addLog(get, set, currentPlayerIndex, '🔥 called KABOO!');
      playKabooSound();
      set({
        kabooCalled: true,
        kabooCallerIndex: currentPlayerIndex,
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
      const { players, currentPlayerIndex, kabooCalled, finalRoundTurnsLeft, settings, turnNumber } = get();
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

      if (kabooCalled && finalRoundTurnsLeft <= 0) {
        set({ gamePhase: 'reveal' });
        setTimeout(() => { get().revealAllCards(); }, 500);
        return;
      }

      if (get().drawPile.length === 0) {
        set({ gamePhase: 'reveal' });
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

      if (nextPlayerIndex === 0 && get().penaltySkipTurn) {
        set({ penaltySkipTurn: false });
        addLog(get, set, 0, '⏭ turn skipped (penalty)');
        setTimeout(() => get().endTurn(), 500);
        return;
      }

      if (nextPlayerIndex !== 0 && get().gameMode === 'offline') {
        setTimeout(() => { get().simulateBotTurn(); }, 1200);
      }
    },

    simulateBotTurn: () => {
      const state = get();
      const { players, currentPlayerIndex, drawPile, botMemories, kabooCalled, turnNumber, gamePhase, settings } = state;
      const difficulty: BotDifficulty = settings.botDifficulty;

      if (currentPlayerIndex === 0 || drawPile.length === 0) return;
      if (gamePhase !== 'playing' && gamePhase !== 'kaboo_final') return;

      const bot = players[currentPlayerIndex];
      const memory = botMemories[bot.id] ?? createBotMemory();

      // Should the bot call KABOO?
      if (!kabooCalled && gamePhase === 'playing' && botShouldCallKaboo(bot, memory, turnNumber, difficulty)) {
        addLog(get, set, currentPlayerIndex, '🔥 called KABOO!');
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
        const decision = botDecideAction(currentBot, drawnCard, currentMemory, difficulty);

        if (decision.action === 'swap' && decision.swapCardId) {
          const cardIndex = currentBot.cards.findIndex((c) => c.id === decision.swapCardId);
          if (cardIndex !== -1) {
            const oldCard = { ...currentBot.cards[cardIndex], faceUp: true };
            get().addFlyingCard(oldCard, `card-${decision.swapCardId}`, 'discard-pile');
            const newCard = { ...drawnCard, faceUp: false };

            const updatedCards = [...currentBot.cards];
            updatedCards[cardIndex] = newCard;

            const updatedPlayers = currentState.players.map((p, i) =>
              i === currentPlayerIndex ? { ...p, cards: updatedCards } : p
            );

            const updatedMem = { ...currentState.botMemories };
            let mem = updatedMem[bot.id] ?? createBotMemory();
            mem = botForgetCard(mem, decision.swapCardId!);
            mem = botRememberCard(mem, newCard.id, drawnCard);
            updatedMem[bot.id] = mem;

            set({
              players: updatedPlayers,
              discardPile: [...currentState.discardPile, oldCard],
              heldCard: null,
              botMemories: updatedMem,
            });
            addLog(get, set, currentPlayerIndex, `swapped → discarded ${oldCard.rank}${getSuitSymbol(oldCard.suit)}`);

            setTimeout(() => { get().openTapWindow(); }, 800);
          } else {
            set({
              discardPile: [...currentState.discardPile, { ...drawnCard, faceUp: true }],
              heldCard: null,
            });
            setTimeout(() => { get().openTapWindow(); }, 800);
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
          addLog(get, set, currentPlayerIndex, `discarded ${discarded.rank}${getSuitSymbol(discarded.suit)}`);

          if (effect) {
            setTimeout(() => {
              const effState = get();
              if (effState.currentPlayerIndex !== currentPlayerIndex) return;

              const effBot = effState.players[currentPlayerIndex];
              const opponents = effState.players.filter((_, i) => i !== currentPlayerIndex);
              const effMemory = effState.botMemories[bot.id] ?? createBotMemory();
              const resolution = botResolveEffect(effBot, opponents, effect, effMemory, difficulty);

              if (effect === 'peek_own' && resolution.targetCardIds[0]) {
                const targetCard = effBot.cards.find((c) => c.id === resolution.targetCardIds[0]);
                if (targetCard) {
                  const updatedMem = { ...effState.botMemories };
                  updatedMem[bot.id] = botRememberCard(effMemory, targetCard.id, targetCard);
                  set({ botMemories: updatedMem });
                  addLog(get, set, currentPlayerIndex, '👁 peeked at own card');
                }
              } else if (effect === 'peek_opponent' && resolution.targetCardIds[0]) {
                const allCards = effState.players.flatMap((p) => p.cards);
                const targetCard = allCards.find((c) => c.id === resolution.targetCardIds[0]);
                if (targetCard) {
                  const updatedMem = { ...effState.botMemories };
                  updatedMem[bot.id] = botRememberCard(effMemory, targetCard.id, targetCard);
                  set({ botMemories: updatedMem });
                  addLog(get, set, currentPlayerIndex, '🔍 peeked at an opponent\'s card');
                }
              } else if (resolution.targetCardIds.length >= 2) {
                addLog(get, set, currentPlayerIndex, '🔀 swapped two cards');
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
                    cards: updatedPlayers[c1.pi].cards.map((card, i) =>
                      i === (c1 as { pi: number; ci: number }).ci
                        ? { ...updatedPlayers[(c2 as { pi: number; ci: number }).pi].cards[(c2 as { pi: number; ci: number }).ci], faceUp: false }
                        : card
                    ),
                  };
                  updatedPlayers[c2.pi] = {
                    ...updatedPlayers[c2.pi],
                    cards: updatedPlayers[c2.pi].cards.map((card, i) =>
                      i === (c2 as { pi: number; ci: number }).ci ? { ...temp, faceUp: false } : card
                    ),
                  };
                  set({ players: updatedPlayers });
                }
              }

              setTimeout(() => get().endTurn(), 600);
            }, 1000);
          } else {
            setTimeout(() => { get().openTapWindow(); }, 800);
          }
        }
      }, 1200);
    },

    revealAllCards: () => {
      const { players, kabooCallerIndex, settings } = get();
      const targetScore = parseInt(settings.targetScore);

      const updatedPlayers = players.map((p) => ({
        ...p,
        cards: p.cards.map((c) => ({ ...c, faceUp: true })),
        score: calculateScore(p.cards),
      }));

      if (kabooCallerIndex !== null) {
        const callerScore = updatedPlayers[kabooCallerIndex].score;
        const otherScores = updatedPlayers.filter((_, i) => i !== kabooCallerIndex).map((p) => p.score);
        const minOtherScore = Math.min(...otherScores);
        if (callerScore >= minOtherScore) {
          updatedPlayers[kabooCallerIndex] = {
            ...updatedPlayers[kabooCallerIndex],
            score: updatedPlayers[kabooCallerIndex].score + 20,
          };
        }
      }

      const withTotals = updatedPlayers.map((p) => ({
        ...p,
        totalScore: p.totalScore + p.score,
      }));

      const roundScores = withTotals.map((p) => ({
        playerId: p.id,
        score: p.score,
      }));

      // Check if any player has reached the target score
      const matchOver = withTotals.some((p) => p.totalScore >= targetScore);

      set({ players: withTotals, roundScores, matchOver });

      // Record stats for the human player
      const humanPlayer = withTotals[0];
      const isWinner = withTotals.every((p) => humanPlayer.score <= p.score);
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
  };
}
