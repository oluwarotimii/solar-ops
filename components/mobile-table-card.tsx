"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronRight, Edit, Trash2, CheckSquare } from "lucide-react"

interface MobileTableCardProps {
  title: string
  subtitle?: string
  status?: string
  statusColor?: string
  badges?: Array<{ label: string; variant?: "default" | "secondary" | "destructive" | "outline" }>
  onEdit?: () => void
  onDelete?: () => void
  onMarkComplete?: () => void
  onClick?: () => void
  children?: React.ReactNode
  showActions?: boolean
  showMarkComplete?: boolean
}

function MobileTableCard({
  title,
  subtitle,
  status,
  statusColor,
  badges,
  onEdit,
  onDelete,
  onMarkComplete,
  onClick,
  children,
  showActions = true,
  showMarkComplete = false,
}: MobileTableCardProps) {
  return (
    <Card className="mb-3 hover:shadow-md transition-all duration-200 active:scale-[0.98] bg-white border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
            <h3 className="font-semibold text-base leading-tight mb-2 text-gray-900 truncate">{title}</h3>

            {subtitle && <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{subtitle}</p>}

            <div className="flex flex-wrap gap-2 mb-2">
              {status && (
                <Badge
                  variant="outline"
                  className={cn("text-xs px-2.5 py-1 font-medium", statusColor || "bg-gray-100 text-gray-700")}
                >
                  {status}
                </Badge>
              )}
              {badges?.map((badge, index) => (
                <Badge key={index} variant={badge.variant || "outline"} className="text-xs px-2.5 py-1 font-medium">
                  {badge.label}
                </Badge>
              ))}
            </div>

            {children}
          </div>

          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {showActions && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {showActions && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {showMarkComplete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkComplete?.()
                }}
                className="h-9 w-9 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                title="Mark as Complete"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            )}

            {onClick && <ChevronRight className="h-5 w-5 text-gray-400 ml-1" />}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { MobileTableCard }
export default MobileTableCard
