"use client"

import * as React from "react"
import { AlertTriangle, Trash2, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ConfirmIntent = "destructive" | "warning" | "confirm"

const INTENT_CONFIG: Record<ConfirmIntent, {
  icon: React.ReactNode
  iconBg: string
  confirmVariant: "default" | "destructive" | "secondary"
  defaultConfirmLabel: string
}> = {
  destructive: {
    icon:               <Trash2 className="size-5" />,
    iconBg:             "bg-red-100 text-destructive",
    confirmVariant:     "destructive",
    defaultConfirmLabel: "Excluir",
  },
  warning: {
    icon:               <AlertTriangle className="size-5" />,
    iconBg:             "bg-status-overdue-bg text-status-overdue",
    confirmVariant:     "default",
    defaultConfirmLabel: "Continuar",
  },
  confirm: {
    icon:               <CheckCircle2 className="size-5" />,
    iconBg:             "bg-status-available-bg text-status-available",
    confirmVariant:     "default",
    defaultConfirmLabel: "Confirmar",
  },
}

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  intent?: ConfirmIntent
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  intent = "destructive",
  confirmLabel,
  cancelLabel = "Cancelar",
  loading = false,
}: ConfirmDialogProps) {
  const cfg = INTENT_CONFIG[intent]
  const label = confirmLabel ?? cfg.defaultConfirmLabel

  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !loading) onClose() }}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={(e) => { if (loading) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (loading) e.preventDefault() }}
        hideClose={loading}
      >
        <DialogHeader>
          <div className="flex items-start gap-4">
            <span className={cn("mt-0.5 flex shrink-0 items-center justify-center rounded-full p-2.5", cfg.iconBg)}>
              {cfg.icon}
            </span>
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogBody />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={cfg.confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Aguarde..." : label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
