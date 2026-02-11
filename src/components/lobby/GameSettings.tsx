import { useGameStore } from '@/store/gameStore';
import { HostView } from './settings/HostView';
import { OfflineView } from './settings/OfflineView';
import { PlayerView } from './settings/PlayerView';

export function GameSettings({ isHost = true }: { isHost?: boolean }) {
  const { gameMode } = useGameStore();

  if (gameMode === 'offline') {
    return <OfflineView />;
  }

  if (isHost) {
    return <HostView />;
  }

  return <PlayerView />;
}
