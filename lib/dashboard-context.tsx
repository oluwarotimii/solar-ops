"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  activeTechnicians: number;
  pendingMaintenance: number;
  totalRevenue: number;
}

interface DashboardActivity {
  type: string;
  title?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  timestamp: string;
  jobId?: string;
}

interface CompletionRate {
  totalJobsThisMonth: number;
  completedJobsThisMonth: number;
  completionRate: string;
}

interface DashboardContextType {
  stats: DashboardStats | null;
  activity: DashboardActivity[];
  completionRate: CompletionRate | null;
  spilloverJobs: any[];
  loading: boolean;
  error: string | null;
  user: User | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [completionRate, setCompletionRate] = useState<CompletionRate | null>(null);
  const [spilloverJobs, setSpilloverJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Admins get global stats, non-admins get their own stats
        const statsUrl = user.role?.isAdmin 
          ? "/api/dashboard/stats" 
          : `/api/users/${user.id}/stats`;

        const [statsRes, activityRes, completionRes, spilloverRes] = await Promise.all([
          fetch(statsUrl, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
          fetch("/api/dashboard/activity", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
          fetch("/api/dashboard/completion-rate", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
          fetch("/api/dashboard/spillover-jobs", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        ]);

        if (!statsRes.ok) throw new Error(`Failed to fetch dashboard stats from ${statsUrl}.`);
        if (!activityRes.ok) throw new Error("Failed to fetch recent activity.");
        if (!completionRes.ok) throw new Error("Failed to fetch completion rate.");
        if (!spilloverRes.ok) throw new Error("Failed to fetch spillover jobs.");

        const statsData = await statsRes.json();
        const activityData = await activityRes.json();
        const completionData = await completionRes.json();
        const spilloverData = await spilloverRes.json();

        setStats(statsData);
        setActivity(activityData);
        setCompletionRate(completionData);
        setSpilloverJobs(spilloverData);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "An unexpected error occurred while fetching dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <DashboardContext.Provider value={{ stats, activity, completionRate, spilloverJobs, loading, error, user }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboardData must be used within a DashboardProvider");
  }
  return context;
}
