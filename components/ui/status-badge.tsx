import { cn } from "@/lib/utils"

const statusConfig = {
  critical: {
    dot: "bg-status-critical",
    bg: "bg-status-critical-bg text-status-critical",
    solid: "bg-status-critical text-status-critical-foreground",
    label: "Critical",
  },
  warning: {
    dot: "bg-status-warning",
    bg: "bg-status-warning-bg text-status-warning",
    solid: "bg-status-warning text-status-warning-foreground",
    label: "Warning",
  },
  success: {
    dot: "bg-status-success",
    bg: "bg-status-success-bg text-status-success",
    solid: "bg-status-success text-status-success-foreground",
    label: "Success",
  },
  info: {
    dot: "bg-status-info",
    bg: "bg-status-info-bg text-status-info",
    solid: "bg-status-info text-status-info-foreground",
    label: "Info",
  },
  offline: {
    dot: "bg-status-offline",
    bg: "bg-status-offline-bg text-status-offline",
    solid: "bg-status-offline text-status-offline-foreground",
    label: "Offline",
  },
} as const

export type StatusType = keyof typeof statusConfig

interface StatusBadgeProps {
  status: StatusType
  label?: string
  variant?: "dot" | "solid" | "subtle"
  className?: string
}

export function StatusBadge({ status, label, variant = "dot", className }: StatusBadgeProps) {
  const cfg = statusConfig[status]

  if (variant === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />
        <span className="text-sm font-medium">{label ?? cfg.label}</span>
      </span>
    )
  }

  if (variant === "solid") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          cfg.solid,
          className
        )}
      >
        {label ?? cfg.label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.bg,
        className
      )}
    >
      {label ?? cfg.label}
    </span>
  )
}
