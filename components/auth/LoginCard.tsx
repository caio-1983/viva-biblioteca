"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { CSSProperties } from "react";
import { cardRevealVariants, staggerItem } from "@/animations/transitions";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginCardProps {
  visible?: boolean;
}

export function LoginCard({ visible = true }: LoginCardProps) {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (_data: LoginData) => {
    setLoading(true);
    // TODO: conectar ao endpoint de autenticação
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
  };

  return (
    <motion.div
      variants={cardRevealVariants}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "clamp(1.5rem, 5vw, 3.5rem)",
        boxSizing: "border-box",
        background: "linear-gradient(160deg, #F8F4EC 0%, #F2EDE5 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ruled-page texture matching the left side */}
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

      <div
        style={{
          position: "relative",
          maxWidth: "340px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <motion.div variants={staggerItem} style={{ marginBottom: "2rem" }}>
          <p
            style={{
              color: "#C9A96E",
              fontSize: "0.58rem",
              letterSpacing: "0.38em",
              fontWeight: 700,
              margin: "0 0 0.65rem",
              fontFamily: "var(--font-sans, sans-serif)",
            }}
          >
            ACESSO AO SISTEMA
          </p>
          <h2
            style={{
              color: "#1a1810",
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 700,
              margin: "0 0 0.45rem",
              fontFamily: "var(--font-display, sans-serif)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Bem-vindo de volta
          </h2>
          <p
            style={{
              color: "#6B7D8E",
              fontSize: "0.82rem",
              margin: 0,
              lineHeight: 1.55,
              fontFamily: "var(--font-sans, sans-serif)",
            }}
          >
            Entre com suas credenciais para acessar a biblioteca.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <motion.div variants={staggerItem} style={{ marginBottom: "1.1rem" }}>
            <label style={labelStyle} htmlFor="login-email">
              E-mail
            </label>
            <input
              {...register("email")}
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#C9A96E";
                e.currentTarget.style.background = "rgba(255,255,255,0.88)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(139,125,107,0.3)";
                e.currentTarget.style.background = "rgba(255,255,255,0.62)";
              }}
            />
            {errors.email && (
              <p style={errorStyle}>{errors.email.message}</p>
            )}
          </motion.div>

          {/* Senha */}
          <motion.div variants={staggerItem} style={{ marginBottom: "0.8rem" }}>
            <label style={labelStyle} htmlFor="login-password">
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <input
                {...register("password")}
                id="login-password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: "2.75rem" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#C9A96E";
                  e.currentTarget.style.background = "rgba(255,255,255,0.88)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,125,107,0.3)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.62)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#8B9BAA",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  lineHeight: 0,
                }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p style={errorStyle}>{errors.password.message}</p>
            )}
          </motion.div>

          {/* Esqueci a senha */}
          <motion.div
            variants={staggerItem}
            style={{ textAlign: "right", marginBottom: "1.75rem" }}
          >
            <a
              href="#"
              style={{
                color: "#C9A96E",
                fontSize: "0.78rem",
                textDecoration: "none",
                fontFamily: "var(--font-sans, sans-serif)",
              }}
            >
              Esqueci minha senha
            </a>
          </motion.div>

          {/* Botão entrar */}
          <motion.div variants={staggerItem}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.82rem 1rem",
                background:
                  "linear-gradient(135deg, #0D2340 0%, #1B3D6B 100%)",
                color: "#E8E4DC",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow:
                  "0 6px 24px rgba(13,35,64,0.26), 0 2px 8px rgba(13,35,64,0.16)",
                transition: "opacity 0.18s ease",
                fontFamily: "var(--font-sans, sans-serif)",
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading && (
                <Loader2
                  size={15}
                  style={{ animation: "viva-spin 1s linear infinite" }}
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

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.74rem",
  fontWeight: 600,
  color: "#3D4F5C",
  marginBottom: "0.38rem",
  fontFamily: "var(--font-sans, sans-serif)",
  letterSpacing: "0.02em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.875rem",
  border: "1.5px solid rgba(139,125,107,0.3)",
  borderRadius: "8px",
  fontSize: "0.875rem",
  color: "#1a2430",
  background: "rgba(255,255,255,0.62)",
  outline: "none",
  transition: "border-color 0.18s ease, background 0.18s ease",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans, sans-serif)",
};

const errorStyle: CSSProperties = {
  color: "#B85C38",
  fontSize: "0.72rem",
  marginTop: "0.3rem",
  marginBottom: 0,
  fontFamily: "var(--font-sans, sans-serif)",
};
