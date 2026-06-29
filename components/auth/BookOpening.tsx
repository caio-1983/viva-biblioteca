"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BackgroundParticles } from "./BackgroundParticles";
import { BookPage } from "./BookPage";
import { LibraryScene } from "./LibraryScene";
import { LoginCard } from "./LoginCard";
import { bookEnterVariants } from "@/animations/bookOpening";
import { PAGE_FLIP_DURATION_MS } from "@/animations/pageFlip";

type Phase = "loading" | "cover" | "flipping" | "open";

const TIMINGS = {
  showCover: 80,
  startFlip: 580,
  openDelay: 580 + PAGE_FLIP_DURATION_MS + 80,
} as const;

// Variável de módulo: reseta no F5, persiste na navegação interna (SPA)
let bookAnimationPlayed = false;

export function BookOpening() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [skippedAnimation, setSkippedAnimation] = useState(false);

  useEffect(() => {
    if (bookAnimationPlayed) {
      setSkippedAnimation(true);
      setPhase("open");
      return;
    }
    bookAnimationPlayed = true;

    const t1 = setTimeout(() => setPhase("cover"), TIMINGS.showCover);
    const t2 = setTimeout(() => setPhase("flipping"), TIMINGS.startFlip);
    const t3 = setTimeout(() => setPhase("open"), TIMINGS.openDelay);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const isFlipping = phase === "flipping" || phase === "open";
  const isOpen = phase === "open";
  const showFinalLayout = isOpen || skippedAnimation;

  return (
    <div
      style={{
        minHeight: "100svh",
        background:
          "radial-gradient(ellipse at 38% 48%, #0D2340 0%, #08192B 45%, #05111F 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackgroundParticles />

      {/* ── Book container ── */}
      <motion.div
        variants={bookEnterVariants}
        initial="hidden"
        animate={phase !== "loading" ? "visible" : "hidden"}
        style={{
          position: "relative",
          width: "min(92vw, 1100px)",
          height: "min(82vh, 700px)",
          display: "flex",
          /*
           * Left edge flat (spine side), right edge rounded (cover side).
           * The inner pages inherit via overflow:hidden on each half.
           */
          borderRadius: "3px 10px 10px 3px",
          boxShadow: [
            "0 60px 150px rgba(0,0,0,0.85)",
            "0 30px 80px rgba(0,0,0,0.6)",
            "0 10px 30px rgba(0,0,0,0.4)",
            /* Simulate book thickness on the right edge */
            "4px 0 12px -2px rgba(0,0,0,0.5)",
          ].join(", "),
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* ════════════════════════════════════════
            LEFT PAGE
            LibraryScene is ALWAYS rendered here.
            During animation it sits under:
              a) a dark overlay (hides it)
              b) the BookPage element (z=10, covers left after flip)
            When isOpen: both overlays gone → LibraryScene shows cleanly.
            This avoids a flash when BookPage unmounts.
        ════════════════════════════════════════ */}
        <div
          className="viva-left-page"
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <LibraryScene />

          {/* Dark overlay: hides LibraryScene during animation */}
          {!showFinalLayout && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "#09192C",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Page curl shadow — near the spine, adds open-book depth */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "56px",
              background:
                "linear-gradient(to left, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.04) 60%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 3,
              opacity: showFinalLayout ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        </div>

        {/* ════════════════════════════════════════
            SPINE
            Flex item — visible once BookPage unmounts.
        ════════════════════════════════════════ */}
        <BookSpine />

        {/* ════════════════════════════════════════
            RIGHT PAGE
            Always has the parchment background.
            LoginCard mounts when the book is open.
        ════════════════════════════════════════ */}
        <div
          className="viva-right-page"
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "#F5F0E8",
          }}
        >
          <LoginCard visible={showFinalLayout} />

          {/* Page curl shadow — near the spine */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "56px",
              background:
                "linear-gradient(to right, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.04) 60%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 3,
              opacity: showFinalLayout ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        </div>

        {/* ════════════════════════════════════════
            BOOK PAGE (3D flip)
            Mounted only during the animation.
            Unmounts when isOpen → spine becomes visible
            between the two parchment pages.
        ════════════════════════════════════════ */}
        {!skippedAnimation && !isOpen && phase !== "loading" && (
          <BookPage animating={isFlipping} />
        )}
      </motion.div>
    </div>
  );
}

function BookSpine() {
  return (
    <div
      className="viva-book-spine"
      style={{
        width: "8px",
        flexShrink: 0,
        position: "relative",
        zIndex: 5,
        background:
          "linear-gradient(180deg, #040D18 0%, #0A1B2E 35%, #060F1C 65%, #040D18 100%)",
        boxShadow:
          "inset -2px 0 6px rgba(0,0,0,0.5), inset 2px 0 6px rgba(0,0,0,0.5)",
      }}
    >
      {/* Gold thread down the centre of the spine */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "6%",
          bottom: "6%",
          left: "50%",
          width: "1px",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(201,169,110,0.35) 10%, rgba(201,169,110,0.65) 50%, rgba(201,169,110,0.35) 90%, transparent 100%)",
        }}
      />
    </div>
  );
}
