"use client";

import { motion } from "framer-motion";
import { BookCover } from "./BookCover";
import { LeftPage } from "./LeftPage";
import { coverFlipTransition, pageShadowTransition, COVER_FLIP_DURATION_MS } from "@/lib/animations/pageFlip";

interface PageFlipProps {
  animating: boolean;
}

/**
 * 3D page-flip element that sweeps from right to left.
 *
 * Geometry:
 *   - Positioned at left:50%, width:50% — covers only the right (login) half.
 *   - perspective-origin at 0% 50% aligns the vanishing point with the book spine.
 *   - rotate-origin at "left center" → the rotation axis IS the spine.
 *   - rotateY: 0 → -180deg sweeps the cover over to the left page area.
 *   - Front face: <BookCover />  (shown before flip)
 *   - Back face:  <LeftPage />   (shown after flip, matching the left div behind)
 */
export function PageFlip({ animating }: PageFlipProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        width: "50%",
        height: "100%",
        perspective: "2000px",
        perspectiveOrigin: "0% 50%",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {/* ── Rotating page ── */}
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
        transition={coverFlipTransition}
      >
        {/* FRONT: Book cover (visible before flip) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <BookCover />
        </div>

        {/* BACK: Library scene (visible after flip — matches left div content seamlessly) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <LeftPage />
        </div>

        {/* Leading-edge glow — white-hot highlight on the page's right edge during sweep */}
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "8px",
            background:
              "linear-gradient(to left, rgba(255,255,255,0.28) 0%, transparent 100%)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: animating ? [0, 1, 0] : 0 }}
          transition={{
            duration: COVER_FLIP_DURATION_MS / 1000,
            ease: "easeInOut",
            times: [0, 0.35, 1],
          }}
        />
      </motion.div>

      {/* ── Page-curl shadow ── sweeps across the desk surface during flip */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.28) 100%)",
          pointerEvents: "none",
          zIndex: 11,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: animating ? [0, 1, 0] : 0 }}
        transition={pageShadowTransition}
      />
    </div>
  );
}
