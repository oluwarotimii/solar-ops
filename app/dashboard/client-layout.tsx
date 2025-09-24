"use client";

import { Suspense, useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { PushSubscriptionManager } from "@/components/PushSubscriptionManager";
import { DashboardProvider } from "@/lib/dashboard-context";
import type { User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full">
      <div className="hidden w-72 border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-6">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Skeleton className="h-8 w-8" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Skeleton className="h-6 w-48" />
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Skeleton className="h-full w-full" />
        </main>
      </div>
    </div>
  );
}

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (!response.ok) {
          throw new Error('Failed to fetch user data.');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (err: any) {
        setError(err.message);
        // Optional: redirect to login
        // window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">
            {error || "Could not load user data."}
          </h2>
          <p className="text-muted-foreground">Please try logging in again.</p>
          <a href="/login" className="mt-4 inline-block rounded bg-primary px-4 py-2 text-primary-foreground">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

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
