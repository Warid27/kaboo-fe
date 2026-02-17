import { GameSettings as IGameSettings } from '@/types/game';
import { HostView } from './settings/HostView';
import { OfflineView } from './settings/OfflineView';
import { PlayerView } from './settings/PlayerView';

interface GameSettingsProps {
  settings: IGameSettings;
  updateSettings: (partial: Partial<IGameSettings>) => void;
  isHost: boolean;
  isOffline: boolean;
}

export function GameSettings({ settings, updateSettings, isHost, isOffline }: GameSettingsProps) {
  if (isOffline) {
    return <OfflineView settings={settings} updateSettings={updateSettings} />;
  }

  if (isHost) {
    return <HostView settings={settings} updateSettings={updateSettings} />;
  }

  return <PlayerView settings={settings} />;
}
