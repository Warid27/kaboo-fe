import { useEffect } from 'react';
import { useOnlineStore } from '@/store/onlineStore';
import { useOfflineStore } from '@/store/offlineStore';
import { useSettingsStore, type KeyAction } from '@/store/settingsStore';

type OnlineMovePayload = { type: string; [key: string]: unknown };

type KeyboardActions = {
  drawCard?: () => void;
  discardHeldCard?: () => void;
  swapCard?: (cardId: string) => void;
  callKaboo?: () => void;
  endTurn?: () => void;
  readyToPlay?: () => void;
  confirmTapDiscard?: () => void;
  confirmEffect?: () => void;
  finalizeTap?: () => void;
  skipTapSwap?: () => void;
  declineEffect?: () => void;
  tapSelectCard?: (cardId: string) => void;
  tapSwapCard?: (cardId: string) => void;
  peekCard?: (cardId: string) => void;
  resolveEffect?: (cardId: string) => void;
};

export function useKeyboardShortcuts(mode: 'online' | 'offline' = 'online') {
  const keyBindings = useSettingsStore((s) => s.keyBindings);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Skip if a dialog/modal is open
      if (document.querySelector('[role="dialog"]')) return;

      const state = mode === 'online' ? useOnlineStore.getState() : useOfflineStore.getState();
      const {
        gamePhase,
        turnPhase,
        currentPlayerIndex,
        heldCard,
        players,
        kabooCalled,
      } = state;

      const tapState = 'tapState' in state
        ? (state as { tapState: { phase: string; selectedCardIds: string[] } | null }).tapState
        : null;

      const selectedCards = 'selectedCards' in state
        ? (state as { selectedCards: string[] }).selectedCards
        : [];

      const actions = state as KeyboardActions;

      const isPaused =
        'isPaused' in state && typeof (state as { isPaused?: boolean }).isPaused === 'boolean'
          ? (state as { isPaused: boolean }).isPaused
          : false;
      if (isPaused) return;
      if (gamePhase === 'waiting' || gamePhase === 'dealing' || gamePhase === 'reveal') return;

      const isPlayerTurn = currentPlayerIndex === 0;
      const code = e.code;

      // Find which action this key maps to
      const actionEntry = Object.entries(keyBindings).find(([, v]) => v === code);
      if (!actionEntry) return;
      const action = actionEntry[0] as KeyAction;

      // Helper for online moves
      const playOnlineMove = (payload: OnlineMovePayload) => {
        if (mode !== 'online') return false;
        if (!('playMove' in state)) return false;

        const playMove = (state as { playMove?: (p: OnlineMovePayload) => void }).playMove;
        if (!playMove || typeof playMove !== 'function') return false;

        playMove(payload);
        return true;
      };

      switch (action) {
        case 'draw':
          if (isPlayerTurn && turnPhase === 'draw' && gamePhase === 'playing') {
            e.preventDefault();
            if (!playOnlineMove({ type: 'DRAW_FROM_DECK' })) {
              actions.drawCard?.();
            }
          }
          break;

        case 'discard':
          if (isPlayerTurn && turnPhase === 'action' && heldCard) {
            e.preventDefault();
            if (!playOnlineMove({ type: 'DISCARD_DRAWN' })) {
              actions.discardHeldCard?.();
            }
          }
          break;

        case 'swap':
          if (isPlayerTurn && turnPhase === 'action' && heldCard && selectedCards.length > 0) {
            e.preventDefault();
            if (mode === 'online') {
              const cardIdx = players[0]?.cards.findIndex(c => c.id === selectedCards[0]);
              playOnlineMove({ type: 'SWAP_WITH_OWN', ownCardIndex: cardIdx });
            } else {
              actions.swapCard?.(selectedCards[0]);
            }
          }
          break;

        case 'kaboo':
          if (isPlayerTurn && turnPhase === 'draw' && gamePhase === 'playing' && !kabooCalled) {
            e.preventDefault();
            if (!playOnlineMove({ type: 'CALL_KABOO' })) {
              actions.callKaboo?.();
            }
          }
          break;

        case 'endTurn':
          if (isPlayerTurn && turnPhase === 'end_turn') {
            e.preventDefault();
            actions.endTurn?.();
          } else if (gamePhase === 'initial_look') {
            e.preventDefault();
            if (mode === 'online') {
              playOnlineMove({ type: 'READY_TO_PLAY' });
            } else if ('readyToPlay' in state) {
              actions.readyToPlay?.();
            }
          }
          break;

        case 'confirm':
          if (tapState?.phase === 'selecting' && tapState.selectedCardIds.length > 0) {
            e.preventDefault();
            if (mode === 'online') {
              // Online SNAP/Tap logic might be different, for now just use SNAP if applicable
              playOnlineMove({ type: 'SNAP', cardIndex: players[0]?.cards.findIndex(c => c.id === tapState.selectedCardIds[0]) });
            } else {
              actions.confirmTapDiscard?.();
            }
          } else if (isPlayerTurn && turnPhase === 'effect') {
            e.preventDefault();
            actions.confirmEffect?.();
          }
          break;

        case 'skip':
          if (tapState?.phase === 'selecting') {
            e.preventDefault();
            actions.finalizeTap?.();
          } else if (tapState?.phase === 'swapping') {
            e.preventDefault();
            actions.skipTapSwap?.();
          } else if (isPlayerTurn && turnPhase === 'effect') {
            e.preventDefault();
            actions.declineEffect?.();
          }
          break;

        case 'card1':
        case 'card2':
        case 'card3':
        case 'card4': {
          const idx = parseInt(action.slice(4)) - 1;
          const card = players[0]?.cards[idx];
          if (!card) break;

          if (tapState?.phase === 'selecting') {
            e.preventDefault();
            if (mode === 'online') {
              playOnlineMove({ type: 'SNAP', cardIndex: idx });
            } else {
              actions.tapSelectCard?.(card.id);
            }
          } else if (tapState?.phase === 'swapping') {
            e.preventDefault();
            actions.tapSwapCard?.(card.id);
          } else if (gamePhase === 'initial_look') {
            e.preventDefault();
            if (mode === 'offline') {
              actions.peekCard?.(card.id);
            }
          } else if (isPlayerTurn && turnPhase === 'action') {
            e.preventDefault();
            if (mode === 'offline') {
              actions.swapCard?.(card.id);
            } else {
              // In online mode, selecting a card usually means preparing for a swap or action
              // For now, we'll just use the same logic as OnlineGameBoard
              playOnlineMove({ type: 'SWAP_WITH_OWN', ownCardIndex: idx });
            }
          } else if (isPlayerTurn && turnPhase === 'effect') {
            e.preventDefault();
            if (mode === 'online') {
              const effectType = 'effectType' in state
                ? (state as { effectType?: string }).effectType
                : undefined;
              if (effectType === 'peek_own') {
                playOnlineMove({ type: 'PEEK_OWN', cardIndex: idx });
              }
            } else {
              actions.resolveEffect?.(card.id);
            }
          }
          break;
        }

        case 'tap':
          if (tapState?.phase === 'window') {
            e.preventDefault();
            if ('activateTap' in state) {
              const activateTap = (state as { activateTap?: () => void }).activateTap;
              activateTap?.();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyBindings, mode]);
}
