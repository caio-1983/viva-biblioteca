"use client";

// Deterministic positions — no Math.random() to avoid SSR hydration mismatch
const PARTICLES = [
  { x: 7,  y: 11, size: 1.8, delay: 0,   dur: 5.2 },
  { x: 21, y: 34, size: 2.2, delay: 0.8, dur: 6.8 },
  { x: 44, y: 7,  size: 1.4, delay: 1.5, dur: 4.9 },
  { x: 67, y: 24, size: 2.6, delay: 0.3, dur: 7.1 },
  { x: 79, y: 61, size: 1.6, delay: 2.1, dur: 5.5 },
  { x: 14, y: 73, size: 2.0, delay: 1.2, dur: 6.2 },
  { x: 91, y: 17, size: 1.2, delay: 3.4, dur: 4.7 },
  { x: 33, y: 89, size: 2.4, delay: 0.6, dur: 7.8 },
  { x: 55, y: 46, size: 1.8, delay: 2.8, dur: 5.9 },
  { x: 83, y: 79, size: 1.4, delay: 1.7, dur: 6.3 },
  { x: 3,  y: 53, size: 2.0, delay: 3.9, dur: 5.1 },
  { x: 72, y: 40, size: 1.6, delay: 0.4, dur: 7.4 },
  { x: 28, y: 67, size: 2.8, delay: 2.5, dur: 6.0 },
  { x: 57, y: 14, size: 1.2, delay: 1.0, dur: 4.8 },
  { x: 95, y: 56, size: 2.2, delay: 3.1, dur: 7.2 },
  { x: 41, y: 91, size: 1.6, delay: 0.9, dur: 5.6 },
  { x: 12, y: 29, size: 2.4, delay: 4.2, dur: 6.9 },
  { x: 87, y: 76, size: 1.8, delay: 1.8, dur: 5.3 },
  { x: 63, y: 4,  size: 2.0, delay: 2.7, dur: 7.0 },
  { x: 38, y: 51, size: 1.4, delay: 3.6, dur: 4.5 },
] as const;

export function DustParticles() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: `rgba(201,169,110,${0.18 + (i % 4) * 0.07})`,
            animation: `viva-particle-float ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
