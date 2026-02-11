import type { TimerOption, BotDifficulty, TargetScore } from '@/types/game';

export const TIMER_OPTIONS: { value: TimerOption; label: string }[] = [
  { value: '15', label: '15s' },
  { value: '30', label: '30s' },
  { value: '60', label: '60s' },
];

export const DIFFICULTY_OPTIONS: { value: BotDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const TARGET_SCORE_OPTIONS: { value: TargetScore; label: string }[] = [
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '150', label: '150' },
  { value: '200', label: '200' },
];

export const PLAYER_COUNTS = [2, 3, 4, 5, 6, 7, 8];
