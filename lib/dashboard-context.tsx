"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  loading: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [completionRate, setCompletionRate] = useState<CompletionRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, activityRes, completionRes] = await Promise.all([
          fetch("/api/dashboard/stats", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
          fetch("/api/dashboard/activity", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
          fetch("/api/dashboard/completion-rate", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        ]);

        if (!statsRes.ok) throw new Error("Failed to fetch dashboard stats.");
        if (!activityRes.ok) throw new Error("Failed to fetch recent activity.");
        if (!completionRes.ok) throw new Error("Failed to fetch completion rate.");

        const statsData = await statsRes.json();
        const activityData = await activityRes.json();
        const completionData = await completionRes.json();

        setStats(statsData);
        setActivity(activityData);
        setCompletionRate(completionData);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "An unexpected error occurred while fetching dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardContext.Provider value={{ stats, activity, completionRate, loading, error }}>
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
