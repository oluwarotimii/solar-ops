"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Search } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobilePageHeaderProps {
  title: string
  subtitle?: string
  onAdd?: () => void
  onFilter?: () => void
  onSearch?: () => void
  addLabel?: string
  children?: React.ReactNode
}

const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  title,
  subtitle,
  onAdd,
  onFilter,
  onSearch,
  addLabel = "Add",
  children,
}) => {
  const isMobile = useIsMobile()

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && !isMobile && <p className="text-sm text-gray-600 mt-1 hidden md:block">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {onSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSearch}
              className="h-9 w-9 p-0 md:w-auto md:px-3 bg-transparent"
              title="Search"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline ml-2">Search</span>
            </Button>
          )}

          {onFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFilter}
              className="h-9 w-9 p-0 md:w-auto md:px-3 bg-transparent"
              title="Filter"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden md:inline ml-2">Filter</span>
            </Button>
          )}

          {onAdd && (
            <Button size="sm" onClick={onAdd} className="h-9 w-9 p-0 md:w-auto md:px-3" title={addLabel}>
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline ml-2">{addLabel}</span>
            </Button>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}

export default MobilePageHeader
export { MobilePageHeader }
