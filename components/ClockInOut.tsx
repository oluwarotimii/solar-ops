import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, LogIn, LogOut, Loader2, MapPin, Briefcase } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';

interface JobOption {
  id: string;
  title: string;
  status: string;
  priority: string;
  locationAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  jobValue: string;
  jobTypeName: string;
  jobTypeColor: string;
}

export default function ClockInOut() {
  const { toast } = useToast();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [timeEntry, setTimeEntry] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const requestGps = useCallback(async () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      );
      setGpsPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch {
      // GPS not available or denied - non-critical
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, jobsRes] = await Promise.all([
        fetch('/api/time-entries/current'),
        fetch('/api/time-entries/jobs'),
      ]);
      const statusData = await statusRes.json();
      const jobsData = await jobsRes.json();

      if (statusData.isClockedIn) {
        setIsClockedIn(true);
        setTimeEntry(statusData);
      } else {
        setIsClockedIn(false);
        setTimeEntry(null);
        setAvailableJobs(jobsData.jobs || []);
        if (jobsData.jobs?.length > 0) {
          setSelectedJobId(jobsData.jobs[0].id);
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClockIn = async () => {
    setClocking(true);
    try {
      let lat = gpsPosition?.lat;
      let lng = gpsPosition?.lng;

      if (!lat && !lng && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
            })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // GPS unavailable, proceed without
        }
      }

      const response = await fetch('/api/time-entries/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          jobId: selectedJobId || null,
          latitude: lat || null,
          longitude: lng || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to clock in');
      }

      const data = await response.json();
      setIsClockedIn(true);
      setTimeEntry(data);
      setNotes('');
      toast({ title: 'Clocked In', description: selectedJobId ? 'Clocked in for job.' : 'Clocked in.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    setClocking(true);
    try {
      const response = await fetch('/api/time-entries/clock-out', { method: 'POST' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to clock out');
      }
      setIsClockedIn(false);
      setTimeEntry(null);
      toast({ title: 'Clocked Out', description: 'You have successfully clocked out.' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setClocking(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" />Time Clock</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <LoadingSpinner text="Loading..." size="sm" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" />Time Clock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isClockedIn ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="font-medium text-green-700 dark:text-green-300">Clocked In</p>
              <p className="text-sm text-muted-foreground">
                Since {new Date(timeEntry.clockIn).toLocaleTimeString('en-NG')}
              </p>
              {timeEntry.job_title && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Briefcase className="h-4 w-4" />
                  <span>{timeEntry.job_title}</span>
                </div>
              )}
              {timeEntry.latitude && timeEntry.longitude && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>GPS captured at clock-in</span>
                </div>
              )}
            </div>
            <Button onClick={handleClockOut} disabled={clocking} className="w-full">
              {clocking ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Clocking out...</>
              ) : (
                <><LogOut className="mr-2 h-4 w-4" />Clock Out</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableJobs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Select Job
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {availableJobs.map((job) => (
                    <Button
                      key={job.id}
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedJobId(job.id)}
                      className={cn(
                        "w-full text-left p-3 h-auto flex-col items-start gap-1",
                        selectedJobId === job.id && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-medium text-sm">{job.title}</span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: job.jobTypeColor || undefined }}
                        >
                          {job.jobTypeName || 'Job'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{job.locationAddress}</span>
                      </div>
                      {job.scheduledDate && (
                        <p className="text-xs text-muted-foreground">
                          {job.scheduledDate}{job.scheduledTime ? ` at ${job.scheduledTime.slice(0, 5)}` : ''}
                        </p>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {availableJobs.length === 0 && (
              <p className="text-sm text-muted-foreground">No active jobs assigned.</p>
            )}

            <Textarea
              placeholder="Add a note... (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {gpsPosition
                  ? `GPS: ${gpsPosition.lat.toFixed(4)}, ${gpsPosition.lng.toFixed(4)}`
                  : gpsLoading
                  ? 'Getting GPS...'
                  : 'GPS not captured'}
              </span>
              {!gpsPosition && !gpsLoading && (
                <Button variant="ghost" size="sm" onClick={requestGps} className="h-6 text-xs">
                  Capture GPS
                </Button>
              )}
            </div>

            <Button onClick={handleClockIn} disabled={clocking} className="w-full">
              {clocking ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Clocking in...</>
              ) : (
                <><LogIn className="mr-2 h-4 w-4" />Clock In {selectedJobId ? 'for Selected Job' : ''}</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
