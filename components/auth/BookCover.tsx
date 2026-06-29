"use client";

import { Logo } from "./Logo";

/**
 * Visual design of the closed book cover.
 * Rendered as the front face of the PageFlip element.
 * No animation logic here — PageFlip handles that.
 */
export function BookCover() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "radial-gradient(ellipse at 38% 38%, #112B4A 0%, #0B1E36 55%, #071626 100%)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Vertical grain texture */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Diagonal gloss — suggests embossed linen cover texture */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(128deg, rgba(255,255,255,0.04) 0%, transparent 45%, rgba(0,0,0,0.08) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Inner border */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "2rem",
          border: "1px solid rgba(201,169,110,0.15)",
          borderRadius: "2px",
          pointerEvents: "none",
        }}
      />

      {/* Double inner border (classical book detail) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "2.35rem",
          border: "0.5px solid rgba(201,169,110,0.08)",
          borderRadius: "1px",
          pointerEvents: "none",
        }}
      />

      {/* Corner ornaments */}
      <CornerOrnaments />

      {/* Logo — centered, not animated (cover is already visible at mount) */}
      <div style={{ position: "relative", zIndex: 1, width: "min(240px, 70%)" }}>
        <Logo animated={false} variant="light" />
      </div>

      {/* Bottom gilded-edge strip */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.42) 25%, rgba(201,169,110,0.65) 50%, rgba(201,169,110,0.42) 75%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Spine shadow at left edge (suggests book spine is to the left) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "18px",
          background:
            "linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 60%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Right-edge page-stack shadow — simulates many pages inside */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "2%",
          right: "-1px",
          bottom: "2%",
          width: "7px",
          background:
            "linear-gradient(180deg, #E8E2D8, #D8D0C4, #E8E2D8, #D0C8BC, #E8E2D8)",
          boxShadow: "1px 0 3px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}

function CornerOrnaments() {
  const d = 22;

  const corners: Array<{ style: React.CSSProperties; path: string }> = [
    {
      style: { top: "1.6rem", left: "1.6rem" },
      path: `M1 ${d - 1}V1H${d - 1}`,
    },
    {
      style: { top: "1.6rem", right: "1.6rem" },
      path: `M${d - 1} ${d - 1}V1H1`,
    },
    {
      style: { bottom: "1.6rem", left: "1.6rem" },
      path: `M1 1V${d - 1}H${d - 1}`,
    },
    {
      style: { bottom: "1.6rem", right: "1.6rem" },
      path: `M${d - 1} 1V${d - 1}H1`,
    },
  ];

  return (
    <>
      {corners.map((c, i) => (
        <svg
          key={i}
          style={{ position: "absolute", width: d, height: d, opacity: 0.32, ...c.style }}
          viewBox={`0 0 ${d} ${d}`}
          fill="none"
          aria-hidden
        >
          <path d={c.path} stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" />
          {/* Small diamond at elbow */}
          {i === 0 && <circle cx="1" cy="1" r="1.2" fill="#C9A96E" opacity="0.5" />}
        </svg>
      ))}
    </>
  );
}
