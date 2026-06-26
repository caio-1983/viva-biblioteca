"use client"

import * as React from "react"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info"

export interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((item: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setItems(prev => [...prev, { ...item, id }])
    setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastList items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

// ── Visual config ─────────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: React.ReactNode
  border: string
  iconBg: string
}> = {
  success: {
    icon:   <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />,
    border: "border-emerald-200",
    iconBg: "",
  },
  error: {
    icon:   <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />,
    border: "border-red-200",
    iconBg: "",
  },
  info: {
    icon:   <Info className="size-4 text-brand-500 shrink-0 mt-0.5" />,
    border: "border-brand-200",
    iconBg: "",
  },
}

// ── ToastList ─────────────────────────────────────────────────────────────────

function ToastList({
  items,
  onDismiss,
}: {
  items: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (items.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Notificações"
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none w-80"
    >
      {items.map(item => {
        const cfg = VARIANT_CONFIG[item.variant]
        return (
          <div
            key={item.id}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto flex items-start gap-3",
              "rounded-xl border bg-white shadow-lg px-4 py-3",
              cfg.border
            )}
          >
            {cfg.icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{item.title}</p>
              {item.description && (
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors -mt-0.5 -mr-1"
              aria-label="Fechar notificação"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
