import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Volume2, Keyboard, Sparkles, Music, RotateCcw, Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Modal } from '@/components/ui/modal';
import {
  useSettingsStore,
  KEY_ACTION_LABELS,
  SOUND_CATEGORY_LABELS,
  getKeyDisplayName,
  type KeyAction,
  type SoundCategory,
  type ThemeMode,
  type BackgroundTrack,
} from '@/store/settingsStore';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const TAB_CONFIG = [
  { id: 'Display' as const, icon: Monitor },
  { id: 'Sound' as const, icon: Volume2 },
  { id: 'Controls' as const, icon: Keyboard },
];
type Tab = 'Display' | 'Sound' | 'Controls';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Laptop },
];

const BACKGROUND_TRACK_OPTIONS: { value: BackgroundTrack; label: string }[] = [
  { value: 'kaboo-1', label: 'Kaboo 1' },
  { value: 'kaboo-2', label: 'Kaboo 2' },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('Display');
  const [listeningFor, setListeningFor] = useState<KeyAction | null>(null);

  const {
    keyBindings,
    masterVolume,
    sfxVolume,
    animationsEnabled,
    soundToggles,
    theme,
    backgroundTrack,
    setKeyBinding,
    resetKeyBindings,
    setMasterVolume,
    setSfxVolume,
    setAnimationsEnabled,
    setSoundToggle,
    setTheme,
    setBackgroundTrack,
  } = useSettingsStore();

  // Key remapping listener
  useEffect(() => {
    if (!listeningFor) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.code === 'Escape') {
        setListeningFor(null);
        return;
      }

      // Check for conflicts and swap bindings
      const conflictEntry = Object.entries(keyBindings).find(
        ([action, key]) => key === e.code && action !== listeningFor
      );
      if (conflictEntry) {
        setKeyBinding(conflictEntry[0] as KeyAction, keyBindings[listeningFor]);
      }

      setKeyBinding(listeningFor, e.code);
      setListeningFor(null);
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [listeningFor, keyBindings, setKeyBinding]);

  // Clear listening state when modal closes
  useEffect(() => {
    if (!open) setListeningFor(null);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/30 px-4 pt-2 shrink-0">
        {TAB_CONFIG.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'relative flex items-center gap-1.5 rounded-t-lg px-3 py-2 font-body text-sm font-semibold transition-colors',
              tab === id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {id}
            {tab === id && (
              <motion.div
                layoutId="settings-tab-indicator"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'Display' && (
                <div className="space-y-4">
                  {/* Theme selector */}
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="mb-2 font-display text-sm font-bold text-foreground">Theme</p>
                    <div className="flex gap-2">
                      {THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTheme(opt.value)}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-display text-xs font-bold transition-all',
                            theme === opt.value
                              ? 'gradient-primary text-primary-foreground glow-primary'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80',
                          )}
                        >
                          <opt.icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animations toggle */}
                  <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-display text-sm font-bold text-foreground">
                          Animations
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          Card animations and transitions
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={animationsEnabled}
                      onCheckedChange={setAnimationsEnabled}
                    />
                  </div>
                </div>
              )}

              {tab === 'Sound' && (
                <div className="space-y-5">
                  <div className="rounded-xl bg-muted/30 p-3">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Volume2 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <p className="font-display text-sm font-bold text-foreground">
                          Master Volume
                        </p>
                        <span className="font-body text-xs text-muted-foreground">
                          {Math.round(masterVolume * 100)}%
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[masterVolume * 100]}
                      max={100}
                      step={1}
                      onValueChange={([v]) => setMasterVolume(v / 100)}
                    />
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Music className="h-4 w-4" />
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <p className="font-display text-sm font-bold text-foreground">
                          SFX Volume
                        </p>
                        <span className="font-body text-xs text-muted-foreground">
                          {Math.round(sfxVolume * 100)}%
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[sfxVolume * 100]}
                      max={100}
                      step={1}
                      onValueChange={([v]) => setSfxVolume(v / 100)}
                    />
                  </div>

                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="mb-2 font-display text-sm font-bold text-foreground">
                      Background Track
                    </p>
                    <div className="flex gap-2">
                      {BACKGROUND_TRACK_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setBackgroundTrack(opt.value)}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-display text-xs font-bold transition-all',
                            backgroundTrack === opt.value
                              ? 'gradient-primary text-primary-foreground glow-primary'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Per-sound toggles */}
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="mb-2 font-display text-sm font-bold text-foreground">Sound Types</p>
                    <div className="space-y-2">
                      {(Object.entries(SOUND_CATEGORY_LABELS) as [SoundCategory, string][]).map(
                        ([category, label]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between py-1"
                          >
                            <span className="font-body text-sm text-foreground">{label}</span>
                            <Switch
                              checked={soundToggles[category] ?? true}
                              onCheckedChange={(v) => setSoundToggle(category, v)}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'Controls' && (
                <div className="space-y-1">
                  {(Object.entries(KEY_ACTION_LABELS) as [KeyAction, string][]).map(
                    ([action, label]) => (
                      <div
                        key={action}
                        className="flex items-center justify-between rounded-lg px-1 py-1.5 transition-colors hover:bg-muted/30"
                      >
                        <span className="font-body text-sm text-foreground">
                          {label}
                        </span>
                        <button
                          onClick={() =>
                            setListeningFor(
                              listeningFor === action ? null : action
                            )
                          }
                          className={cn(
                            'min-w-[3.5rem] rounded-lg border px-3 py-1 text-center font-display text-xs font-bold transition-all',
                            listeningFor === action
                              ? 'border-primary bg-primary/10 text-primary animate-pulse'
                              : 'border-border/40 bg-muted/50 text-foreground hover:border-primary/50',
                          )}
                        >
                          {listeningFor === action
                            ? '...'
                            : getKeyDisplayName(keyBindings[action])}
                        </button>
                      </div>
                    )
                  )}
                  <button
                    onClick={() => {
                      resetKeyBindings();
                      setListeningFor(null);
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border/30 py-2 font-display text-xs font-bold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to Defaults
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
    </Modal>
  );
}
