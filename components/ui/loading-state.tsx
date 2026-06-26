"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/* ─── Skeleton ─── */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  )
)
Skeleton.displayName = "Skeleton"

/* ─── Skeleton presets ─── */

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-white p-5 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

function SkeletonTableRow({ cols = 4, className }: { cols?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-3 px-4", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === 0 ? "w-8" : "flex-1")} />
      ))}
    </div>
  )
}

/* ─── Spinner ─── */

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  label?: string
}

const SPINNER_SIZE = { sm: "size-4", md: "size-6", lg: "size-8" }

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", label = "Carregando...", ...props }, ref) => (
    <div ref={ref} role="status" className={cn("flex items-center gap-2", className)} {...props}>
      <Loader2 className={cn("animate-spin text-brand-500", SPINNER_SIZE[size])} />
      {label && <span className="ds-caption text-slate-500">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  )
)
Spinner.displayName = "Spinner"

/* ─── LoadingState — fullscreen-ish empty area com spinner ─── */

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  size?: "sm" | "md" | "lg"
}

const LOADING_SIZE_CLASS = { sm: "py-8", md: "py-14", lg: "py-20" }

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, label = "Carregando...", size = "md", ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn("flex flex-col items-center justify-center", LOADING_SIZE_CLASS[size], className)}
      {...props}
    >
      <Loader2 className="mb-3 size-8 animate-spin text-brand-500" />
      <p className="ds-body text-slate-400">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  )
)
LoadingState.displayName = "LoadingState"

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTableRow, Spinner, LoadingState }
