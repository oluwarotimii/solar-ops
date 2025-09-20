"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { BottomSheet } from "@/components/bottom-sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface InstallPwaPromptProps {
  onInstallSuccess?: () => void
  onInstallDismissed?: () => void
}

const InstallPwaPrompt: React.FC<InstallPwaPromptProps> = ({
  onInstallSuccess,
  onInstallDismissed,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    // Check if the browser supports the beforeinstallprompt event
    if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
      window.addEventListener("beforeinstallprompt", handler)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt()
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        console.log("User accepted the A2HS prompt")
        onInstallSuccess?.()
      } else {
        console.log("User dismissed the A2HS prompt")
        onInstallDismissed?.()
      }
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleLaterClick = () => {
    setShowPrompt(false)
    onInstallDismissed?.()
  }

  // Always render the component, but only show the prompt when appropriate
  if (!showPrompt) {
    return null
  }

  // For mobile devices, show the bottom sheet
  if (isMobile) {
    return (
      <BottomSheet
        isOpen={showPrompt}
        onClose={handleLaterClick}
        title="Install SolarOps App"
        actions={
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} className="flex-1">
              Install App
            </Button>
            <Button variant="outline" onClick={handleLaterClick} className="flex-1">
              Later
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Get the full experience. Install SolarOps as an app for faster access and offline support.
        </p>
      </BottomSheet>
    )
  }

  // For desktop devices, show a toast notification or similar UI
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 max-w-xs">
      <h3 className="font-semibold mb-2">Install SolarOps App</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Get the full experience. Install SolarOps as an app for faster access and offline support.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleInstallClick} size="sm">
          Install
        </Button>
        <Button variant="outline" onClick={handleLaterClick} size="sm">
          Later
        </Button>
      </div>
    </div>
  )
}

export default InstallPwaPrompt
