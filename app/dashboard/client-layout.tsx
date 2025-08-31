"use client";

import { Suspense } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { PushSubscriptionManager } from "@/components/PushSubscriptionManager";
import { DashboardProvider } from "@/lib/dashboard-context";

export default function DashboardClientLayout({
  user,
  children,
}: {
  user: any; // Consider using a more specific type for user
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <PushSubscriptionManager />
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">Solar Field Operations</h1>
          </div>
        </header>
        <Suspense fallback={<div className="flex-1 overflow-auto p-4">Loading dashboard data...</div>}>
          <DashboardProvider user={user}>
            <div className="flex-1 overflow-auto p-4">{children}</div>
          </DashboardProvider>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
