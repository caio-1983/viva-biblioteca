"use client";

export function LeftPage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(155deg, #F9F5EE 0%, #F3EDE4 55%, #EDE7DE 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ruled page lines */}
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

      {/* Red margin rule — classical notebook left margin */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "clamp(28px, 8%, 44px)",
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

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(1.5rem, 6%, 2.8rem)",
          gap: "clamp(1rem, 3vh, 1.8rem)",
        }}
      >
        {/* Logo */}
        <img
          src="/logo.png"
          alt="VIVA Biblioteca"
          style={{
            width: "min(220px, 72%)",
            height: "auto",
            objectFit: "contain",
          }}
        />

        {/* Divider */}
        <div
          aria-hidden
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            width: "min(240px, 80%)",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "rgba(201,169,110,0.3)" }} />
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              border: "1px solid rgba(201,169,110,0.45)",
            }}
          />
          <div style={{ flex: 1, height: "1px", background: "rgba(201,169,110,0.3)" }} />
        </div>

        {/* Quote block */}
        <blockquote
          style={{
            margin: 0,
            textAlign: "center",
            maxWidth: "280px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "clamp(0.76rem, 1.4vw, 0.9rem)",
              fontStyle: "italic",
              color: "#4A3F32",
              lineHeight: 1.75,
              margin: "0 0 0.7rem",
            }}
          >
            "O paraíso, sob alguma forma, deve ser uma espécie de biblioteca."
          </p>
          <cite
            style={{
              display: "block",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: "0.58rem",
              letterSpacing: "0.22em",
              color: "#C9A96E",
              fontWeight: 600,
              fontStyle: "normal",
            }}
          >
            — JORGE LUIS BORGES
          </cite>
        </blockquote>
      </div>

      {/* Page number — bottom center */}
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
        i
      </div>
    </div>
  );
}
