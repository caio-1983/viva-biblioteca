"use client";

export function BackgroundScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(ellipse at 42% 44%, #0D2340 0%, #071626 52%, #04101C 100%)",
        zIndex: 0,
      }}
    >
      {/* Desk surface glow — warm amber reflection below the book */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "15%",
          right: "15%",
          height: "28%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(16,32,56,0.7) 0%, transparent 70%)",
        }}
      />

      {/* Hard vignette at all four edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(3,8,15,0.72) 100%)",
        }}
      />

      {/* Subtle horizontal light band across center — desk lamp reflection */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: 0,
          right: 0,
          height: "30%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(13,30,52,0.15) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
