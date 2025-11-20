import type React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 sm:pb-6", className)}>
      <div className="space-y-1 min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-balance break-words">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground text-pretty break-words">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
