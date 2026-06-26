"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { MoreHorizontal, Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/* ─── Primitives re-exported ─── */
const DropdownMenu      = DropdownMenuPrimitive.Root
const DropdownTrigger   = DropdownMenuPrimitive.Trigger
const DropdownPortal    = DropdownMenuPrimitive.Portal
const DropdownSub       = DropdownMenuPrimitive.Sub
const DropdownSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none",
      "text-slate-700 hover:bg-slate-100 focus:bg-slate-100",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4 text-slate-400" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownSubTrigger.displayName = "DropdownSubTrigger"

const DropdownSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-36 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-lg",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      className
    )}
    {...props}
  />
))
DropdownSubContent.displayName = "DropdownSubContent"

const DropdownContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownContent.displayName = "DropdownContent"

const DropdownItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    destructive?: boolean
    icon?: React.ReactNode
  }
>(({ className, destructive = false, icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors",
      destructive
        ? "text-destructive hover:bg-red-50 focus:bg-red-50"
        : "text-slate-700 hover:bg-slate-100 focus:bg-slate-100",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  >
    {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
    {children}
  </DropdownMenuPrimitive.Item>
))
DropdownItem.displayName = "DropdownItem"

const DropdownCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-md py-1.5 pl-8 pr-2.5 text-sm outline-none transition-colors",
      "text-slate-700 hover:bg-slate-100 focus:bg-slate-100",
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="size-3.5 text-brand-500" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownCheckboxItem.displayName = "DropdownCheckboxItem"

const DropdownSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border/60", className)}
    {...props}
  />
))
DropdownSeparator.displayName = "DropdownSeparator"

const DropdownLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400", className)}
    {...props}
  />
))
DropdownLabel.displayName = "DropdownLabel"

/* ─── ActionMenu — botão "⋯" pré-montado ─── */

export interface ActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
  separator?: boolean
}

export interface ActionMenuProps {
  items: ActionMenuItem[]
  /** Sobreposição do trigger padrão */
  trigger?: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

function ActionMenu({ items, trigger, align = "end", side = "bottom" }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="flex items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            aria-label="Ações"
          >
            <MoreHorizontal className="size-4" />
          </button>
        )}
      </DropdownTrigger>

      <DropdownContent align={align} side={side}>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {item.separator && i > 0 && <DropdownSeparator />}
            <DropdownItem
              destructive={item.destructive}
              icon={item.icon}
              disabled={item.disabled}
              onSelect={item.onClick}
            >
              {item.label}
            </DropdownItem>
          </React.Fragment>
        ))}
      </DropdownContent>
    </DropdownMenu>
  )
}

export {
  ActionMenu,
  DropdownMenu,
  DropdownTrigger,
  DropdownPortal,
  DropdownContent,
  DropdownItem,
  DropdownCheckboxItem,
  DropdownSeparator,
  DropdownLabel,
  DropdownSub,
  DropdownSubTrigger,
  DropdownSubContent,
}
