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
            {Object.entries(changes).map(([key, value]: [string, any]) => (
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

    case 'job_create':
      return (
        <div>
          <p>Title: <span className="font-medium">{log.details.title}</span></p>
        </div>
      );

    default:
      return (
        <pre className="text-xs bg-gray-100 p-2 rounded-md overflow-auto max-w-xs md:max-w-sm">
          {JSON.stringify(log.details, null, 2)}
        </pre>
      );
  }
}
