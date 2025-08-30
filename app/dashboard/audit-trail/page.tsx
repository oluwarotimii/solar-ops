'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, User, Server } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { formatAction, getTargetLink } from '@/lib/audit-helpers';
import AuditLogDetails from '@/components/audit-log-details';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchLogs = async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/audit-trail?page=${page}&limit=15`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch audit logs.');
        }
        const data = await response.json();
        setLogs(data.logs);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs(currentPage);
  }, [currentPage]);

  const getInitials = (log: AuditLog) => {
    if (!log.first_name) return <Server className="h-4 w-4" />;
    return `${log.first_name.charAt(0)}${log.last_name ? log.last_name.charAt(0) : ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Trail</h1>
        <p className="text-muted-foreground">Track all user and system activities across the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>A chronological record of all actions performed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Event</TableHead>
                  <TableHead className="w-[60%]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-12 text-red-500"><AlertCircle className="h-8 w-8 mx-auto" /><p className="mt-2">Error: {error}</p></TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-12">No audit logs found.</TableCell></TableRow>
                ) : (
                  logs.map((log) => {
                    const targetLink = getTargetLink(log);
                    const userName = log.first_name ? `${log.first_name} ${log.last_name}` : 'System';
                    return (
                      <tr key={log.id} className="md:table-row block mb-4 md:mb-0 border-b last:border-b-0 md:border-none rounded-lg md:rounded-none p-4 md:p-0 shadow-md md:shadow-none">
                        <td className="md:table-cell py-2 font-medium" data-label="Event">
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
                              <p className="text-xs text-muted-foreground mt-1" title={format(new Date(log.created_at), 'PPpp')}>
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="md:table-cell py-2 align-top" data-label="Details">
                          <AuditLogDetails log={log} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading}>First</Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || loading}>Previous</Button>
        <span className="text-sm">Page {currentPage} of {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || loading}>Next</Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading}>Last</Button>
      </div>
    </div>
  );
}