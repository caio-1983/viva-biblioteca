"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ModalSize = "sm" | "md" | "lg" | "xl"

const MODAL_SIZE: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  /** Slot de ações no rodapé. Se omitido, apenas o X fecha. */
  footer?: React.ReactNode
  size?: ModalSize
  /** Impede fechar ao clicar no overlay */
  persistent?: boolean
}

function Modal({ open, onClose, title, description, children, footer, size = "md", persistent = false }: ModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !persistent) onClose()
      }}
    >
      <DialogContent
        className={cn(MODAL_SIZE[size])}
        onInteractOutside={(e) => {
          if (persistent) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (persistent) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <DialogBody>{children}</DialogBody>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

/* Componente de fechamento re-exportado para uso em footers customizados */
function ModalCloseButton({ label = "Cancelar" }: { label?: string }) {
  return (
    <DialogClose asChild>
      <Button variant="outline">{label}</Button>
    </DialogClose>
  )
}

export { Modal, ModalCloseButton }
