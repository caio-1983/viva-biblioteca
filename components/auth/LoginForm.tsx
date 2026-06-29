"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { CSSProperties } from "react";
import {
  staggerRevealVariants,
  staggerItemVariants,
} from "@/lib/animations/bookOpening";

const schema = z.object({
  email:    z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

type FormData = z.infer<typeof schema>;

interface LoginFormProps {
  /** Controls the stagger entrance animation */
  visible?: boolean;
}

export function LoginForm({ visible = true }: LoginFormProps) {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (_data: FormData) => {
    setLoading(true);
    // TODO: connect to auth endpoint
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
  };

  return (
    <motion.div
      variants={staggerRevealVariants}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "clamp(1.5rem, 6vw, 3.5rem)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: "320px" }}>
        {/* Heading */}
        <motion.div variants={staggerItemVariants} style={{ marginBottom: "clamp(1.4rem, 3.5vh, 2rem)" }}>
          <p style={eyebrowStyle}>ACESSO AO SISTEMA</p>
          <h1 style={headingStyle}>Bem-vindo de volta</h1>
          <p style={subStyle}>
            Entre com suas credenciais para acessar a biblioteca.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* E-mail */}
          <motion.div variants={staggerItemVariants} style={{ marginBottom: "1.05rem" }}>
            <label style={labelStyle} htmlFor="ve-email">
              E-mail
            </label>
            <input
              {...register("email")}
              id="ve-email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#C9A96E";
                e.currentTarget.style.boxShadow  = "0 0 0 3px rgba(201,169,110,0.12)";
                e.currentTarget.style.background  = "rgba(255,255,255,0.9)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(139,125,107,0.28)";
                e.currentTarget.style.boxShadow  = "none";
                e.currentTarget.style.background  = "rgba(255,255,255,0.55)";
              }}
            />
            {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
          </motion.div>

          {/* Senha */}
          <motion.div variants={staggerItemVariants} style={{ marginBottom: "0.65rem" }}>
            <label style={labelStyle} htmlFor="ve-password">
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <input
                {...register("password")}
                id="ve-password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: "2.8rem" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#C9A96E";
                  e.currentTarget.style.boxShadow  = "0 0 0 3px rgba(201,169,110,0.12)";
                  e.currentTarget.style.background  = "rgba(255,255,255,0.9)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,125,107,0.28)";
                  e.currentTarget.style.boxShadow  = "none";
                  e.currentTarget.style.background  = "rgba(255,255,255,0.55)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                style={eyeButtonStyle}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
          </motion.div>

          {/* Esqueci a senha */}
          <motion.div
            variants={staggerItemVariants}
            style={{ textAlign: "right", marginBottom: "1.7rem" }}
          >
            <a href="#" style={forgotStyle}>
              Esqueci minha senha
            </a>
          </motion.div>

          {/* Botão */}
          <motion.div variants={staggerItemVariants}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                background: "linear-gradient(135deg, #0B1E36 0%, #173660 100%)",
                color: "#E8E4DC",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow:
                  "0 6px 22px rgba(11,30,54,0.28), 0 2px 6px rgba(11,30,54,0.16)",
                transition: "opacity 0.18s ease, transform 0.14s ease",
                fontFamily: "var(--font-sans, sans-serif)",
                opacity: loading ? 0.78 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.opacity = "1";
              }}
            >
              {loading && (
                <Loader2
                  size={14}
                  style={{ animation: "viva-spin 0.9s linear infinite" }}
                />
              )}
              {loading ? "Verificando..." : "ENTRAR"}
            </button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}

// ── Style constants ──────────────────────────────
const eyebrowStyle: CSSProperties = {
  color: "#C9A96E",
  fontSize: "0.54rem",
  letterSpacing: "0.36em",
  fontWeight: 700,
  margin: "0 0 0.5rem",
  fontFamily: "var(--font-sans, sans-serif)",
};

const headingStyle: CSSProperties = {
  color: "#1A1810",
  fontSize: "clamp(1.4rem, 2.8vw, 1.65rem)",
  fontWeight: 700,
  margin: "0 0 0.45rem",
  fontFamily: "var(--font-display, sans-serif)",
  letterSpacing: "-0.022em",
  lineHeight: 1.2,
};

const subStyle: CSSProperties = {
  color: "#6B7D8E",
  fontSize: "0.8rem",
  margin: 0,
  lineHeight: 1.6,
  fontFamily: "var(--font-sans, sans-serif)",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "#3C4F5C",
  marginBottom: "0.38rem",
  fontFamily: "var(--font-sans, sans-serif)",
  letterSpacing: "0.025em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.68rem 0.9rem",
  border: "1.5px solid rgba(139,125,107,0.28)",
  borderRadius: "8px",
  fontSize: "0.875rem",
  color: "#1a2430",
  background: "rgba(255,255,255,0.55)",
  outline: "none",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans, sans-serif)",
};

const errorStyle: CSSProperties = {
  color: "#B85C38",
  fontSize: "0.7rem",
  marginTop: "0.28rem",
  marginBottom: 0,
  fontFamily: "var(--font-sans, sans-serif)",
};

const eyeButtonStyle: CSSProperties = {
  position: "absolute",
  right: "0.8rem",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#8B9BAA",
  padding: "3px",
  display: "flex",
  alignItems: "center",
  lineHeight: 0,
};

const forgotStyle: CSSProperties = {
  color: "#C9A96E",
  fontSize: "0.76rem",
  textDecoration: "none",
  fontFamily: "var(--font-sans, sans-serif)",
};
