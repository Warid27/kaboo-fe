import type { Player, TurnLogEntry } from '@/types/game';
import { AVATAR_COLORS, MOCK_PLAYER_NAMES } from '@/types/game';

export type StoreGet<State = unknown> = () => State;

export type StoreSet<State = unknown> = (
  partial: Partial<State> | ((state: State) => Partial<State>)
) => void;

let logIdCounter = 0;

export function addLog(
  get: StoreGet,
  set: StoreSet,
  playerIndex: number,
  message: string,
) {
  const { players, turnLog } = get() as { players: Player[]; turnLog: TurnLogEntry[] };
  const player = players[playerIndex];
  if (!player) return;
  const entry: TurnLogEntry = {
    id: `log-${++logIdCounter}`,
    playerName: player.name,
    playerColor: player.avatarColor,
    message,
  };
  set({ turnLog: [...turnLog, entry] } as Partial<unknown>);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function createMockPlayers(count: number, hostName: string): Player[] {
  const players: Player[] = [
    {
      id: 'player-0',
      name: hostName || 'You',
      avatarColor: AVATAR_COLORS[0],
      cards: [],
      isHost: true,
      isReady: true,
      score: 0,
      totalScore: 0,
    },
  ];

  for (let i = 1; i < count; i++) {
    players.push({
      id: `player-${i}`,
      name: MOCK_PLAYER_NAMES[i - 1] || `Player ${i + 1}`,
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      cards: [],
      isHost: false,
      isReady: true,
      score: 0,
      totalScore: 0,
    });
  }

  return players;
}
