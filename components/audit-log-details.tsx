'use client'

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditLogDetailsProps {
  log: {
    action: string;
    details: any;
  };
}

const renderValue = (value: any) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined) return <span className="text-muted-foreground">N/A</span>;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
};

export default function AuditLogDetails({ log }: AuditLogDetailsProps) {
  if (!log.details) return <span className="text-muted-foreground">No details</span>;

  switch (log.action) {
    case 'job_update':
      const changes = log.details.changes;
      if (!changes || Object.keys(changes).length === 0) {
        return <span className="text-muted-foreground">No fields changed</span>;
      }
      
      // Filter out unchanged fields
      const changedFields = Object.entries(changes).filter(([key, value]: [string, any]) => {
        // Show the field if there's an actual change
        if (value === null || value === undefined) return false;
        if (typeof value === 'object' && value.old === undefined && value.new === undefined) return false;
        if (typeof value === 'object' && value.old === value.new) return false;
        if (typeof value !== 'object' && value.old === value.new) return false;
        return true;
      });
      
      if (changedFields.length === 0) {
        return <span className="text-muted-foreground">No fields changed</span>;
      }
      
      return (
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changedFields.map(([key, value]: [string, any]) => (
              <TableRow key={key}>
                <TableCell className="font-medium capitalize">{key.replace(/_/g, ' ')}</TableCell>
                <TableCell>{renderValue(value.old)}</TableCell>
                <TableCell>{renderValue(value.new)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

    case 'job_status_update_admin':
    case 'job_status_update_system':
      return (
        <div>
          Status changed to <Badge>{log.details.status}</Badge>
          {log.details.reason && <p className="text-sm text-muted-foreground mt-1">Reason: {log.details.reason}</p>}
        </div>
      );

    case 'maintenance_occurrence_completed':
    case 'maintenance_occurrence_status_changed':
      return (
        <div>
          <p>Status changed to <Badge>{log.details.status}</Badge></p>
          {log.details.previousStatus && (
            <p>Previous status: <Badge variant="secondary">{log.details.previousStatus}</Badge></p>
          )}
          {log.details.assignedTo && <p>Assigned to: <span className="font-medium">{log.details.assignedTo}</span></p>}
        </div>
      );

    case 'job_create':
      return (
        <div>
          <p>Title: <span className="font-medium">{log.details.title}</span></p>
        </div>
      );

    case 'gps_location_logged':
    case 'journey_started':
    case 'journey_ended':
      return (
        <div className="space-y-1">
          <p>Job ID: <span className="font-medium">{log.details.jobId}</span></p>
          <p>Location: <span className="font-medium">{log.details.latitude}, {log.details.longitude}</span></p>
          {log.details.accuracy && <p>Accuracy: <span className="font-medium">{log.details.accuracy}m</span></p>}
          {log.details.journeyType && <p>Journey Type: <span className="font-medium capitalize">{log.details.journeyType}</span></p>}
        </div>
      );

    case 'job_checkin':
    case 'job_checkout':
      return (
        <div className="space-y-1">
          <p>Job ID: <span className="font-medium">{log.details.jobId}</span></p>
          <p>Type: <span className="font-medium capitalize">{log.details.type}</span></p>
          {log.details.latitude && log.details.longitude && (
            <p>Location: <span className="font-medium">{log.details.latitude}, {log.details.longitude}</span></p>
          )}
          {log.details.notes && <p>Notes: <span className="font-medium">{log.details.notes}</span></p>}
        </div>
      );

    case 'user_password_reset':
      return (
        <div>
          {log.details.userName && (
            <p>User: <span className="font-medium">{log.details.userName}</span></p>
          )}
          {log.details.resetBy && (
            <p>Reset by: <span className="font-medium">{log.details.resetBy}</span></p>
          )}
        </div>
      );

    default:
      // For any other action types, show a simplified view or JSON if needed
      if (log.details && Object.keys(log.details).length > 0) {
        // Show only non-empty details
        const nonEmptyDetails = Object.entries(log.details).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        );
        
        if (nonEmptyDetails.length === 0) {
          return <span className="text-muted-foreground">No details</span>;
        }
        
        return (
          <div className="space-y-1">
            {nonEmptyDetails.map(([key, value]) => (
              <p key={key}><span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {renderValue(value)}</p>
            ))}
          </div>
        );
      }
      return <span className="text-muted-foreground">No details</span>;
  }
}
