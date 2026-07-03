'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Server, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { ResponsiveDataTable, type Column } from '@/components/responsive-data-table';
import { Avatar as AvatarRoot } from '@/components/ui/avatar';

interface TimeEntry {
  id: string;
  userId: string;
  jobId: string | null;
  clockIn: string;
  clockOut: string | null;
  notes: string | null;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  jobTitle: string | null;
  jobTypeName: string | null;
}

const safeFormat = (value: string | null | undefined, fmt: string) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  return isNaN(d.getTime()) ? 'N/A' : format(d, fmt);
};

const safeFormatDistance = (value: string | null | undefined) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  return isNaN(d.getTime()) ? 'N/A' : formatDistanceToNow(d, { addSuffix: true });
};

const getInitials = (firstName: string | null, lastName: string | null) => {
  if (!firstName) return <Server className="h-4 w-4" />;
  return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
};

export default function TimeEntriesTable() {
  const { toast } = useToast();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [sortColumn, setSortColumn] = useState<string>('clockIn');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchTimeEntries = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/time-entries?${params.toString()}`);
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

  const handleRefresh = () => {
    fetchTimeEntries(currentPage);
  };

  const handleExport = () => {
    if (timeEntries.length === 0) {
      toast({ title: 'Export Failed', description: 'No data to export.', variant: 'destructive' });
      return;
    }

    const headers = ['Technician', 'Email', 'Job', 'Job Type', 'Clock In', 'Clock Out', 'Notes', 'Created At'];
    const rows = timeEntries.map((e) => [
      `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
      e.email ?? '',
      e.jobTitle ?? 'N/A',
      e.jobTypeName ?? 'N/A',
      safeFormat(e.clockIn, 'd MMM yyyy HH:mm'),
      safeFormat(e.clockOut, 'd MMM yyyy HH:mm'),
      e.notes ?? '',
      safeFormat(e.createdAt, 'd MMM yyyy HH:mm'),
    ]);

    let csvContent = '\uFEFF';
    csvContent += headers.map((h) => `"${h}"`).join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map((f) => `"${String(f ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time-entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Successful', description: 'CSV file downloaded.' });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    fetchTimeEntries(currentPage);
  }, [currentPage, startDate, endDate]);

  const columns: Column<TimeEntry>[] = [
    {
      key: 'technician',
      header: 'Technician',
      sortable: true,
      mobileTitle: 'Technician',
      render: (entry) => (
        <div className="flex items-center gap-3">
          <AvatarRoot className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{getInitials(entry.firstName, entry.lastName)}</AvatarFallback>
          </AvatarRoot>
          <div className="min-w-0">
            <p className="font-medium truncate">{entry.firstName} {entry.lastName}</p>
            <p className="text-sm text-muted-foreground truncate">{entry.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'job',
      header: 'Job',
      mobileTitle: 'Job',
      render: (entry) => (
        <div>
          <p className="font-medium">{entry.jobTitle || 'N/A'}</p>
          {entry.jobTypeName && <p className="text-xs text-muted-foreground">{entry.jobTypeName}</p>}
        </div>
      ),
    },
    {
      key: 'clockIn',
      header: 'Clock In',
      sortable: true,
      mobileTitle: 'Clock In',
      render: (entry) => (
        <span className="tabular-nums">{safeFormat(entry.clockIn, 'd MMM yyyy HH:mm')}</span>
      ),
    },
    {
      key: 'clockOut',
      header: 'Clock Out',
      sortable: true,
      mobileTitle: 'Clock Out',
      render: (entry) => (
        <span className="tabular-nums">{safeFormat(entry.clockOut, 'd MMM yyyy HH:mm')}</span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      hideOnMobile: true,
      render: (entry) => <span className="text-muted-foreground">{entry.notes || 'No notes'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      sortable: true,
      mobileTitle: 'Created',
      render: (entry) => (
        <span
          className="text-xs text-muted-foreground tabular-nums"
          title={safeFormat(entry.createdAt, 'd MMM yyyy HH:mm')}
        >
          {safeFormatDistance(entry.createdAt)}
        </span>
      ),
    },
  ];

  const filterBar = (
    <>
      <div>
        <Label htmlFor="time-start-date" className="sr-only">Start Date</Label>
        <Input
          id="time-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-9 w-40"
        />
      </div>
      <div>
        <Label htmlFor="time-end-date" className="sr-only">End Date</Label>
        <Input
          id="time-end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-9 w-40"
        />
      </div>
      <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
        Clear
      </Button>
      <Button variant="outline" size="sm" onClick={handleRefresh}>
        Refresh
      </Button>
      <Button variant="default" size="sm" onClick={handleExport}>
        <FileText className="h-4 w-4 mr-1" />
        Export
      </Button>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Entries</CardTitle>
        <CardDescription>A chronological record of all technician time entries.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveDataTable
          data={timeEntries}
          columns={columns}
          keyExtractor={(e) => e.id}
          loading={loading}
          error={error}
          onRetry={handleRefresh}
          emptyTitle="No time entries found"
          emptyMessage="No time entries match your current filters."
          density={density}
          onDensityChange={setDensity}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          filterBar={filterBar}
          stickyHeader
        />

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {timeEntries.length} of {totalPages * 15} entries
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading}>
              First
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1 || loading}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages || loading}>
              Next
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading}>
              Last
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
