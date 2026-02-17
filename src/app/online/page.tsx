'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnlineStore } from '@/store/onlineStore';
import { OnlineLobbyScreen } from '@/components/lobby/OnlineLobbyScreen';
import { OnlineGameBoard } from '@/components/game/OnlineGameBoard';
import { OnlineScoringScreen } from '@/components/scoring/OnlineScoringScreen';

export default function OnlinePage() {
  const router = useRouter();
  const { screen } = useOnlineStore();

  useEffect(() => {
    if (screen === 'home') {
      router.push('/');
    }
  }, [screen, router]);

  // Handle screen switching
  switch (screen) {
    case 'lobby':
      return <OnlineLobbyScreen />;
    case 'game':
      return <OnlineGameBoard />;
    case 'scoring':
      return <OnlineScoringScreen />;
    case 'home':
    default:
      // If we're redirected home, the useEffect will handle it
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
  }
}
