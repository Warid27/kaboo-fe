import { DocSection, DocTable, Badge } from './DocSection';
import { Target, GalleryVerticalEnd, RefreshCw, Keyboard, Bot, Trophy, Settings, Volume2 } from 'lucide-react';

export function PlayerDocs() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-gradient-primary">How to Play KABOO</h1>
        <p className="mt-2 font-body text-base text-muted-foreground">
          A card game of memory, strategy, and bluffing. Get the lowest score to win.
        </p>
      </div>

      <DocSection title="Objective" icon={<Target className="h-6 w-6" />}>
        <p>
          The goal of KABOO is to have the <strong>lowest total card value</strong> in your hand
          when the round ends. You start the game knowing only 2 of your 4 cards — the rest are hidden.
          Use memory, peeking, and swapping to minimize your score.
        </p>
      </DocSection>

      <DocSection title="Card Values" icon={<GalleryVerticalEnd className="h-6 w-6" />}>
        <DocTable
          headers={['Card', 'Value', 'Notes']}
          rows={[
            ['King (K)', '0', 'Best card — zero points'],
            ['Ace (A)', '1', ''],
            ['2 – 10', 'Face value', '2 = 2 pts, 10 = 10 pts'],
            ['Jack (J)', '11', 'Also has a special effect'],
            ['Queen (Q)', '12', 'Also has a special effect'],
          ]}
        />
      </DocSection>

      <DocSection title="Game Flow" icon={<RefreshCw className="h-6 w-6" />}>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 font-display text-base font-bold text-primary">1. Initial Look</h3>
            <p>
              At the start, you may peek at <strong>2 of your 4 cards</strong>. Memorize them —
              you won&apos;t see them again unless you use an effect card.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 font-display text-base font-bold text-primary">2. Your Turn</h3>
            <p className="mb-2">On your turn, <strong>draw a card</strong> from the draw pile. Then choose one action:</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li><strong>Swap</strong> — replace one of your hand cards with the drawn card</li>
              <li><strong>Discard</strong> — throw the drawn card onto the discard pile</li>
              <li><strong>Call KABOO</strong> — end the round (see below)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 font-display text-base font-bold text-primary">3. Effect Cards</h3>
            <p className="mb-2">When you discard certain cards, you may activate their special effect:</p>
            <DocTable
              headers={['Cards', 'Effect', 'Description']}
              rows={[
                ['7, 8', 'Peek Own', 'Look at one of your own hidden cards'],
                ['9, 10', 'Peek Opponent', 'Look at one of an opponent&apos;s cards'],
                ['Jack (J)', 'Blind Swap', 'Swap one of your cards with an opponent&apos;s card without looking'],
                ['Queen (Q)', 'Semi-Blind Swap', 'See one of your cards first, then optionally swap it with an opponent&apos;s card'],
              ]}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 font-display text-base font-bold text-primary">4. Tap Window</h3>
            <p>
              After a card is discarded, a brief <Badge>TAP</Badge> window opens. If you have a card
              with the <strong>same rank</strong> as the top discard, you can tap it to discard it
              for free — even on someone else&apos;s turn! If your tap is wrong, you draw a penalty card.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 font-display text-base font-bold text-primary">5. Calling KABOO</h3>
            <p>
              Instead of swapping or discarding, you can <strong>call KABOO</strong>. This triggers the
              final round — every other player gets one more turn, then all cards are revealed.
              If your total is the lowest, you score <strong>0 points</strong>. If not, you get your
              total <strong>plus a penalty</strong>.
            </p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Keyboard Shortcuts" icon={<Keyboard className="h-6 w-6" />}>
        <DocTable
          headers={['Key', 'Action']}
          rows={[
            ['D', 'Draw card'],
            ['X', 'Discard held card'],
            ['S', 'Swap held card with selected card'],
            ['K', 'Call KABOO'],
            ['E', 'End turn'],
            ['1 – 4', 'Select card 1–4 in your hand'],
            ['T', 'Tap (during tap window)'],
            ['Enter', 'Confirm'],
            ['Esc', 'Skip / Decline effect'],
          ]}
        />
        <p className="mt-2 text-muted-foreground">
          Keyboard shortcuts can be customized in the Settings menu (<Settings className="inline h-3 w-3" /> icon during gameplay).
        </p>
      </DocSection>

      <DocSection title="Sound & Settings" icon={<Volume2 className="h-6 w-6" />}>
        <ul className="list-inside list-disc space-y-1.5">
          <li>Master and SFX volume sliders in the Settings menu control overall and effect volume.</li>
          <li>Background music can be toggled on/off and you can choose between Kaboo 1 and Kaboo 2 tracks.</li>
          <li>Sound types (draw, swap, effects, tap, KABOO, background) can be toggled individually.</li>
          <li>Theme can be switched between Dark, Light, or System from the same Settings menu.</li>
        </ul>
      </DocSection>

      <DocSection title="Bot Difficulty" icon={<Bot className="h-6 w-6" />}>
        <DocTable
          headers={['Difficulty', 'Memory', 'Strategy']}
          rows={[
            ['Easy', 'Forgets cards often', 'Rarely uses effects, calls KABOO late'],
            ['Medium', 'Decent memory', 'Uses effects sometimes, balanced play'],
            ['Hard', 'Near-perfect memory', 'Optimal effect use, aggressive KABOO calls'],
          ]}
        />
      </DocSection>

      <DocSection title="Scoring" icon={<Trophy className="h-6 w-6" />}>
        <ul className="list-inside list-disc space-y-1.5">
          <li>Each card&apos;s value is summed for your total</li>
          <li>Kings are worth <strong>0 points</strong></li>
          <li>If you call KABOO and have the lowest score: <strong>0 points</strong></li>
          <li>If you call KABOO but don&apos;t have the lowest: your total <strong>+ penalty</strong></li>
          <li>The player with the lowest score across rounds wins</li>
        </ul>
      </DocSection>
    </div>
  );
}
