"use client"
import { PlayingCard } from '@/components/game/PlayingCard';
import type { Card } from '@/types/game';

// Mock cards for display
const aceSpades: Card = { id: 'as', suit: 'spades', rank: 'A', faceUp: true };
const kingHearts: Card = { id: 'kh', suit: 'hearts', rank: 'K', faceUp: true };
const tenDiamonds: Card = { id: '10d', suit: 'diamonds', rank: '10', faceUp: true };
const fiveClubs: Card = { id: '5c', suit: 'clubs', rank: '5', faceUp: true };
const hiddenCard: Card = { id: 'hidden', suit: 'spades', rank: 'A', faceUp: false };

export default function CardDebugPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <h1 className="mb-2 font-display text-4xl font-bold text-primary">Card Design Debug</h1>
          <p className="text-muted-foreground">
            Visual reference for card designs, sizes, and states.
          </p>
        </div>

        {/* Basic Views */}
        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 font-display text-2xl font-bold">1. Front & Back</h2>
          <div className="flex flex-wrap gap-8 rounded-xl bg-muted/30 p-8">
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">Back</span>
              <PlayingCard card={hiddenCard} />
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">Front (Black)</span>
              <PlayingCard card={aceSpades} isFaceUp />
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">Front (Red)</span>
              <PlayingCard card={kingHearts} isFaceUp />
            </div>
          </div>
        </section>

        {/* Sizes */}
        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 font-display text-2xl font-bold">2. Sizes</h2>
          <div className="flex items-end gap-8 rounded-xl bg-muted/30 p-8">
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">sm</span>
              <PlayingCard card={tenDiamonds} isFaceUp size="sm" />
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">md (default)</span>
              <PlayingCard card={tenDiamonds} isFaceUp size="md" />
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">lg</span>
              <PlayingCard card={tenDiamonds} isFaceUp size="lg" />
            </div>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 font-display text-2xl font-bold">3. States</h2>
          <div className="flex flex-wrap gap-8 rounded-xl bg-muted/30 p-8">
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">Selected</span>
              <PlayingCard card={fiveClubs} isFaceUp isSelected />
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">Highlighted</span>
              <PlayingCard card={fiveClubs} isFaceUp isHighlighted />
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">Memorized</span>
              <PlayingCard card={hiddenCard} isMemorized />
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">Peeked</span>
              <PlayingCard card={fiveClubs} isPeeked />
            </div>
          </div>
        </section>

        {/* Suits Reference */}
        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 font-display text-2xl font-bold">4. Suits</h2>
          <div className="grid grid-cols-4 gap-4 rounded-xl bg-muted/30 p-8">
            <PlayingCard card={{ ...aceSpades, suit: 'spades' }} isFaceUp />
            <PlayingCard card={{ ...aceSpades, suit: 'clubs' }} isFaceUp />
            <PlayingCard card={{ ...aceSpades, suit: 'hearts' }} isFaceUp />
            <PlayingCard card={{ ...aceSpades, suit: 'diamonds' }} isFaceUp />
          </div>
        </section>
      </div>
    </div>
  );
}
