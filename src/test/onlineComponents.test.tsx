import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useOnlineStore } from '@/store/onlineStore';
import { OnlineLobbyScreen } from '@/components/lobby/OnlineLobbyScreen';
import { LobbyView } from '@/components/lobby/LobbyView';
import { OnlineGameBoard } from '@/components/game/OnlineGameBoard';
import { OnlineScoringScreen } from '@/components/scoring/OnlineScoringScreen';
import MultiplayerPage from '@/app/multiplayer/page';

vi.mock('@/services/gameApi', () => ({
  gameApi: {
    createGame: vi.fn(),
    joinGame: vi.fn(),
    playMove: vi.fn(),
    updateSettings: vi.fn(),
    startGame: vi.fn(),
    toggleReady: vi.fn(),
    leaveGame: vi.fn(),
    endGame: vi.fn(),
    kickPlayer: vi.fn(),
    subscribeToGame: vi.fn(),
  },
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('@/components/game/useGameInstruction', () => ({
  getInstruction: vi.fn(() => 'Test instruction'),
}));

vi.mock('next/navigation', () => {
  const push = vi.fn();
  return {
    useRouter: () => ({ push }),
  };
});

vi.mock('@/components/game/GameBoardLayout', () => ({
  GameBoardLayout: (props: any) => (
    <div
      data-testid="game-board-layout"
      data-current-player-index={props.currentPlayerIndex}
      data-turn-time-remaining={props.turnTimeRemaining}
      data-game-phase={props.gamePhase}
      data-turn-phase={props.turnPhase}
    />
  ),
}));

describe('OnlineLobbyScreen', () => {
  beforeEach(() => {
    useOnlineStore.setState((state) => ({
      ...state,
      roomCode: 'ABCD',
      players: [],
      myPlayerId: '',
      screen: 'lobby',
    }));
  });

  it('treats current player as host when isHost is true and exposes End Game button', () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      myPlayerId: 'host',
      players: [
        {
          id: 'host',
          name: 'Host',
          avatarColor: '#fff',
          cards: [],
          isHost: true,
          isReady: true,
          score: 0,
          totalScore: 0,
        },
        {
          id: 'guest',
          name: 'Guest',
          avatarColor: '#000',
          cards: [],
          isHost: false,
          isReady: false,
          score: 0,
          totalScore: 0,
        },
      ],
    });

    render(<OnlineLobbyScreen />);

    expect(screen.getByText('End Game for Everyone')).toBeInTheDocument();
  });

  it('treats current player as guest when isHost is false and hides End Game button', () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      myPlayerId: 'guest',
      players: [
        {
          id: 'host',
          name: 'Host',
          avatarColor: '#fff',
          cards: [],
          isHost: true,
          isReady: true,
          score: 0,
          totalScore: 0,
        },
        {
          id: 'guest',
          name: 'Guest',
          avatarColor: '#000',
          cards: [],
          isHost: false,
          isReady: false,
          score: 0,
          totalScore: 0,
        },
      ],
    });

    render(<OnlineLobbyScreen />);

    expect(screen.queryByText('End Game for Everyone')).toBeNull();
  });
});

describe('LobbyView', () => {
  const basePlayers = [
    {
      id: 'host',
      name: 'Host',
      avatarColor: '#fff',
      cards: [],
      isHost: true,
      isReady: true,
      score: 0,
      totalScore: 0,
    },
    {
      id: 'guest',
      name: 'Guest',
      avatarColor: '#000',
      cards: [],
      isHost: false,
      isReady: false,
      score: 0,
      totalScore: 0,
    },
  ];

  it('renders room code for online games', () => {
    render(
      <LobbyView
        roomCode="ROOM"
        players={basePlayers as any}
        isOffline={false}
        isHost
        isReady
        canStart={false}
        onStart={() => {}}
        onLeave={() => {}}
        onEndGame={() => {}}
        onToggleReady={() => {}}
        onBack={() => {}}
        settings={{
          turnTimer: '30',
          mattsPairsRule: false,
          useEffectCards: true,
          numPlayers: 2,
          botDifficulty: 'medium',
          targetScore: '100',
        }}
        updateSettings={() => {}}
        myPlayerId="host"
      />
    );

    expect(screen.getByText('ROOM')).toBeInTheDocument();
  });

  it('disables Start button when canStart is false and enables when true', () => {
    const { rerender } = render(
      <LobbyView
        roomCode="ROOM"
        players={basePlayers as any}
        isOffline={false}
        isHost
        isReady
        canStart={false}
        onStart={() => {}}
        onLeave={() => {}}
        onEndGame={() => {}}
        onToggleReady={() => {}}
        onBack={() => {}}
        settings={{
          turnTimer: '30',
          mattsPairsRule: false,
          useEffectCards: true,
          numPlayers: 2,
          botDifficulty: 'medium',
          targetScore: '100',
        }}
        updateSettings={() => {}}
        myPlayerId="host"
      />
    );

    const startButtonDisabled = screen.getByRole('button', { name: /player not ready/i });
    expect(startButtonDisabled).toBeDisabled();

    rerender(
      <LobbyView
        roomCode="ROOM"
        players={[
          basePlayers[0],
          { ...basePlayers[1], isReady: true },
        ] as any}
        isOffline={false}
        isHost
        isReady
        canStart
        onStart={() => {}}
        onLeave={() => {}}
        onEndGame={() => {}}
        onToggleReady={() => {}}
        onBack={() => {}}
        settings={{
          turnTimer: '30',
          mattsPairsRule: false,
          useEffectCards: true,
          numPlayers: 2,
          botDifficulty: 'medium',
          targetScore: '100',
        }}
        updateSettings={() => {}}
        myPlayerId="host"
      />
    );

    const startButtonEnabled = screen.getByRole('button', { name: /start game/i });
    expect(startButtonEnabled).toBeEnabled();
  });

  it('wires primary callbacks for Start, Leave, Back, Ready', () => {
    const onStart = vi.fn();
    const onLeave = vi.fn();
    const onBack = vi.fn();
    const onToggleReady = vi.fn();

    render(
      <LobbyView
        roomCode="ROOM"
        players={basePlayers as any}
        isOffline={false}
        isHost={false}
        isReady={false}
        canStart={false}
        onStart={onStart}
        onLeave={onLeave}
        onEndGame={undefined}
        onToggleReady={onToggleReady}
        onBack={onBack}
        settings={{
          turnTimer: '30',
          mattsPairsRule: false,
          useEffectCards: true,
          numPlayers: 2,
          botDifficulty: 'medium',
          targetScore: '100',
        }}
        updateSettings={() => {}}
        myPlayerId="guest"
      />
    );

    fireEvent.click(screen.getByText('← Back'));
    expect(onBack).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /not ready/i }));
    expect(onToggleReady).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /leave game/i }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});

describe('OnlineGameBoard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useOnlineStore.setState((state) => ({
      ...state,
      screen: 'game',
      players: [
        {
          id: 'me',
          name: 'Me',
          avatarColor: '#fff',
          cards: [],
          isHost: true,
          isReady: true,
          score: 0,
          totalScore: 0,
        },
      ],
      myPlayerId: 'me',
      currentPlayerIndex: 0,
      gamePhase: 'playing',
      turnPhase: 'draw',
      settings: {
        turnTimer: '30',
        mattsPairsRule: false,
        useEffectCards: true,
        numPlayers: 2,
        botDifficulty: 'medium',
        targetScore: '100',
      },
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes current player index and turn timer into GameBoardLayout and counts down', () => {
    const { getByTestId } = render(<OnlineGameBoard />);

    const layout = getByTestId('game-board-layout');
    expect(layout.getAttribute('data-current-player-index')).toBe('0');
    expect(layout.getAttribute('data-turn-time-remaining')).toBe('30');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(layout.getAttribute('data-turn-time-remaining')).toBe('28');
  });
});

describe('OnlineScoringScreen', () => {
  beforeEach(() => {
    useOnlineStore.setState((state) => ({
      ...state,
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          avatarColor: '#fff',
          cards: [],
          isHost: true,
          isReady: true,
          score: 10,
          totalScore: 10,
        },
      ],
      kabooCallerIndex: null,
      settings: {
        turnTimer: '30',
        mattsPairsRule: false,
        useEffectCards: true,
        numPlayers: 2,
        botDifficulty: 'medium',
        targetScore: '100',
      },
    }));
  });

  it('calls resetStore when matchOver and Play Again is clicked', () => {
    const resetStore = vi.fn();

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gamePhase: 'reveal',
      resetStore,
      leaveGame: vi.fn(),
      startGame: vi.fn(),
    } as any);

    render(<OnlineScoringScreen />);

    fireEvent.click(screen.getByRole('button', { name: /new match/i }));
    expect(resetStore).toHaveBeenCalledTimes(1);
  });

  it('calls startGame when not matchOver and Play Again is clicked', () => {
    const startGame = vi.fn();

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gamePhase: 'playing',
      resetStore: vi.fn(),
      leaveGame: vi.fn(),
      startGame,
    } as any);

    render(<OnlineScoringScreen />);

    fireEvent.click(screen.getByRole('button', { name: /next round/i }));
    expect(startGame).toHaveBeenCalledTimes(1);
  });
});

describe('MultiplayerPage routing', () => {
  beforeEach(() => {
    useOnlineStore.setState((state) => ({
      ...state,
      screen: 'home',
    }));
  });

  it('renders lobby, game, and scoring screens based on store screen', () => {
    useOnlineStore.setState((state) => ({
      ...state,
      screen: 'lobby',
    }));
    const { rerender } = render(<MultiplayerPage />);
    expect(screen.getByText(/game lobby/i)).toBeInTheDocument();

    useOnlineStore.setState((state) => ({
      ...state,
      screen: 'game',
    }));
    rerender(<MultiplayerPage />);
    expect(screen.getByTestId('game-board-layout')).toBeInTheDocument();

    useOnlineStore.setState((state) => ({
      ...state,
      screen: 'scoring',
    }));
    rerender(<MultiplayerPage />);
    expect(screen.getByText(/round 1 complete|match over!/i)).toBeInTheDocument();
  });
});
