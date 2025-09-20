'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
}

export default function LoadingOverlay({ 
  isLoading, 
  message = "Processing..." 
}: LoadingOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true)
      setIsVisible(true)
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!shouldRender) return null

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center max-w-sm w-full mx-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-gray-800">{message}</p>
        <p className="text-sm text-gray-500 mt-2">Please wait...</p>
      </div>
    </div>
  )
}