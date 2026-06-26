"use client"

import * as React from "react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string
  onChange?: (value: string) => void
  onClear?: () => void
  loading?: boolean
  /** Texto adicional dentro do campo, à direita (ex: "12 resultados") */
  hint?: string
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value = "", onChange, onClear, loading = false, hint, placeholder = "Buscar...", disabled, ...props }, ref) => {
    const handleClear = () => {
      onChange?.("")
      onClear?.()
    }

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
        </span>

        <input
          ref={ref}
          type="search"
          value={value}
          placeholder={placeholder}
          disabled={disabled || loading}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-input bg-white pl-9 pr-9 text-sm",
            "text-slate-900 placeholder:text-slate-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            hint && "pr-28"
          )}
          {...props}
        />

        {hint && !value && (
          <span className="pointer-events-none absolute right-3 text-xs text-slate-400 select-none">
            {hint}
          </span>
        )}

        {value && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar }
