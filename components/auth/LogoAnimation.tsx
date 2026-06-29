"use client";

import { motion } from "framer-motion";
import { coverGoldLineVariants, coverTextVariants } from "@/animations/bookOpening";

interface LogoAnimationProps {
  animate?: boolean;
}

export function LogoAnimation({ animate = true }: LogoAnimationProps) {
  return (
    <div
      style={{
        textAlign: "center",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Open book SVG icon */}
      <motion.div
        custom={0}
        variants={coverTextVariants}
        initial={animate ? "hidden" : "visible"}
        animate="visible"
        style={{ marginBottom: "1.4rem" }}
      >
        <svg
          width="52"
          height="46"
          viewBox="0 0 52 46"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6C3 4.9 3.9 4 5 4H23C24.1 4 25 4.9 25 6V42C25 43.1 24.1 44 23 44H5C3.9 44 3 43.1 3 42V6Z"
            stroke="#C9A96E"
            strokeWidth="1.2"
            fill="rgba(201,169,110,0.07)"
          />
          <path
            d="M49 6C49 4.9 48.1 4 47 4H29C27.9 4 27 4.9 27 6V42C27 43.1 27.9 44 29 44H47C48.1 44 49 43.1 49 42V6Z"
            stroke="#C9A96E"
            strokeWidth="1.2"
            fill="rgba(201,169,110,0.07)"
          />
          <line x1="26" y1="5" x2="26" y2="43" stroke="#C9A96E" strokeWidth="1.6" />
          <line x1="7" y1="14" x2="21" y2="14" stroke="#C9A96E" strokeWidth="0.6" opacity="0.55" />
          <line x1="7" y1="18" x2="21" y2="18" stroke="#C9A96E" strokeWidth="0.6" opacity="0.55" />
          <line x1="7" y1="22" x2="21" y2="22" stroke="#C9A96E" strokeWidth="0.6" opacity="0.35" />
          <line x1="7" y1="26" x2="17" y2="26" stroke="#C9A96E" strokeWidth="0.6" opacity="0.25" />
          <line x1="31" y1="14" x2="45" y2="14" stroke="#C9A96E" strokeWidth="0.6" opacity="0.55" />
          <line x1="31" y1="18" x2="45" y2="18" stroke="#C9A96E" strokeWidth="0.6" opacity="0.55" />
          <line x1="31" y1="22" x2="45" y2="22" stroke="#C9A96E" strokeWidth="0.6" opacity="0.35" />
          <line x1="31" y1="26" x2="41" y2="26" stroke="#C9A96E" strokeWidth="0.6" opacity="0.25" />
        </svg>
      </motion.div>

      {/* Gold top line */}
      <motion.div
        variants={coverGoldLineVariants}
        initial={animate ? "hidden" : "visible"}
        animate="visible"
        style={{
          height: "1px",
          width: "100%",
          background: "linear-gradient(90deg, transparent 0%, #C9A96E 50%, transparent 100%)",
          marginBottom: "1rem",
          transformOrigin: "center",
        }}
      />

      {/* VIVA */}
      <motion.p
        custom={0}
        variants={coverTextVariants}
        initial={animate ? "hidden" : "visible"}
        animate="visible"
        style={{
          color: "#C9A96E",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.48em",
          margin: "0 0 0.3rem",
          fontFamily: "var(--font-sans, sans-serif)",
        }}
      >
        VIVA
      </motion.p>

      {/* Biblioteca */}
      <motion.h1
        custom={1}
        variants={coverTextVariants}
        initial={animate ? "hidden" : "visible"}
        animate="visible"
        style={{
          color: "#E8E4DC",
          fontSize: "clamp(1.3rem, 3vw, 1.65rem)",
          fontWeight: 700,
          fontFamily: "var(--font-display, sans-serif)",
          letterSpacing: "-0.015em",
          margin: 0,
        }}
      >
        Biblioteca
      </motion.h1>

      {/* Gold bottom line */}
      <motion.div
        variants={coverGoldLineVariants}
        initial={animate ? "hidden" : "visible"}
        animate="visible"
        style={{
          height: "1px",
          width: "100%",
          background: "linear-gradient(90deg, transparent 0%, #C9A96E 50%, transparent 100%)",
          marginTop: "1rem",
          transformOrigin: "center",
        }}
      />
    </div>
  );
}
