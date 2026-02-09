import type { Card, Rank, Suit, EffectType } from '@/types/game';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardValue(rank: Rank): number {
  switch (rank) {
    case 'A': return 1;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    default: return parseInt(rank);
  }
}

/** In Kaboo, Red Kings count as 0 */
export function getKabooCardValue(card: Card): number {
  if (card.rank === 'K' && (card.suit === 'hearts' || card.suit === 'diamonds')) {
    return 0;
  }
  return getCardValue(card.rank);
}

export function calculateScore(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + getKabooCardValue(card), 0);
}

export function getEffectType(rank: Rank): EffectType {
  switch (rank) {
    case '7':
    case '8':
      return 'peek_own';
    case '9':
    case '10':
      return 'peek_opponent';
    case 'J':
      return 'blind_swap';
    case 'Q':
      return 'semi_blind_swap';
    case 'K':
      return 'full_vision_swap';
    default:
      return null;
  }
}

export function hasEffect(rank: Rank): boolean {
  return getEffectType(rank) !== null;
}

export function getEffectName(effect: EffectType): string {
  switch (effect) {
    case 'peek_own': return 'Peek at Own Card';
    case 'peek_opponent': return 'Peek at Opponent Card';
    case 'blind_swap': return 'Blind Swap';
    case 'semi_blind_swap': return 'Semi-Blind Swap';
    case 'full_vision_swap': return 'Full Vision Swap';
    default: return '';
  }
}

export function getEffectDescription(effect: EffectType): string {
  switch (effect) {
    case 'peek_own': return 'Look at one of your own cards.';
    case 'peek_opponent': return "Look at one of an opponent's cards.";
    case 'blind_swap': return 'Swap any two cards on the table without looking.';
    case 'semi_blind_swap': return "Look at an opponent's card, then decide whether to swap.";
    case 'full_vision_swap': return 'Look at two cards, then decide whether to swap them.';
    default: return '';
  }
}

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number = 4): { hands: Card[][]; remaining: Card[] } {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  let cardIndex = 0;

  for (let c = 0; c < cardsPerPlayer; c++) {
    for (let p = 0; p < numPlayers; p++) {
      if (cardIndex < deck.length) {
        hands[p].push(deck[cardIndex]);
        cardIndex++;
      }
    }
  }

  return {
    hands,
    remaining: deck.slice(cardIndex),
  };
}
