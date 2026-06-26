/* ─── VIVA Design System — barrel export ─── */

/* Primitivos shadcn/Radix */
export { Button, buttonVariants } from "./button"
export type { ButtonProps } from "./button"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card"

export { Input } from "./input"
export type { InputProps } from "./input"

export { Label } from "./label"

export { Badge, badgeVariants } from "./badge"
export type { BadgeProps } from "./badge"

/* ─── Dialog base ─── */
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "./dialog"

/* ─── Tipografia ─── */
export { Text, textVariants } from "./typography"
export type { TextProps } from "./typography"

/* ─── Status ─── */
export { StatusBadge, statusBadgeVariants, STATUS_LABEL } from "./status-badge"
export type { StatusBadgeProps, StatusValue } from "./status-badge"

/* ─── Busca ─── */
export { SearchBar } from "./search-bar"
export type { SearchBarProps } from "./search-bar"

/* ─── KPI ─── */
export { KpiCard, kpiCardVariants } from "./kpi-card"
export type { KpiCardProps, KpiTrend } from "./kpi-card"

/* ─── Layout / estrutura ─── */
export { PageHeader } from "./page-header"
export type { PageHeaderProps } from "./page-header"

export { Section } from "./section"
export type { SectionProps } from "./section"

/* ─── Estados ─── */
export { EmptyState } from "./empty-state"
export type { EmptyStateProps } from "./empty-state"

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTableRow,
  Spinner,
  LoadingState,
} from "./loading-state"
export type { SkeletonProps, SpinnerProps, LoadingStateProps } from "./loading-state"

/* ─── Overlays ─── */
export { Modal, ModalCloseButton } from "./modal"
export type { ModalProps } from "./modal"

export { ConfirmDialog } from "./confirm-dialog"
export type { ConfirmDialogProps, ConfirmIntent } from "./confirm-dialog"

export { Drawer } from "./drawer"
export type { DrawerProps } from "./drawer"

/* ─── Menus ─── */
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
} from "./action-menu"
export type { ActionMenuProps, ActionMenuItem } from "./action-menu"

/* ─── Tabela ─── */
export { DataTable } from "./data-table"
export type { DataTableProps, Column, SortState, SortDirection } from "./data-table"
