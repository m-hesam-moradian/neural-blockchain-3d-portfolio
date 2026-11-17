import React, { useEffect, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*+<>_';

interface ScrambleTextProps {
  text: string;
  className?: string;
  durationMs?: number;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  className = '',
  durationMs = 420,
}) => {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplay(text);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const revealed = Math.floor(progress * text.length);

      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ' || ch === '/' || ch === '·' || ch === ':') {
          out += ch;
        } else if (i < revealed) {
          out += ch;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setDisplay(out);

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setDisplay(text);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, durationMs]);

  return <span className={className}>{display}</span>;
};
