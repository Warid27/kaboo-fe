import cardBack from '@/assets/card-back.png';

/**
 * Card back using an image asset.
 */
export function CardBackPattern({ className }: { className?: string }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded bg-foreground ${className ?? ''}`}
    >
      <img 
        src={cardBack.src} 
        alt="Card Back" 
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
