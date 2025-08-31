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
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        console.log("User accepted the A2HS prompt")
        onInstallSuccess?.()
      } else {
        console.log("User dismissed the A2HS prompt")
        onInstallDismissed?.()
      }
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleLaterClick = () => {
    setShowPrompt(false)
    onInstallDismissed?.()
  }

  if (!isMobile || !showPrompt) {
    return null
  }

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
        Get the full experience. Add SolarOps to your home screen for faster access and offline
        support.
      </p>
    </BottomSheet>
  )
}

export default InstallPwaPrompt
