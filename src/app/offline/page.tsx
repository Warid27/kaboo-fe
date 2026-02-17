'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOfflineStore } from '@/store/offlineStore';
import { OfflineLobbyScreen } from '@/components/lobby/OfflineLobbyScreen';
import { OfflineGameBoard } from '@/components/game/OfflineGameBoard';
import { OfflineScoringScreen } from '@/components/scoring/OfflineScoringScreen';

export default function OfflinePage() {
  const router = useRouter();
  const { screen } = useOfflineStore();

  useEffect(() => {
    if (screen === 'home') {
      router.push('/');
    }
  }, [screen, router]);

  // Handle screen switching
  switch (screen) {
    case 'lobby':
      return <OfflineLobbyScreen />;
    case 'game':
      return <OfflineGameBoard />;
    case 'scoring':
      return <OfflineScoringScreen />;
    case 'home':
    default:
      // In offline mode, if screen is home, we might still be on the page
      // but usually the HomeScreen redirects to /offline
      // We'll show the lobby by default if we're on this route
      return <OfflineLobbyScreen />;
  }
}
