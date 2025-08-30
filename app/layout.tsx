import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import "@/lib/logger"; // Import the logger to disable console logs in production

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Solar Field Operations",
  description: "Solar Field Operations Management Platform",
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
      </head>
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 overflow-x-hidden`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
