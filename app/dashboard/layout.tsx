"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from "./client-layout";
import { PermissionProvider } from "@/contexts/permission-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionProvider>
      <ClientLayout>
        {children}
      </ClientLayout>
    </PermissionProvider>
  );
}
