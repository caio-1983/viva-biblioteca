"use client"

import * as React from "react"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonTableRow } from "@/components/ui/loading-state"

/* ─── Column definition ─── */

export type SortDirection = "asc" | "desc" | null

export interface Column<T> {
  key: string
  header: string
  /** Renderiza a célula. Recebe o item da linha. */
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  /** Largura fixa, ex: "w-16" ou "w-40" */
  width?: string
  align?: "left" | "center" | "right"
}

export interface SortState {
  key: string
  direction: SortDirection
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  /** Chave única por linha. Fallback: índice. */
  rowKey?: (row: T, index: number) => string | number
  loading?: boolean
  /** Número de linhas skeleton durante loading */
  loadingRows?: number
  /** Texto vazio: título */
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  emptyIcon?: React.ReactNode
  /** Callback ao clicar numa linha */
  onRowClick?: (row: T) => void
  /** Estado de ordenação atual */
  sort?: SortState
  onSort?: (key: string) => void
  className?: string
  stickyHeader?: boolean
}

const ALIGN_CLASS = {
  left:   "text-left",
  center: "text-center",
  right:  "text-right",
}

function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingRows = 5,
  emptyTitle = "Nenhum resultado",
  emptyDescription,
  emptyAction,
  emptyIcon,
  onRowClick,
  sort,
  onSort,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {

  function handleSort(col: Column<T>) {
    if (!col.sortable || !onSort) return
    onSort(col.key)
  }

  function SortIcon({ col }: { col: Column<T> }) {
    if (!col.sortable) return null
    if (sort?.key !== col.key) return <ArrowUpDown className="ml-1 size-3.5 text-slate-300" />
    return sort.direction === "asc"
      ? <ArrowUp   className="ml-1 size-3.5 text-brand-500" />
      : <ArrowDown className="ml-1 size-3.5 text-brand-500" />
  }

  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-border bg-white shadow-sm", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className={cn("border-b border-border/60 bg-slate-50/80", stickyHeader && "sticky top-0 z-10")}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
                  ALIGN_CLASS[col.align ?? "left"],
                  col.width,
                  col.sortable && "cursor-pointer select-none hover:text-slate-700 transition-colors"
                )}
                onClick={() => handleSort(col)}
              >
                <span className="inline-flex items-center">
                  {col.header}
                  <SortIcon col={col} />
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading && (
            <>
              {Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td colSpan={columns.length} className="p-0">
                    <SkeletonTableRow cols={columns.length} />
                  </td>
                </tr>
              ))}
            </>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  icon={emptyIcon}
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                  size="sm"
                />
              </td>
            </tr>
          )}

          {!loading && data.map((row, index) => (
            <tr
              key={rowKey ? rowKey(row, index) : index}
              className={cn(
                "border-b border-border/40 last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-brand-50/50"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-slate-700",
                    ALIGN_CLASS[col.align ?? "left"],
                    col.width
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { DataTable }
