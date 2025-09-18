import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingSpinner({ className, size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <div className="flex items-center gap-2">
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        {text && <span className="text-muted-foreground">{text}</span>}
      </div>
    </div>
  )
}
