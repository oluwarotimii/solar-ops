import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Clock, LogIn, LogOut } from 'lucide-react';

export default function ClockInOut() {
  const { toast } = useToast();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeEntry, setTimeEntry] = useState<any>(null);

  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  const fetchCurrentStatus = async () => {
    try {
      const response = await fetch('/api/time-entries/current');
      const data = await response.json();
      if (data.isClockedIn) {
        setIsClockedIn(true);
        setTimeEntry(data);
      } else {
        setIsClockedIn(false);
        setTimeEntry(null);
      }
    } catch (error) {
      console.error('Failed to fetch current status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/time-entries/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) {
        throw new Error('Failed to clock in');
      }
      const data = await response.json();
      setIsClockedIn(true);
      setTimeEntry(data);
      setNotes('');
      toast({ title: 'Clocked In', description: 'You have successfully clocked in.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clock in.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/time-entries/clock-out', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to clock out');
      }
      setIsClockedIn(false);
      setTimeEntry(null);
      toast({ title: 'Clocked Out', description: 'You have successfully clocked out.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clock out.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2" />
          Time Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : isClockedIn ? (
          <div className="space-y-4">
            <p>You are currently clocked in.</p>
            <p className="text-sm text-muted-foreground">
              Clocked in at: {new Date(timeEntry.clock_in).toLocaleTimeString()}
            </p>
            <Button onClick={handleClockOut} disabled={loading} className="w-full">
              <LogOut className="mr-2" />
              {loading ? 'Clocking out...' : 'Clock Out'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Add a note... (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button onClick={handleClockIn} disabled={loading} className="w-full">
              <LogIn className="mr-2" />
              {loading ? 'Clocking in...' : 'Clock In'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
