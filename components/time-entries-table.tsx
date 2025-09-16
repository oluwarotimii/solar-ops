'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, User, Server } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TimeEntry {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  created_at: string;
}

export default function TimeEntriesTable() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTimeEntries = async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/time-entries?page=${page}&limit=15`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch time entries.');
        }
        const responseData = await response.json();
        if (Array.isArray(responseData.timeEntries)) {
          setTimeEntries(responseData.timeEntries);
        } else {
          setTimeEntries([]);
        }
        setCurrentPage(responseData.currentPage);
        setTotalPages(responseData.totalPages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeEntries(currentPage);
  }, [currentPage]);

  const getInitials = (firstName: string | null, lastName: string | null) => {
    if (!firstName) return <User className="h-4 w-4" />;
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Entries</CardTitle>
        <CardDescription>A chronological record of all technician time entries.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Technician</TableHead>
                <TableHead className="w-[20%]">Clock In</TableHead>
                <TableHead className="w-[20%]">Clock Out</TableHead>
                <TableHead className="w-[30%]">Notes</TableHead>
                <TableHead className="w-[10%]">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-red-500"><AlertCircle className="h-8 w-8 mx-auto" /><p className="mt-2">Error: {error}</p></TableCell></TableRow>
              ) : timeEntries.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12">No time entries found.</TableCell></TableRow>
              ) : (
                timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="py-2 font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(entry.first_name, entry.last_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{entry.first_name} {entry.last_name}</p>
                          <p className="text-sm text-muted-foreground">{entry.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {format(new Date(entry.clock_in), 'PPpp')}
                    </TableCell>
                    <TableCell className="py-2">
                      {entry.clock_out ? format(new Date(entry.clock_out), 'PPpp') : 'N/A'}
                    </TableCell>
                    <TableCell className="py-2">
                      {entry.notes || 'No notes'}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground" title={format(new Date(entry.created_at), 'PPpp')}>
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View - Placeholder for now */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
          ) : error ? (
            <div className="text-center py-12 text-red-500"><AlertCircle className="h-8 w-8 mx-auto" /><p className="mt-2">Error: {error}</p></div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-12">No time entries found.</div>
          ) : (
            timeEntries.map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(entry.first_name, entry.last_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{entry.first_name} {entry.last_name}</p>
                    <p className="text-sm text-muted-foreground">{entry.email}</p>
                  </div>
                </div>
                <p className="text-sm"><strong>Clock In:</strong> {format(new Date(entry.clock_in), 'PPpp')}</p>
                <p className="text-sm"><strong>Clock Out:</strong> {entry.clock_out ? format(new Date(entry.clock_out), 'PPpp') : 'N/A'}</p>
                <p className="text-sm"><strong>Notes:</strong> {entry.notes || 'No notes'}</p>
                <p className="text-xs text-muted-foreground mt-2">Logged {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</p>
              </Card>
            ))
          )}
        </div>
      </CardContent>

      <div className="flex justify-end items-center gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading}>First</Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || loading}>Previous</Button>
        <span className="text-sm">Page {currentPage} of {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || loading}>Next</Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading}>Last</Button>
      </div>
    </Card>
  );
}
