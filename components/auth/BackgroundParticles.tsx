"use client";

const PARTICLES = [
  { left: 7, top: 14, size: 1.5, delay: 0, duration: 20, opacity: 0.28 },
  { left: 17, top: 43, size: 1, delay: 2.5, duration: 25, opacity: 0.22 },
  { left: 27, top: 68, size: 2, delay: 5, duration: 18, opacity: 0.18 },
  { left: 37, top: 29, size: 1, delay: 1, duration: 22, opacity: 0.28 },
  { left: 51, top: 79, size: 1.5, delay: 3.5, duration: 28, opacity: 0.18 },
  { left: 61, top: 19, size: 1, delay: 7, duration: 20, opacity: 0.22 },
  { left: 71, top: 53, size: 2, delay: 1.5, duration: 24, opacity: 0.16 },
  { left: 81, top: 38, size: 1, delay: 4, duration: 19, opacity: 0.28 },
  { left: 89, top: 73, size: 1.5, delay: 6, duration: 22, opacity: 0.22 },
  { left: 94, top: 9, size: 1, delay: 2, duration: 26, opacity: 0.18 },
  { left: 4, top: 87, size: 1, delay: 8, duration: 21, opacity: 0.25 },
  { left: 44, top: 11, size: 2, delay: 9, duration: 23, opacity: 0.16 },
  { left: 54, top: 63, size: 1, delay: 0.5, duration: 27, opacity: 0.22 },
  { left: 74, top: 89, size: 1.5, delay: 11, duration: 20, opacity: 0.18 },
  { left: 22, top: 24, size: 1, delay: 13, duration: 24, opacity: 0.28 },
  { left: 33, top: 56, size: 1.5, delay: 3, duration: 19, opacity: 0.18 },
  { left: 64, top: 77, size: 1, delay: 10, duration: 22, opacity: 0.22 },
  { left: 83, top: 21, size: 2, delay: 7.5, duration: 26, opacity: 0.16 },
];

export function BackgroundParticles() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: "#C9A96E",
            opacity: p.opacity,
            animation: `viva-particle-float ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
