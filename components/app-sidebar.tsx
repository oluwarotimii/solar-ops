"use client"

import type * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MapPin,
  Wrench,
  TrendingUp,
  Bell,
  FileText,
  Settings,
  LogOut,
  ChevronUp,
  User,
  DollarSign,
  Shield,
  History,
  Archive
} from "lucide-react"
import type { User as UserType } from "@/types"

import { usePermissions } from "@/contexts/permission-context";
import { useSidebar } from "@/components/ui/sidebar";

// Navigation items
const navConfig = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        permission: "dashboard:read",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Jobs",
        url: "/dashboard/jobs",
        icon: Briefcase,
        permission: "jobs:read",
      },
      {
        title: "Archived Jobs",
        url: "/dashboard/archived-jobs",
        icon: Archive,
        permission: "jobs:archive",
      },
      {
        title: "Maintenance",
        url: "/dashboard/maintenance",
        icon: Wrench,
        permission: "maintenance:read",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Accrued Values",
        url: "/dashboard/accrued-values",
        icon: DollarSign,
        permission: "accrued_values:read",
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: FileText,
        permission: "reports:read",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Users",
        url: "/dashboard/users",
        icon: User,
        permission: "users:update",
      },
      {
        title: "Roles",
        url: "/dashboard/roles",
        icon: Shield,
        permission: "roles:read",
      },
      {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
        permission: "notifications:read",
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
        permission: "settings:read",
      },
      {
        title: "Audit Trail",
        url: "/dashboard/audit-trail",
        icon: History,
        permission: "audit_trail:read",
      },
    ],
  },
];

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: UserType }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { hasPermission, isLoading } = usePermissions();

  // Get user info from localStorage (demo)
  const userEmail = user.email;
  const userName = user.email
    .split("@")[0]
    .replace(/\d+/g, "")
    .replace(/[^a-zA-Z]/g, " ")
    .trim();
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1) || "User";

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    // Optionally, render a loading state for the sidebar
    return <Sidebar {...props}><SidebarHeader /><SidebarContent><div>Loading...</div></SidebarContent><SidebarFooter /></Sidebar>;
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">Solar Field Ops</span>
            <span className="text-xs text-muted-foreground">Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navConfig
          .filter((section) =>
            section.items.some((item) => hasPermission(item.permission))
          )
          .map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items
                  .filter((item) => hasPermission(item.permission))
                  .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url} onClick={() => { if (isMobile) setOpenMobile(false); }}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                    </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{userEmail}</span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
