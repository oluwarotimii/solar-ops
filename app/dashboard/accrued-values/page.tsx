"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Search, DollarSign, Users, Calendar, Star, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AccruedValueDisplay {
  technician: {
    id: string
    name: string
    email: string
  }
  totalEarnedAmount: number
}

interface AccruedValueDetailed {
  id: string
  technician: {
    id: string
    name: string
    email: string
  }
  job: {
    id: string
    title: string
    type: string
  }
  earnedAmount: number
  rating: number
  month: number
  year: number
  createdAt: string
}

export default function AccruedValuesPage() {
  const { toast } = useToast();
  const [accruedValues, setAccruedValues] = useState<AccruedValueDisplay[]>([])
  const [allTechnicians, setAllTechnicians] = useState<{
    id: string;
    name: string;
    email: string;
  }[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [technicianFilter, setTechnicianFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [minAccruedYear, setMinAccruedYear] = useState(new Date().getFullYear());
  const [maxAccruedYear, setMaxAccruedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchAccruedValues = async () => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams();
        if (monthFilter !== "all") queryParams.append("month", monthFilter);
        if (yearFilter !== "all") queryParams.append("year", yearFilter);

        const response = await fetch(`/api/accrued-values?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const { accruedValues, minYear, maxYear } = await response.json();
        if (Array.isArray(accruedValues)) {
          setAccruedValues(accruedValues);
          if (maxYear) {
            setYearFilter(maxYear.toString());
          }
        } else {
          console.error("Fetched data is not an array:", accruedValues);
          setAccruedValues([]); // Ensure it's always an array
        }
        setMinAccruedYear(minYear || new Date().getFullYear());
        setMaxAccruedYear(maxYear || new Date().getFullYear());
      } catch (error) {
        console.error('Error fetching accrued values:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchAllTechnicians = async () => {
      try {
        const response = await fetch("/api/users/technicians", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAllTechnicians(data.map((tech: any) => ({ id: tech.id, name: `${tech.firstName} ${tech.lastName}`, email: tech.email })));
        } else {
          console.error("Failed to fetch technicians");
        }
      } catch (error) {
        console.error("Error fetching technicians:", error);
      }
    };

    fetchAccruedValues()
    fetchAllTechnicians()
  }
  , [monthFilter, yearFilter])

  const filteredValues = accruedValues.filter((value) => {
    const matchesSearch =
      value.technician.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTechnician = technicianFilter === "all" || value.technician.id === technicianFilter

    return matchesSearch && matchesTechnician
  })

  // Calculate summary stats
  const totalEarned = filteredValues.reduce((sum, value) => sum + parseFloat(value.totalEarnedAmount.toString()), 0)
  const uniqueTechnicians = new Set(filteredValues.map((v) => v.technician.id)).size

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/accrued-values?mode=detailed', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const { accruedValues: detailedAccruedValues } = await response.json();

      // Process data for export
      const technicianData: { [key: string]: { name: string; email: string; totalEarned: number; jobsPerMonth: { [month: string]: number }; totalJobs: number } } = {};

      detailedAccruedValues.forEach((value: AccruedValueDetailed) => {
        const technicianId = value.technician.id;
        const monthYear = `${value.month}-${value.year}`;

        if (!technicianData[technicianId]) {
          technicianData[technicianId] = {
            name: value.technician.name,
            email: value.technician.email,
            totalEarned: 0,
            jobsPerMonth: {},
            totalJobs: 0,
          };
        }

        technicianData[technicianId].totalEarned += parseFloat(value.earnedAmount.toString());
        technicianData[technicianId].totalJobs += 1;
        technicianData[technicianId].jobsPerMonth[monthYear] = (technicianData[technicianId].jobsPerMonth[monthYear] || 0) + 1;
      });

      let csvContent = "Technician Name,Technician Email,Total Earned,Total Jobs";
      const allMonthsYears = Array.from(new Set(detailedAccruedValues.map((v: AccruedValueDetailed) => `${v.month}-${v.year}`))).sort();

      allMonthsYears.forEach(my => {
        csvContent += `,Jobs in ${my}`;
      });
      csvContent += "\n";

      for (const techId in technicianData) {
        const data = technicianData[techId];
        let row = `"${data.name}","${data.email}",${data.totalEarned},${data.totalJobs}`;
        allMonthsYears.forEach(my => {
          row += `,${data.jobsPerMonth[my] || 0}`;
        });
        csvContent += row + "\n";
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "accrued_values_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast({
        title: "Export Successful",
        description: "Accrued values data exported to CSV.",
      });
    } catch (error) {
      console.error('Error exporting accrued values:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred during data export.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uniqueTechniciansList = Array.from(new Set(accruedValues.map((v) => v.technician.id)))
    .map((id) => {
      const tech = accruedValues.find((v) => v.technician.id === id)?.technician
      return tech
    })
    .filter(Boolean)

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accrued Values</h1>
          <p className="text-muted-foreground">Track technician earnings and performance in Nigerian Naira</p>
        </div>
        <Button onClick={handleExport} disabled={loading || accruedValues.length === 0}>
          <FileText className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Earned Across All Technicians</p>
                <p className="text-2xl font-bold">{formatNaira(totalEarned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Unique Technicians with Earnings</p>
                <p className="text-2xl font-bold">{uniqueTechnicians}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Records (Technicians)</p>
                <p className="text-2xl font-bold">{filteredValues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search technicians..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {allTechnicians.map((tech) => (
                  <SelectItem key={tech?.id} value={tech?.id || ""}>
                    {tech?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxAccruedYear - minAccruedYear + 1 }, (_, i) => minAccruedYear + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accrued Values Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accrued Values ({filteredValues.length})</CardTitle>
          <CardDescription>Total earnings per technician</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading accrued values...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredValues.map((value) => (
                    <TableRow key={value.technician.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{getInitials(value.technician.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{value.technician.name}</p>
                            <p className="text-sm text-muted-foreground">{value.technician.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-600">{formatNaira(parseFloat(value.totalEarnedAmount.toString()))}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredValues.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No accrued values found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
