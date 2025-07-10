import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken, getUserById } from "@/lib/auth"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  let user = null
  try {
    const decodedToken = verifyToken(token)
    if (decodedToken) {
      user = await getUserById(decodedToken.userId)
    }
  } catch (error) {
    console.error("Server-side token verification failed:", error)
  }

  if (!user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">Solar Field Operations</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}