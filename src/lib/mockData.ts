import type { Card } from '@/types/game';

export const MOCK_CARDS: Card[] = [
  { id: 'c1', suit: 'hearts', rank: 'A', faceUp: false },
  { id: 'c2', suit: 'spades', rank: '7', faceUp: false },
  { id: 'c3', suit: 'diamonds', rank: 'K', faceUp: true },
  { id: 'c4', suit: 'clubs', rank: '2', faceUp: false },
  { id: 'c5', suit: 'hearts', rank: '10', faceUp: true },
  { id: 'c6', suit: 'clubs', rank: '5', faceUp: false },
  { id: 'c7', suit: 'spades', rank: 'Q', faceUp: false },
  { id: 'c8', suit: 'diamonds', rank: '3', faceUp: true },
];
