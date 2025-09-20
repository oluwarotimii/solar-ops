import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import InstallPwaPrompt from "@/components/install-pwa-prompt"
import "@/lib/logger" // Import the logger to disable console logs in production
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar"

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
  applicationName: "SolarOps",
  formatDetection: {
    telephone: false,
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
        <meta name="application-name" content="SolarOps" />
        <meta name="theme-color" content="#eab308" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-72.png" />
        <link rel="icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 overflow-x-hidden`}>
        {children}
        <Toaster />
        <InstallPwaPrompt />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
