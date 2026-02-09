'use client';

import { useState } from 'react';
import { GameBoardLayout } from '@/components/game/GameBoardLayout';
import { Button } from '@/components/ui/button';
import type { Card, Player, TurnPhase, EffectType } from '@/types/game';
import { MOCK_CARDS } from '@/lib/mockData';

const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'Player 1 (Me)', avatarColor: 'hsl(174 80% 42%)', cards: MOCK_CARDS.slice(0, 4), isHost: true, score: 0, totalScore: 0 },
  { id: 'p2', name: 'Bot Rex', avatarColor: 'hsl(270 60% 55%)', cards: MOCK_CARDS.slice(0, 4), isHost: false, score: 0, totalScore: 0 },
  { id: 'p3', name: 'Bot Ziggy', avatarColor: 'hsl(25 90% 55%)', cards: MOCK_CARDS.slice(0, 4), isHost: false, score: 0, totalScore: 0 },
  { id: 'p4', name: 'Bot Momo', avatarColor: 'hsl(330 80% 58%)', cards: MOCK_CARDS.slice(0, 4), isHost: false, score: 0, totalScore: 0 },
  { id: 'p5', name: 'Bot Pip', avatarColor: 'hsl(45 90% 55%)', cards: MOCK_CARDS.slice(0, 4), isHost: false, score: 0, totalScore: 0 },
  { id: 'p6', name: 'Bot Nova', avatarColor: 'hsl(200 80% 50%)', cards: MOCK_CARDS.slice(0, 4), isHost: false, score: 0, totalScore: 0 },
  { id: 'p7', name: 'Bot Blix', avatarColor: 'hsl(140 60% 45%)', cards: MOCK_CARDS.slice(0, 4), isHost: false, score: 0, totalScore: 0 },
  { id: 'p8', name: 'Bot Coco', avatarColor: 'hsl(0 75% 55%)', cards: MOCK_CARDS.slice(0, 4), isHost: false, score: 0, totalScore: 0 },
];

const MOCK_SETTINGS = {
  turnTimer: '30' as const,
  mattsPairsRule: false,
  useEffectCards: true,
  numPlayers: 4,
  botDifficulty: 'medium' as const,
  targetScore: '100' as const,
};

export default function GameDevPage() {
  // State for layout debugging
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [numPlayers, setNumPlayers] = useState(4);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('action');
  const [showHeldCard, setShowHeldCard] = useState(false);
  const [showEffectOverlay, setShowEffectOverlay] = useState(false);
  const [effectType, setEffectType] = useState<EffectType>('peek_own');
  const [showKabooAnnouncement, setShowKabooAnnouncement] = useState(false);
  const [showTapWindow, setShowTapWindow] = useState(false);
  const [showTurnLog, setShowTurnLog] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [discardCount, setDiscardCount] = useState(1);
  const TOTAL_DECK_SIZE = 52; // Assuming a standard deck size for simulation

  // Derived state
  const activePlayers = MOCK_PLAYERS.slice(0, numPlayers);
  
  const currentDrawPileCount = Math.max(0, TOTAL_DECK_SIZE - discardCount - (numPlayers * 4)); // Subtract dealt cards (4 per player)

  const MOCK_LOG = [
    { id: 'l1', playerName: 'Player 1', playerColor: 'hsl(174 80% 42%)', message: 'drew a card' },
    { id: 'l2', playerName: 'Bot Rex', playerColor: 'hsl(270 60% 55%)', message: 'swapped a card' },
  ];
  
  // Reorder players array based on current player index to simulate rotation
  // But for the layout component, we need to pass the array such that index 0 is always "me"
  // Wait, the GameBoard logic slices players: players[0] is human, players[1..n] are opponents.
  // So to simulate "being" Player 2, we need to rotate the array so Player 2 is at index 0.
  
  const rotatedPlayers = [
    ...activePlayers.slice(currentPlayerIndex),
    ...activePlayers.slice(0, currentPlayerIndex)
  ];

  // In the real game, "players" array is always [Human, Bot1, Bot2, ...] fixed order?
  // Let's check GameBoard.tsx:
  // const currentPlayer = players[0]; // Human player is always index 0
  // const opponents = players.slice(1);
  // const isPlayerTurn = currentPlayerIndex === 0;
  
  // So in the real game, the `players` array order is fixed (Human is always [0]), 
  // and `currentPlayerIndex` moves (0 -> 1 -> 2 -> 0).
  // But GameBoard.tsx calculates visual positions based on `players.slice(1)`.
  // Wait, if I am Player 1 (index 0), opponents are [1, 2, 3].
  // If it's Player 2's turn (index 1), the layout shouldn't rotate the table, just the "active turn" indicator.
  // HOWEVER, the user asked: "Dynamic change player -> TO debugging layout for every player play"
  // This implies we want to see the view FROM that player's perspective, OR just see whose turn it is?
  
  // If we want to debug the layout *as if* we are different players:
  // We should rotate the `players` prop passed to GameBoardLayout so that the "target" player is at index 0.
  
  const debugPlayers = rotatedPlayers;
  // But we also need to adjust the `currentPlayerIndex` passed to layout.
  // If we rotate the array, the "active" player is effectively index 0 (if it's their turn).
  // Let's keep it simple: We always view as the "first" player in our debug list.
  // And we can toggle whose turn it is relative to that view.
  
  // Actually, to "debug layout for every player play", it usually means "See what Player X sees".
  // So yes, rotating the players array is the correct approach to simulate "I am Player X".
  // And if we want to simulate "It is Player X's turn", we set the layout's currentPlayerIndex to 0.

  const handleDraw = () => {
    console.log('Draw clicked');
    setShowHeldCard(true);
    setTurnPhase('action');
  };

  const handleCallKaboo = () => {
    console.log('Kaboo called');
    setShowKabooAnnouncement(true);
    setTimeout(() => setShowKabooAnnouncement(false), 3000);
  };

  const handleSwap = () => {
    console.log('Swap clicked');
    if (selectedCards.length > 0) {
      // Simulate swap: just log and clear held card for now
      setShowHeldCard(false);
      setSelectedCards([]);
      // setTurnPhase('draw'); // End turn?
    }
  };

  const handleDiscardHeld = () => {
    console.log('Discard held card');
    setShowHeldCard(false);
    // Optionally advance phase or stay in action
  };

  const handleCardClick = (id: string) => {
    console.log('Card clicked:', id);
    setSelectedCards((prev) => 
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [id] // Single select for now
    );
  };

  // Helper to generate a larger discard pile by repeating mock cards
  const generateMockDiscardPile = (count: number) => {
    if (count <= 0) return [];
    const result = [];
    for (let i = 0; i < count; i++) {
      const baseCard = MOCK_CARDS[i % MOCK_CARDS.length];
      result.push({ ...baseCard, id: `mock-discard-${i}` });
    }
    return result;
  };

  return (
    <div className="relative h-screen w-full">
      {/* Debug Controls Overlay */}
      <div className="fixed top-16 left-4 z-50 flex flex-col gap-4 rounded-xl border border-border/40 bg-card/80 p-4 shadow-xl backdrop-blur-md w-64">
        <h2 className="font-display text-lg font-bold text-foreground">Layout Debugger</h2>
        
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">View As Player (Perspective)</label>
          <div className="grid grid-cols-4 gap-2">
            {activePlayers.map((p, i) => (
              <Button
                key={p.id}
                variant={currentPlayerIndex === i ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPlayerIndex(i)}
                className="h-8 w-full px-0"
                style={{ borderColor: p.avatarColor }}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Number of Players</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <Button
                key={n}
                variant={numPlayers === n ? "secondary" : "ghost"}
                size="icon"
                onClick={() => {
                   setNumPlayers(n);
                   if (currentPlayerIndex >= n) setCurrentPlayerIndex(0);
                }}
                className="h-6 w-6 text-xs"
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-semibold text-muted-foreground">Turn Phase</label>
           <div className="flex flex-wrap gap-2">
             {(['draw', 'action', 'effect'] as TurnPhase[]).map((phase) => (
               <Button
                 key={phase}
                 variant={turnPhase === phase ? "default" : "outline"}
                 size="sm"
                 onClick={() => setTurnPhase(phase)}
                 className="h-6 text-xs"
               >
                 {phase}
               </Button>
             ))}
           </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">State Toggles</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showHeldCard ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHeldCard(!showHeldCard)}
              className="h-6 text-xs"
            >
              Held Card
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Actions</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDraw}
              className="h-6 text-xs"
            >
              Draw
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwap}
              disabled={!showHeldCard || selectedCards.length === 0}
              className="h-6 text-xs"
            >
              Swap
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardHeld}
              disabled={!showHeldCard}
              className="h-6 text-xs"
            >
              Discard
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Overlays</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showEffectOverlay ? "default" : "outline"}
              size="sm"
              onClick={() => setShowEffectOverlay(!showEffectOverlay)}
              className="h-6 text-xs"
            >
              Effect
            </Button>
            {showEffectOverlay && (
               <select 
                 className="h-6 text-xs bg-background border rounded px-1 max-w-[100px]"
                 value={effectType || ''}
                 onChange={(e) => setEffectType(e.target.value as EffectType)}
               >
                 <option value="peek_own">Peek Own</option>
                 <option value="peek_opponent">Peek Opp</option>
                 <option value="blind_swap">Blind Swap</option>
                 <option value="semi_blind_swap">Semi Swap</option>
                 <option value="full_vision_swap">Full Swap</option>
               </select>
            )}
            <Button
              variant={showKabooAnnouncement ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newState = !showKabooAnnouncement;
                setShowKabooAnnouncement(newState);
                if (newState) {
                  setTimeout(() => setShowKabooAnnouncement(false), 3000);
                }
              }}
              className="h-6 text-xs"
            >
              Kaboo!
            </Button>
            <Button
               variant={showTapWindow ? "default" : "outline"}
               size="sm"
               onClick={() => setShowTapWindow(!showTapWindow)}
               className="h-6 text-xs"
             >
               Tap
             </Button>
             <Button
               variant={showTurnLog ? "default" : "outline"}
               size="sm"
               onClick={() => setShowTurnLog(!showTurnLog)}
               className="h-6 text-xs"
             >
               Log
             </Button>
             <Button
              variant={selectedCards.length > 0 ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (selectedCards.length > 0) {
                  setSelectedCards([]);
                } else {
                  // Select first card of current player
                  const firstCardId = debugPlayers[0]?.cards[0]?.id;
                  if (firstCardId) setSelectedCards([firstCardId]);
                }
              }}
              className="h-6 text-xs"
            >
              Select Card
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Pile State</label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">Discard: {discardCount}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDiscardCount(Math.max(0, discardCount - 1))}
                className="h-6 w-6"
              >
                -
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDiscardCount(Math.min(TOTAL_DECK_SIZE - (numPlayers * 4), discardCount + 1))}
                className="h-6 w-6"
              >
                +
              </Button>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground text-right">
             Draw: {currentDrawPileCount}
          </div>
        </div>
      </div>

      {/* The Actual Game Layout */}
      <GameBoardLayout
        players={debugPlayers}
        currentPlayerIndex={0} // In this debug view, it's always "my" turn (or we can add a toggle for that too)
        gamePhase="playing"
        turnPhase={turnPhase}
        drawPile={Array(currentDrawPileCount).fill({} as Card)}
        discardPile={generateMockDiscardPile(discardCount)}
        heldCard={showHeldCard ? MOCK_CARDS[0] : null}
        peekedCards={[]}
        memorizedCards={[]}
        selectedCards={selectedCards}
        effectType={showEffectOverlay ? effectType : null}
        effectStep="select"
        effectPreviewCardIds={[]}
        effectTimeRemaining={10}
        settings={MOCK_SETTINGS}
        turnTimeRemaining={30}
        kabooCalled={showKabooAnnouncement}
        kabooCallerIndex={showKabooAnnouncement ? 1 : null}
        showKabooAnnouncement={showKabooAnnouncement}
        finalRoundTurnsLeft={null}
        tapState={showTapWindow ? { phase: 'window', selectedCardIds: [], swapTargets: [], swapsRemaining: 0 } : null}
         showEffectOverlay={showEffectOverlay}
         instruction="Debug Mode: Layout Preview"
         roundNumber={1}
         turnLog={showTurnLog ? MOCK_LOG : []}
         onPlayerCardClick={handleCardClick}
        onOpponentCardClick={(id) => console.log('Opponent card clicked:', id)}
        onDrawClick={handleDraw}
        onCallKaboo={handleCallKaboo}
        onSwapCard={handleSwap}
        onDiscardHeldCard={handleDiscardHeld}
        onDiscardPair={(id1, id2) => console.log('Discard pair', id1, id2)}
      />
    </div>
  );
}
