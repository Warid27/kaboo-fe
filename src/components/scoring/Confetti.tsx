import { useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

const COLORS = [
  'hsl(174 80% 42%)',
  'hsl(270 60% 55%)',
  'hsl(25 90% 55%)',
  'hsl(330 80% 58%)',
  'hsl(45 90% 55%)',
  'hsl(200 80% 50%)',
];

export function Confetti() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1,
      delay: Math.random() * 2,
    }))
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: `${p.y}vh`,
            rotate: p.rotation,
            scale: p.scale,
            opacity: 1,
          }}
          animate={{
            y: '110vh',
            rotate: p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: p.delay,
            ease: 'easeIn',
          }}
          className="absolute h-3 w-2 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}
