"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type DrawerSide = "right" | "left"
type DrawerWidth = "sm" | "md" | "lg" | "full"

const DRAWER_WIDTH: Record<DrawerWidth, string> = {
  sm:   "w-72",
  md:   "w-96",
  lg:   "w-[32rem]",
  full: "w-full",
}

const SLIDE_IN: Record<DrawerSide, string> = {
  right: "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  left:  "data-[state=open]:slide-in-from-left  data-[state=closed]:slide-out-to-left",
}

const POSITION: Record<DrawerSide, string> = {
  right: "right-0 top-0 h-full",
  left:  "left-0 top-0 h-full",
}

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  side?: DrawerSide
  width?: DrawerWidth
}

function Drawer({ open, onClose, title, description, children, footer, side = "right", width = "md" }: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />

        {/* Panel */}
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            SLIDE_IN[side],
            POSITION[side],
            DRAWER_WIDTH[width]
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
            <div>
              <DialogPrimitive.Title className="ds-card-title">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 ds-body text-slate-500">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="ml-4 shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40">
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-border/60 px-6 py-4 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { Drawer }
