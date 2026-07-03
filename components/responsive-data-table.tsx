"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, ChevronRight, ArrowUpDown, LayoutList, Rows3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState, EmptyState } from "@/components/ui/state-display"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
  hideOnMobile?: boolean
  mobileTitle?: string
}

interface ResponsiveDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyMessage?: string
  emptyAction?: React.ReactNode
  density?: "compact" | "comfortable"
  onDensityChange?: (density: "compact" | "comfortable") => void
  sortColumn?: string
  sortDirection?: "asc" | "desc"
  onSort?: (column: string) => void
  filterBar?: React.ReactNode
  className?: string
  stickyHeader?: boolean
  statusColumn?: string
}

export function ResponsiveDataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyAction,
  density = "comfortable",
  onDensityChange,
  sortColumn,
  sortDirection,
  onSort,
  filterBar,
  className,
  stickyHeader = true,
  statusColumn,
}: ResponsiveDataTableProps<T>) {
  const rowHeight = density === "compact" ? "min-h-[2.25rem] py-1" : "min-h-[2.75rem] py-2"

  const renderSortIcon = (col: Column<T>) => {
    if (!col.sortable) return null
    const isActive = sortColumn === col.key
    return (
      <span className="ml-1 inline-flex flex-col leading-none">
        {isActive ? (
          sortDirection === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
        )}
      </span>
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {filterBar}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={rowHeight}>
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(className)}>
        {filterBar}
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn(className)}>
        {filterBar}
        <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
      </div>
    )
  }

  const desktopColspan = columns.filter((c) => !c.hideOnMobile).length

  return (
    <div className={cn("space-y-4", className)}>
      {(filterBar || onDensityChange) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {filterBar && <div className="flex flex-wrap items-center gap-2">{filterBar}</div>}
          {onDensityChange && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDensityChange("compact")}
                    data-active={density === "compact"}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compact view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDensityChange("comfortable")}
                    data-active={density === "comfortable"}
                  >
                    <Rows3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Comfortable view</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          {stickyHeader && (
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.sortable && "cursor-pointer select-none",
                      col.className
                    )}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <span className="inline-flex items-center">
                      {col.header}
                      {renderSortIcon(col)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          {!stickyHeader && (
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.sortable && "cursor-pointer select-none",
                      col.className
                    )}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <span className="inline-flex items-center">
                      {col.header}
                      {renderSortIcon(col)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={rowHeight}>
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((item) => {
          const mobileCols = columns.filter((c) => !c.hideOnMobile)
          return (
            <Card
              key={keyExtractor(item)}
              className={cn(
                "p-4",
                onRowClick && "cursor-pointer active:bg-muted/50 transition-colors"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {mobileCols.map((col, idx) => {
                const value = col.render(item)
                if (idx === 0) {
                  return (
                    <div key={col.key} className="flex items-center justify-between">
                      <div className="font-medium">{value}</div>
                      {onRowClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />}
                    </div>
                  )
                }
                return (
                  <div key={col.key} className="flex justify-between items-center mt-1.5 text-sm">
                    <span className="text-muted-foreground">{col.mobileTitle ?? col.header}</span>
                    <span>{value}</span>
                  </div>
                )
              })}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
