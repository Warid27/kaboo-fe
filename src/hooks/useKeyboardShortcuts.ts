import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore, type KeyAction } from '@/store/settingsStore';

export function useKeyboardShortcuts() {
  const keyBindings = useSettingsStore((s) => s.keyBindings);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Skip if a dialog/modal is open
      if (document.querySelector('[role="dialog"]')) return;

      const state = useGameStore.getState();
      const {
        gamePhase, turnPhase, currentPlayerIndex, heldCard,
        selectedCards, tapState, isPaused, players, kabooCalled,
      } = state;

      if (isPaused) return;
      if (gamePhase === 'waiting' || gamePhase === 'dealing' || gamePhase === 'reveal') return;

      const isPlayerTurn = currentPlayerIndex === 0;
      const code = e.code;

      // Find which action this key maps to
      const actionEntry = Object.entries(keyBindings).find(([, v]) => v === code);
      if (!actionEntry) return;
      const action = actionEntry[0] as KeyAction;

      switch (action) {
        case 'draw':
          if (isPlayerTurn && turnPhase === 'draw' && gamePhase === 'playing') {
            e.preventDefault();
            state.drawCard();
          }
          break;

        case 'discard':
          if (isPlayerTurn && turnPhase === 'action' && heldCard) {
            e.preventDefault();
            state.discardHeldCard();
          }
          break;

        case 'swap':
          if (isPlayerTurn && turnPhase === 'action' && heldCard && selectedCards.length > 0) {
            e.preventDefault();
            state.swapCard(selectedCards[0]);
          }
          break;

        case 'kaboo':
          if (isPlayerTurn && turnPhase === 'draw' && gamePhase === 'playing' && !kabooCalled) {
            e.preventDefault();
            state.callKaboo();
          }
          break;

        case 'endTurn':
          if (isPlayerTurn && turnPhase === 'end_turn') {
            e.preventDefault();
            state.endTurn();
          }
          break;

        case 'confirm':
          if (tapState?.phase === 'selecting' && tapState.selectedCardIds.length > 0) {
            e.preventDefault();
            state.confirmTapDiscard();
          } else if (isPlayerTurn && turnPhase === 'effect') {
            e.preventDefault();
            state.confirmEffect();
          }
          break;

        case 'skip':
          if (tapState?.phase === 'selecting') {
            e.preventDefault();
            state.finalizeTap();
          } else if (tapState?.phase === 'swapping') {
            e.preventDefault();
            state.skipTapSwap();
          } else if (isPlayerTurn && turnPhase === 'effect') {
            e.preventDefault();
            state.declineEffect();
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
            state.tapSelectCard(card.id);
          } else if (tapState?.phase === 'swapping') {
            e.preventDefault();
            state.tapSwapCard(card.id);
          } else if (gamePhase === 'initial_look') {
            e.preventDefault();
            state.peekCard(card.id);
          } else if (isPlayerTurn && turnPhase === 'action') {
            e.preventDefault();
            state.selectCard(card.id);
          } else if (isPlayerTurn && turnPhase === 'effect') {
            e.preventDefault();
            state.resolveEffect(card.id);
          }
          break;
        }

        case 'tap':
          if (tapState?.phase === 'window') {
            e.preventDefault();
            state.activateTap();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyBindings]);
}
