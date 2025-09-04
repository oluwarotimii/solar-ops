export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  roleId: string
  status: "pending" | "active" | "suspended" | "deactivated"
  approved: boolean
  role?: Role
  createdAt: string
  updatedAt: string
  stats?: {
    totalJobs: number
    completedJobs: number
    avgRating: number
  }
}

export interface Role {
  id: string
  name: string
  description?: string
  isAdmin: boolean
  permissions: Record<string, boolean | Record<string, boolean>>
  createdAt: string
}

export interface JobUser {
  id: string
  jobId: string
  userId: string
  role: "lead" | "assistant" | "specialist"
  rating?: number
  feedback?: string
  user?: User
  createdAt: string
}

export interface Job {
  id: string
  title: string
  description?: string
  jobTypeId: string
  createdBy: string
  status: "assigned" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  locationAddress: string
  locationLat?: number
  locationLng?: number
  scheduledDate?: string
  scheduledTime?: string
  // estimatedDuration?: number
  
  
  instructions?: string
  completedAt?: string
  jobType?: JobType
  createdUser?: User
  users?: JobUser[]
  createdAt: string
  updatedAt: string
}

export interface JobType {
  id: string
  name: string
  description?: string
  baseValue: number
  color: string
  createdAt: string
}

export interface GPSLog {
  id: string
  userId: string
  jobId?: string
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: string
  journeyType: "start" | "active" | "site_arrival" | "site_departure" | "return"
}

export interface CheckinLog {
  id: string
  userId: string
  jobId: string
  type: "checkin" | "checkout"
  latitude?: number
  longitude?: number
  notes?: string
  timestamp: string
  user?: User
  job?: Job
}

export interface JobMedia {
  id: string
  jobId: string
  uploadedBy: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  caption?: string
  uploadedAt: string
}

export interface MaintenanceTask {
  id: string
  title: string
  description?: string
  siteLocation: string
  assignedTo?: string
  createdBy: string
  status: "scheduled" | "in_progress" | "completed" | "overdue"
  priority: "low" | "medium" | "high"
  scheduledDate: string
  recurrenceType?: "daily" | "weekly" | "monthly" | "yearly"
  recurrenceInterval: number
  lastCompleted?: string
  assignedUser?: User
  createdAt: string
}

export interface AccruedValue {
  technician: {
    id: string;
    name: string;
    email: string;
  };
  totalEarnedAmount: number;
}

export interface Notification {
  id: string
  recipientId: string
  senderId?: string
  title: string
  message: string
  type: "job_assignment" | "maintenance_reminder" | "admin_message" | "general"
  relatedJobId?: string
  readAt?: string
  createdAt: string
  sender?: User
  relatedJob?: Job
}

export interface DashboardStats {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  activeTechnicians: number
  pendingMaintenance: number
  totalRevenue: number
}
