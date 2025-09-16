import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import InstallPwaPrompt from "@/components/install-pwa-prompt"
import "@/lib/logger" // Import the logger to disable console logs in production

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Solar Field Operations",
  description: "Solar Field Operations Management Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SolarOps",
  },
}

export const viewport: Viewport = {
  themeColor: "#eab308",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SolarOps" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" href="/iconn.png" />
      </head>
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 overflow-x-hidden`}>
        {children}
        <Toaster />
        <InstallPwaPrompt />
      </body>
    </html>
  )
}
