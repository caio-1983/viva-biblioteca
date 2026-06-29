"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BackgroundScene } from "./BackgroundScene";
import { DustParticles } from "./DustParticles";
import { LeftPage } from "./LeftPage";
import { RightPage } from "./RightPage";
import { PageFlip } from "./PageFlip";
import { bookAppearVariants } from "@/lib/animations/bookOpening";
import { phases } from "@/lib/animations/timing";

type Phase = "dark" | "appear" | "flipping" | "open";

// Module-level flag: resets on F5 (module re-evaluated), persists during SPA navigation
let bookAnimationPlayed = false;

export function BookExperience() {
  const [phase, setPhase] = useState<Phase>("dark");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (bookAnimationPlayed) {
      setSkipped(true);
      setPhase("open");
      return;
    }
    bookAnimationPlayed = true;

    const t1 = setTimeout(() => setPhase("appear"),   phases.appear);
    const t2 = setTimeout(() => setPhase("flipping"), phases.flipping);
    const t3 = setTimeout(() => setPhase("open"),     phases.open);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const isFlipping     = phase === "flipping" || phase === "open";
  const isOpen         = phase === "open";
  const showFinalLayout = isOpen || skipped;

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Environment */}
      <BackgroundScene />
      <DustParticles />

      {/* ── Book container ── */}
      <motion.div
        variants={bookAppearVariants}
        initial="hidden"
        animate={phase !== "dark" ? "visible" : "hidden"}
        style={{
          position: "relative",
          width: "min(94vw, 1100px)",
          height: "min(84vh, 700px)",
          display: "flex",
          zIndex: 1,
          /* Left: flat spine edge. Right: slightly rounded cover edge. */
          borderRadius: "3px 10px 10px 3px",
          boxShadow: [
            "0 70px 160px rgba(0,0,0,0.88)",
            "0 30px 80px rgba(0,0,0,0.55)",
            "0 10px 28px rgba(0,0,0,0.38)",
          ].join(", "),
          overflow: "hidden",
        }}
      >
        {/* ══════════════════════════════════════
            LEFT PAGE
            LeftPage is always mounted.
            During animation it's hidden under:
              1. A dark overlay (below)
              2. The PageFlip's back-face (same content, no flash on unmount)
            On showFinalLayout: both go away atomically.
        ══════════════════════════════════════ */}
        <div
          className="viva-left-page"
          style={{ flex: 1, position: "relative", overflow: "hidden" }}
        >
          <LeftPage />

          {/* Dark overlay — hides LeftPage while book is "closed" */}
          {!showFinalLayout && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: "#071626",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Page-curl shadow near spine — appears once open */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "52px",
              background:
                "linear-gradient(to left, rgba(0,0,0,0.13) 0%, rgba(0,0,0,0.04) 55%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 3,
              opacity: showFinalLayout ? 1 : 0,
              transition: "opacity 0.35s ease",
            }}
          />
        </div>

        {/* ══════════════════════════════════════
            SPINE
            Flex item — always between the two pages.
            During animation it's covered by PageFlip (z=10).
        ══════════════════════════════════════ */}
        <BookSpine />

        {/* ══════════════════════════════════════
            RIGHT PAGE
            RightPage shows the LoginForm.
            Always mounted; form animates in via stagger.
        ══════════════════════════════════════ */}
        <div
          className="viva-right-page"
          style={{ flex: 1, position: "relative", overflow: "hidden" }}
        >
          <RightPage showForm={showFinalLayout} />
        </div>

        {/* ══════════════════════════════════════
            PAGE FLIP (3-D flip element)
            Mounted only during animation.
            On isOpen: unmounts → spine becomes visible.
            Left div's LeftPage is identical to PageFlip's
            back-face, so there is no visual flash.
        ══════════════════════════════════════ */}
        {!skipped && !isOpen && phase !== "dark" && (
          <PageFlip animating={isFlipping} />
        )}

        {/* Ambient glow under book — desk lamp reflection */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-30px",
            left: "10%",
            right: "10%",
            height: "30px",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(13,35,64,0.5) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      </motion.div>
    </div>
  );
}

// ── Book spine ─────────────────────────────────────────────────────────────
function BookSpine() {
  return (
    <div
      className="viva-book-spine"
      style={{
        width: "9px",
        flexShrink: 0,
        position: "relative",
        zIndex: 5,
        background:
          "linear-gradient(180deg, #030C17 0%, #091728 35%, #060E1B 65%, #030C17 100%)",
        boxShadow:
          "inset -2px 0 8px rgba(0,0,0,0.55), inset 2px 0 8px rgba(0,0,0,0.55)",
      }}
    >
      {/* Gold thread */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "5%",
          bottom: "5%",
          left: "50%",
          width: "1px",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(201,169,110,0.3) 10%, rgba(201,169,110,0.6) 50%, rgba(201,169,110,0.3) 90%, transparent 100%)",
        }}
      />
    </div>
  );
}
