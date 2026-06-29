export function LibraryScene() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #F5F0E8 0%, #EDE8DF 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(1.4rem, 4vw, 3rem) clamp(1.4rem, 4vw, 3.5rem)",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle ruled-page texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 31px, rgba(139,125,107,0.08) 31px, rgba(139,125,107,0.08) 32px)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ position: "relative" }}>
        <p
          style={{
            color: "#C9A96E",
            fontSize: "0.58rem",
            letterSpacing: "0.38em",
            fontWeight: 700,
            margin: 0,
            fontFamily: "var(--font-sans, sans-serif)",
          }}
        >
          VIVA BIBLIOTECA
        </p>
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, #C9A96E 0%, rgba(201,169,110,0.15) 100%)",
            marginTop: "0.65rem",
          }}
        />
      </div>

      {/* Bookshelf illustration */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <BookshelfIllustration />
      </div>

      {/* Literary quote */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(201,169,110,0.15) 0%, #C9A96E 100%)",
            marginBottom: "1.2rem",
          }}
        />
        <blockquote
          style={{
            color: "#2C2018",
            fontSize: "clamp(0.78rem, 1.8vw, 0.92rem)",
            fontStyle: "italic",
            lineHeight: 1.75,
            margin: 0,
            fontFamily: "var(--font-serif, Georgia, 'Times New Roman', serif)",
          }}
        >
          "Um livro é um sonho que você segura nas mãos."
        </blockquote>
        <p
          style={{
            color: "#8B7D6B",
            fontSize: "0.7rem",
            marginTop: "0.6rem",
            marginBottom: 0,
            letterSpacing: "0.04em",
            fontFamily: "var(--font-sans, sans-serif)",
          }}
        >
          — Neil Gaiman
        </p>
      </div>
    </div>
  );
}

function BookshelfIllustration() {
  return (
    <svg
      width="230"
      height="176"
      viewBox="0 0 230 176"
      fill="none"
      aria-hidden="true"
      style={{ opacity: 0.82, maxWidth: "100%", maxHeight: "100%" }}
    >
      {/* Room walls — subtle */}
      <rect
        x="12"
        y="8"
        width="206"
        height="160"
        rx="2"
        fill="none"
        stroke="rgba(44,32,24,0.07)"
        strokeWidth="1"
      />

      {/* ── Shelf planks ── */}
      <rect x="12" y="80" width="206" height="4.5" rx="1" fill="#8B7D6B" opacity="0.22" />
      <rect x="12" y="143" width="206" height="4.5" rx="1" fill="#8B7D6B" opacity="0.22" />

      {/* ── TOP SHELF BOOKS ── */}
      <rect x="20" y="52" width="14" height="28" rx="1.5" fill="#0D2340" />
      <line x1="21" y1="59" x2="33" y2="59" stroke="#C9A96E" strokeWidth="0.6" opacity="0.5" />
      <rect x="36" y="55" width="11" height="25" rx="1.5" fill="#7B5E3A" />
      <rect x="49" y="49" width="15" height="31" rx="1.5" fill="#1a3a5e" />
      <line x1="50" y1="57" x2="63" y2="57" stroke="#C9A96E" strokeWidth="0.6" opacity="0.4" />
      <rect x="66" y="56" width="10" height="24" rx="1.5" fill="#2C5F4A" />
      <rect x="78" y="52" width="13" height="28" rx="1.5" fill="#8B4513" />
      <rect x="93" y="50" width="14" height="30" rx="1.5" fill="#0D2340" opacity="0.6" />
      <rect x="109" y="57" width="10" height="23" rx="1.5" fill="#5B3A6E" />
      <rect x="121" y="53" width="13" height="27" rx="1.5" fill="#7B5E3A" opacity="0.85" />
      <rect x="136" y="48" width="16" height="32" rx="1.5" fill="#0D2340" opacity="0.5" />
      <line x1="137" y1="56" x2="151" y2="56" stroke="#C9A96E" strokeWidth="0.6" opacity="0.35" />
      <rect x="154" y="54" width="12" height="26" rx="1.5" fill="#1a3a5e" opacity="0.8" />
      <rect x="168" y="51" width="13" height="29" rx="1.5" fill="#8B4513" opacity="0.65" />
      <rect x="183" y="55" width="11" height="25" rx="1.5" fill="#2C5F4A" opacity="0.7" />
      <rect x="196" y="58" width="8" height="22" rx="1.5" fill="#5B3A6E" opacity="0.55" />

      {/* ── BOTTOM SHELF BOOKS ── */}
      <rect x="20" y="108" width="16" height="35" rx="1.5" fill="#1a3a5e" />
      <line x1="21" y1="116" x2="35" y2="116" stroke="#C9A96E" strokeWidth="0.6" opacity="0.45" />
      <rect x="38" y="111" width="12" height="32" rx="1.5" fill="#7B5E3A" opacity="0.9" />
      <rect x="52" y="105" width="15" height="38" rx="1.5" fill="#0D2340" />
      <line x1="53" y1="114" x2="66" y2="114" stroke="#C9A96E" strokeWidth="0.6" opacity="0.5" />
      <rect x="69" y="110" width="11" height="33" rx="1.5" fill="#2C5F4A" opacity="0.8" />
      <rect x="82" y="108" width="14" height="35" rx="1.5" fill="#8B4513" opacity="0.75" />
      <rect x="98" y="106" width="12" height="37" rx="1.5" fill="#0D2340" opacity="0.55" />
      <rect x="112" y="110" width="10" height="33" rx="1.5" fill="#5B3A6E" opacity="0.8" />
      <rect x="124" y="108" width="15" height="35" rx="1.5" fill="#7B5E3A" opacity="0.7" />
      <rect x="141" y="106" width="13" height="37" rx="1.5" fill="#1a3a5e" opacity="0.75" />
      <line x1="142" y1="115" x2="153" y2="115" stroke="#C9A96E" strokeWidth="0.6" opacity="0.4" />
      <rect x="156" y="110" width="12" height="33" rx="1.5" fill="#8B4513" opacity="0.65" />
      <rect x="170" y="104" width="16" height="39" rx="1.5" fill="#0D2340" opacity="0.5" />
      <rect x="188" y="109" width="11" height="34" rx="1.5" fill="#2C5F4A" opacity="0.7" />
      <rect x="201" y="111" width="9" height="32" rx="1.5" fill="#5B3A6E" opacity="0.55" />

      {/* Ambient light glow from above */}
      <ellipse cx="115" cy="26" rx="50" ry="14" fill="#C9A96E" opacity="0.04" />
      <ellipse cx="115" cy="30" rx="28" ry="7" fill="#C9A96E" opacity="0.06" />

      {/* Small decorative desk item */}
      <rect x="204" y="128" width="10" height="15" rx="2" fill="#8B7D6B" opacity="0.28" />
      <ellipse cx="209" cy="128" rx="6" ry="3" fill="#2C5F4A" opacity="0.32" />
    </svg>
  );
}
