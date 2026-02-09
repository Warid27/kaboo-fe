# Card Design & Customization Guide

This guide explains how to update the visual design of the playing cards in Kaboo.

## 📁 Key Files

| Component | Path | Description |
|-----------|------|-------------|
| **PlayingCard** | [`src/components/game/PlayingCard.tsx`](../src/components/game/PlayingCard.tsx) | Main card component. Handles front face, sizing, animations, and interactions. |
| **CardBackPattern** | [`src/components/game/CardBackPattern.tsx`](../src/components/game/CardBackPattern.tsx) | The design rendered on the back of every card. |
| **Assets** | `src/assets/` | Directory for any image assets used in card designs. |

---

## 🎨 Updating the Front Design

The front face of the card is defined in `PlayingCard.tsx`.

### 1. Structure
The front face is a `div` containing the Rank (number/letter) and Suit Symbol.
```tsx
// Inside PlayingCard.tsx
<div className={cn('absolute inset-0 flex flex-col items-center ...')}>
  {/* Rank */}
  <span>{card.rank}</span>
  
  {/* Suit Symbol */}
  <span>{symbol}</span>
</div>
```

### 2. Colors
Colors are dynamic based on the suit:
- **Red Suits (♥ ♦):** Uses `text-[hsl(var(--suit-red))]`
- **Black Suits (♠ ♣):** Uses `text-background` (which usually resolves to dark/black in light mode)

To change these colors, update the conditional classes in `PlayingCard.tsx` or adjust the CSS variables in `src/index.css`.

### 3. Layout
To change the position of the rank and suit (e.g., to have small rank in corners):
1.  Open `PlayingCard.tsx`.
2.  Locate the "Front face" `div`.
3.  Update the Flexbox classes (currently `flex-col items-center justify-center` for centered design).

---

## 🃏 Updating the Back Design

The card back is a separate component to allow for complex patterns without cluttering the main logic.

### Modifying the Pattern
1.  Open `src/components/game/CardBackPattern.tsx`.
2.  Update the JSX return.
    *   **Current Design:** A minimal white rectangle with a centered "K".
    *   **To use an Image:**
        ```tsx
        export function CardBackPattern() {
          return (
            <div className="h-full w-full">
              <img src="/path/to/pattern.png" className="h-full w-full object-cover" />
            </div>
          );
        }
        ```
    *   **To use CSS Patterns:** Apply Tailwind classes for gradients or patterns.

---

## 📐 Sizing & Dimensions

Card sizes are controlled via the `size` prop and mapped to Tailwind classes in `PlayingCard.tsx`.

```tsx
const sizeClasses = {
  sm: 'h-12 w-8 md:h-16 md:w-11',           // Small (e.g., opponent hands)
  md: 'h-16 w-11 md:h-24 md:w-16',          // Standard (player hand)
  lg: 'h-24 w-16 md:h-32 md:w-[5.5rem]',    // Large (active/drawn card)
};
```

**To update sizes:**
1.  Modify the `sizeClasses` object in `PlayingCard.tsx`.
2.  Ensure you provide both mobile (default) and desktop (`md:`) classes for responsiveness.

---

## ✨ Animations

Cards use **Framer Motion** for flip animations and movement.

- **Flip Animation:** Controlled by `rotateY` in the `animate` prop.
  ```tsx
  animate={{ rotateY: showFace ? 0 : 180 }}
  ```
- **Entrance Animation:** Controlled by `initial` and `animate` props on the wrapper.
- **Hover Effects:** Controlled by `whileHover`.

To customize the spring physics (bounciness, speed), edit the configuration in `src/hooks/useAnimationConfig.ts`.
