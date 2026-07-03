import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {message && <p className="mt-1 text-sm text-muted-foreground max-w-md">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  message?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title = "No data found",
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && <div className="text-muted-foreground mb-3">{icon}</div>}
      <p className="text-base font-medium text-foreground">{title}</p>
      {message && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-6 flex-1"
              style={{ width: `${50 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface LoadingTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function LoadingTable({ rows = 5, columns = 4, className }: LoadingTableProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  )
}
