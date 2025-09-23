import { User } from '@/types';

interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  ip_address: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  user_id: string;
}

export function formatAction(log: AuditLog): string {
  const userName = log.first_name ? `${log.first_name} ${log.last_name}` : 'A system process';
  const actionText = log.action.replace(/_/g, ' ');

  switch (log.action) {
    case 'user_login_success':
      return `logged in.`;
    case 'user_login_fail':
      return `attempted to log in.`;
    case 'job_create':
      return `created a new job.`;
    case 'job_update':
      return `updated a job.`;
    case 'job_status_update_admin':
      return `updated the status of a job.`;
    case 'job_technician_complete':
      return `marked their work as complete on a job.`;
    case 'job_status_update_system':
      return `updated the status of a job.`;
    case 'job_delete':
      return `deleted a job.`;
    case 'maintenance_occurrence_completed':
      return `marked a maintenance task as completed.`;
    case 'maintenance_occurrence_status_changed':
      return `updated the status of a maintenance task.`;
    case 'gps_location_logged':
      return `logged a GPS location.`;
    case 'journey_started':
      return `started a journey.`;
    case 'journey_ended':
      return `ended a journey.`;
    case 'job_checkin':
      return `checked in at a job site.`;
    case 'job_checkout':
      return `checked out from a job site.`;
    case 'user_clock_in':
      return `clocked in.`;
    case 'user_clock_out':
      return `clocked out.`;
    case 'user_password_reset':
      return `reset a user's password.`;
    default:
      return actionText;
  }
}

export function getTargetLink(log: AuditLog): string | null {
  if (!log.target_type || !log.target_id) return null;

  switch (log.target_type) {
    case 'job':
      return `/dashboard/jobs?search=${log.target_id}`;
    case 'maintenance_occurrence':
      return `/dashboard/maintenance?search=${log.target_id}`;
    case 'user':
      return `/dashboard/users?search=${log.target_id}`;
    default:
      return null;
  }
}
