import { useSettingsStore, getKeyDisplayName, type KeyAction } from '@/store/settingsStore';

interface KeyHintProps {
  action: KeyAction;
}

export function KeyHint({ action }: KeyHintProps) {
  const key = useSettingsStore((s) => s.keyBindings[action]);
  return (
    <kbd className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-foreground/20 bg-foreground/10 px-1 font-body text-[10px] font-bold leading-none opacity-70">
      {getKeyDisplayName(key)}
    </kbd>
  );
}
