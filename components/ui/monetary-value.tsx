"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNaira } from "@/lib/utils"

interface MonetaryValueProps {
  value: number | null | undefined
  className?: string
}

export function MonetaryValue({ value, className }: MonetaryValueProps) {
  const [hidden, setHidden] = useState(true)

  if (value === null || value === undefined) {
    return <span className={cn("text-muted-foreground", className)}>N/A</span>
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 cursor-pointer select-none", className)}
      onClick={() => setHidden((h) => !h)}
      title={hidden ? "Click to reveal" : "Click to hide"}
    >
      <span className={hidden ? "tracking-wider" : ""}>
        {hidden ? "••••••" : formatNaira(value)}
      </span>
      {hidden ? (
        <EyeOff className="h-3 w-3 text-muted-foreground/60 shrink-0" />
      ) : (
        <Eye className="h-3 w-3 text-muted-foreground/60 shrink-0" />
      )}
    </span>
  )
}
