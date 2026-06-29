"use client";

import { motion } from "framer-motion";
import { LibraryScene } from "./LibraryScene";
import { LogoAnimation } from "./LogoAnimation";
import type { CSSProperties } from "react";
import { pageFlipTransition } from "@/animations/pageFlip";

interface BookPageProps {
  animating: boolean;
}

export function BookPage({ animating }: BookPageProps) {
  return (
    /*
     * Perspective wrapper — full book dimensions, overlays right half.
     * Perspective origin at 0% (left edge of wrapper = center of book)
     * so the vanishing point aligns with the spine during the flip.
     */
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        width: "50%",
        height: "100%",
        perspective: "2200px",
        perspectiveOrigin: "0% 50%",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transformOrigin: "left center",
          position: "relative",
        }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: animating ? -180 : 0 }}
        transition={pageFlipTransition}
      >
        {/* ── FRONT FACE: Book cover ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background:
              "radial-gradient(ellipse at 40% 35%, #0F2845 0%, #0B1E36 60%, #08172C 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Subtle vertical grain lines on cover */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)",
              pointerEvents: "none",
            }}
          />

          {/* Inner decorative border */}
          <div
            style={{
              position: "absolute",
              inset: "2rem",
              border: "1px solid rgba(201,169,110,0.18)",
              borderRadius: "2px",
              pointerEvents: "none",
            }}
          />

          {/* Corner ornaments */}
          <CoverCorners />

          {/* Logo */}
          <div style={{ width: "min(280px, 75%)", zIndex: 1 }}>
            <LogoAnimation animate={false} />
          </div>

          {/* Bottom edge gold strip (mimics gilded page edges) */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "3px",
              background:
                "linear-gradient(90deg, transparent, rgba(201,169,110,0.5) 30%, rgba(201,169,110,0.7) 50%, rgba(201,169,110,0.5) 70%, transparent)",
            }}
          />
        </div>

        {/* ── BACK FACE: Library scene ── */}
        {/*
         * Pre-rotated 180° so it reads correctly when flipped.
         * After the page rotates -180°, this face points toward the viewer.
         */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <LibraryScene />
        </div>
      </motion.div>

      {/* Page curl shadow — fades in and out mid-flip */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none",
          zIndex: 11,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: animating ? [0, 0.9, 0] : 0,
        }}
        transition={{
          duration: pageFlipTransition.duration as number,
          delay: pageFlipTransition.delay as number,
          times: [0, 0.45, 1],
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function CoverCorners() {
  const size = 20;
  const cornerStyle: CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    opacity: 0.35,
  };

  return (
    <>
      {/* Top-left */}
      <svg
        style={{ ...cornerStyle, top: "1.8rem", left: "1.8rem" }}
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d="M1 19V1H19" stroke="#C9A96E" strokeWidth="1.2" />
      </svg>
      {/* Top-right */}
      <svg
        style={{ ...cornerStyle, top: "1.8rem", right: "1.8rem" }}
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d="M19 19V1H1" stroke="#C9A96E" strokeWidth="1.2" />
      </svg>
      {/* Bottom-left */}
      <svg
        style={{ ...cornerStyle, bottom: "1.8rem", left: "1.8rem" }}
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d="M1 1V19H19" stroke="#C9A96E" strokeWidth="1.2" />
      </svg>
      {/* Bottom-right */}
      <svg
        style={{ ...cornerStyle, bottom: "1.8rem", right: "1.8rem" }}
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d="M19 1V19H1" stroke="#C9A96E" strokeWidth="1.2" />
      </svg>
    </>
  );
}
