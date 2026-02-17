import { useSettingsStore } from '@/store/settingsStore';

export function useAnimationConfig() {
  const enabled = useSettingsStore((s) => s.animationsEnabled);

  return {
    enabled,
    spring: enabled
      ? { type: 'spring' as const, stiffness: 300, damping: 20 }
      : { duration: 0 },
    fade: enabled
      ? { duration: 0.3 }
      : { duration: 0 },
    springStiff: enabled
      ? { type: 'spring' as const, stiffness: 400, damping: 30 }
      : { duration: 0 },
    initial: <T extends Record<string, unknown>>(props: T) => (enabled ? props : false),
  };
}
