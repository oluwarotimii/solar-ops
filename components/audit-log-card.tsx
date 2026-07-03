'use client'

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { formatAction, getTargetLink } from '@/lib/audit-helpers';
import AuditLogDetails from '@/components/audit-log-details';
import { Server } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  ip_address: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  user_id: string | null;
}

interface AuditLogCardProps {
  log: AuditLog;
}

export default function AuditLogCard({ log }: AuditLogCardProps) {
  const getInitials = (log: AuditLog) => {
    if (!log.first_name) return <Server className="h-4 w-4" />;
    return `${log.first_name.charAt(0)}${log.last_name ? log.last_name.charAt(0) : ''}`.toUpperCase();
  };

  const targetLink = getTargetLink(log);
  const userName = log.first_name ? `${log.first_name} ${log.last_name}` : 'System';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getInitials(log)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {userName} <span className="font-normal text-muted-foreground">{formatAction(log)}</span>
            </p>
            {targetLink ? (
              <Link href={targetLink} className="text-sm text-blue-500 hover:underline">{log.target_type} #{log.target_id.substring(0, 8)}</Link>
            ) : log.target_type && (
              <p className="text-sm text-muted-foreground">{log.target_type} #{log.target_id?.substring(0, 8)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1" title={format(new Date(log.created_at), 'd MMM yyyy HH:mm')}>
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AuditLogDetails log={log} />
      </CardContent>
    </Card>
  );
}
