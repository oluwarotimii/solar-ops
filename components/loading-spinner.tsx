import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  text?: string
  fullScreen?: boolean
  size?: "sm" | "md" | "lg"
}

export default function LoadingSpinner({ 
  text = "Loading...", 
  fullScreen = false,
  size = "md"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
          <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mr-2`} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}