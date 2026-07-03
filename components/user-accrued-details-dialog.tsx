
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import { MonetaryValue } from "@/components/ui/monetary-value";
import type { AccruedValueDetailed } from "@/types";

interface UserAccruedDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  details: AccruedValueDetailed[];
}

export default function UserAccruedDetailsDialog({ isOpen, onClose, userName, details }: UserAccruedDetailsDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Accrued Value Details for {userName}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Job Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail) => (
                <TableRow key={detail.id}>
                  <TableCell>{detail.job?.title || "N/A"}</TableCell>
                  <TableCell>{detail.job?.type || "N/A"}</TableCell>
                  <TableCell><MonetaryValue value={detail.earnedAmount} /></TableCell>
                  <TableCell>{formatDate(detail.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
