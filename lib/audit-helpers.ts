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
    default:
      return actionText;
  }
}

export function getTargetLink(log: AuditLog): string | null {
  if (!log.target_type || !log.target_id) return null;

  switch (log.target_type) {
    case 'job':
      return `/dashboard/jobs?search=${log.target_id}`;
    case 'user':
      return `/dashboard/users?search=${log.target_id}`;
    default:
      return null;
  }
}
