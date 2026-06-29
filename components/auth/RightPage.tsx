"use client";

import { LoginForm } from "./LoginForm";

interface RightPageProps {
  showForm: boolean;
}

export function RightPage({ showForm }: RightPageProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(155deg, #F8F4ED 0%, #F2EDE4 55%, #EDE7DE 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ruled page lines — matches LeftPage texture */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 27px, rgba(139,125,107,0.09) 27px, rgba(139,125,107,0.09) 28px)",
          pointerEvents: "none",
        }}
      />

      {/* Right margin rule */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: "clamp(28px, 8%, 44px)",
          width: "1px",
          background: "rgba(185,120,100,0.18)",
        }}
      />

      {/* Top margin line */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "clamp(48px, 9%, 72px)",
          left: 0,
          right: 0,
          height: "1px",
          background: "rgba(201,169,110,0.18)",
        }}
      />

      {/* Page curl shadow at spine */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "52px",
          background:
            "linear-gradient(to right, rgba(0,0,0,0.13) 0%, rgba(0,0,0,0.04) 55%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 2,
          opacity: showForm ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Page number */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "1.1rem",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "0.64rem",
          color: "rgba(90,78,61,0.4)",
          fontFamily: "var(--font-serif, Georgia, serif)",
          letterSpacing: "0.06em",
        }}
      >
        1
      </div>

      {/* Form */}
      <LoginForm visible={showForm} />
    </div>
  );
}
