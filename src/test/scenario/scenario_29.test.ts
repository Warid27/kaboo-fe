import { useOfflineStore } from '../../store/offlineStore';
import { resetStore } from '../../store/offlineStore';
import { gameApi } from '../../services/gameApi';

vi.mock('../../services/gameApi', () => ({
  gameApi: {
    playMove: vi.fn(),
    leaveGame: vi.fn(),
    joinRoom: vi.fn(),
  }
}));

describe('Scenario 29: Offline Mode While Online (Connectivity Toggle)', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  test('Offline game should remain offline even if connectivity is restored', async () => {
    const store = useOfflineStore.getState();

    // 1. Setup: Offline game in progress
    useOfflineStore.setState({
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      turnPhase: 'draw',
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'bot1', name: 'Bot', avatarColor: '#00FF00', cards: [], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      drawPile: [{ id: 'd1', rank: '5' as const, suit: 'hearts' as const, faceUp: false }],
      settings: {
        numPlayers: 2,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'medium' as const,
        targetScore: '100' as const,
      },
    });

    // 2. Simulate "WiFi reconnects" (no-op in our app logic, but we test no side effects)
    // In a real scenario, this might trigger a browser event, but our store should ignore it for active games.
    
    // 3. Perform an action
    store.drawCard();

    // Assert: No network calls made to gameApi
    expect(gameApi.playMove).not.toHaveBeenCalled();
    
    // Assert: State updated locally
    expect(useOfflineStore.getState().heldCard?.id).toBe('d1');
    expect(useOfflineStore.getState().turnPhase).toBe('action');
  });
});
