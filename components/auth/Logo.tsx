"use client";

import { motion } from "framer-motion";
import { goldLineVariants, coverTextVariants } from "@/lib/animations/bookOpening";

interface LogoProps {
  /** When true, uses Framer Motion entrance animations */
  animated?: boolean;
  /** "light" = gold on dark (book cover). "dark" = navy on parchment (form header) */
  variant?: "light" | "dark";
}

export function Logo({ animated = false, variant = "light" }: LogoProps) {
  const isLight = variant === "light";
  const gold = isLight ? "#C9A96E" : "#B08A4E";
  const goldDim = isLight ? "rgba(201,169,110,0.65)" : "rgba(176,138,78,0.7)";
  const textColor = isLight ? "#C9A96E" : "#1D2E40";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.42rem",
      }}
    >
      {/* Top gold rule */}
      <motion.div
        variants={goldLineVariants}
        initial={animated ? "hidden" : false}
        animate="visible"
        aria-hidden
        style={{
          height: "1px",
          width: "64px",
          background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
        }}
      />

      {/* Open-book SVG icon */}
      <motion.div
        variants={coverTextVariants}
        custom={0}
        initial={animated ? "hidden" : false}
        animate="visible"
      >
        <svg
          width="42"
          height="28"
          viewBox="0 0 42 28"
          fill="none"
          aria-label="VIVA Biblioteca"
        >
          {/* Left half */}
          <path
            d="M21 5C21 5 15 3 7 3C5.3 3 4 4.3 4 6V22C4 23.7 5.3 25 7 25C15 25 21 23 21 23"
            stroke={gold}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Right half */}
          <path
            d="M21 5C21 5 27 3 35 3C36.7 3 38 4.3 38 6V22C38 23.7 36.7 25 35 25C27 25 21 23 21 23"
            stroke={gold}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Spine */}
          <line x1="21" y1="5" x2="21" y2="23" stroke={gold} strokeWidth="1" opacity="0.55" />
          {/* Left page lines */}
          <line x1="9" y1="11" x2="18" y2="11" stroke={gold} strokeWidth="0.7" opacity="0.4" />
          <line x1="9" y1="15" x2="17" y2="15" stroke={gold} strokeWidth="0.7" opacity="0.3" />
          {/* Right page lines */}
          <line x1="24" y1="11" x2="33" y2="11" stroke={gold} strokeWidth="0.7" opacity="0.4" />
          <line x1="24" y1="15" x2="31" y2="15" stroke={gold} strokeWidth="0.7" opacity="0.3" />
        </svg>
      </motion.div>

      {/* VIVA */}
      <motion.p
        variants={coverTextVariants}
        custom={1}
        initial={animated ? "hidden" : false}
        animate="visible"
        style={{
          fontSize: "1.65rem",
          fontWeight: 200,
          letterSpacing: "0.55em",
          color: textColor,
          margin: 0,
          lineHeight: 1,
          fontFamily: "var(--font-sans, sans-serif)",
          paddingLeft: "0.55em", // optical centering with letter-spacing
        }}
      >
        VIVA
      </motion.p>

      {/* Bottom gold rule */}
      <motion.div
        variants={goldLineVariants}
        initial={animated ? "hidden" : false}
        animate="visible"
        aria-hidden
        style={{
          height: "1px",
          width: "48px",
          background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
        }}
      />

      {/* BIBLIOTECA */}
      <motion.p
        variants={coverTextVariants}
        custom={2}
        initial={animated ? "hidden" : false}
        animate="visible"
        style={{
          fontSize: "0.56rem",
          fontWeight: 600,
          letterSpacing: "0.38em",
          color: goldDim,
          margin: 0,
          lineHeight: 1,
          fontFamily: "var(--font-sans, sans-serif)",
          paddingLeft: "0.38em",
        }}
      >
        BIBLIOTECA
      </motion.p>
    </div>
  );
}
