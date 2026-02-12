# Kaboo Game Rules

## Objective
The goal is to have the lowest total score when the round ends. Players start with 4 cards face-down and try to improve their hand by swapping for lower-value cards.

## Setup
- **Deck:** 54-card deck (Standard 52 + 2 Jokers).
- **Deal:** Each player receives 4 cards face-down.
- **Initial Look:** At the start, players may peek at 2 of their own cards.

## Card Values
| Card | Value | Notes |
|------|-------|-------|
| **Red King, Queen, Jack** (Hearts/Diamonds) | **0** | **Best cards** |
| **Black King** (Spades/Clubs) | 13 | High value |
| **Black Queen** (Spades/Clubs) | 12 | |
| **Black Jack** (Spades/Clubs) | 11 | |
| **Ace** | 1 | |
| **2 - 10** | Face Value | 2 = 2pts, etc. |
| **Jokers** | -1 | Lowest possible score is -2 (2 Jokers) |

## Game Flow
On your turn, you draw a card from the deck or discard pile.
If the **Deck** is exhausted, the game ends immediately (Auto-Kaboo). No reshuffling occurs.

Then you must choose one action:

1.  **Swap:** Replace one of your face-down cards with the drawn card. The replaced card is discarded.
2.  **Discard:** Place the drawn card on the discard pile. If the card has an **Effect**, you may use it.
3.  **Call KABOO:** Instead of drawing/swapping, you can end the round.

### Special Action: Snap (Tap)
After any player discards a card, a brief window opens.
- Any player (even out of turn) can "Snap" if they have a card in their hand that **matches the rank** of the top discard.
- **Success:** The matching card is discarded for free (reducing hand size).
- **Failure:** If the card does not match, the player draws a **Penalty Card**.

### Special Action: Matt's Pairs Rule
*Optional House Rule*
If enabled, during your action phase, if you have a pair of cards with the **same rank** in your hand, you may discard both.

## Card Effects
Triggered whenever a specific card is moved to the **discard pile** (whether by discarding the drawn card or by swapping it with a card from your hand).

| Rank | Effect Name | Description |
|------|-------------|-------------|
| **7, 8** | Peek Own | Look at one of your own hidden cards. |
| **9, 10** | Peek Opponent | Look at one of an opponent's hidden cards. |
| **Jack** | Blind Swap | Swap any two cards on the table (your own or opponents') without looking at them. |
| **Queen** | Semi-Blind Swap | Look at an opponent's card, then decide whether to swap it with one of your cards. |
| **King** | Full Vision Swap | Look at two cards (any combination), then decide whether to swap them. |

*Note: While Red Royals (J/Q/K) are worth 0 points, they still carry their Rank effects when discarded. However, players usually prefer to keep them for the 0 score rather than discard them for the effect.*

## Calling Kaboo & Scoring
A player can "Call Kaboo" at the start of their turn.
- The round enters the **Final Phase**.
- Every *other* player gets exactly one more turn.
- All cards are revealed and scores are calculated.

### Scoring Logic
1.  **Sum:** Calculate total value of cards in hand.
2.  **Kaboo Bonus/Penalty:**
    - If the Caller has the **strictly lowest** score:
        - Caller Score = Sum of Cards. (Winning condition)
    - If the Caller **does not** have the lowest score (tied or higher):
        - Caller Score = Sum of Cards + **Penalty** (e.g., +20 points).
