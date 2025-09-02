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
  user: {
    id: string
    name: string
    email: string
  }
  totalEarnedAmount: number
}

interface AccruedValueDetailed {
  id: string
  user: {
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
  const [allUsers, setAllUsers] = useState<{
    id: string;
    name: string;
    email: string;
  }[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState("all")
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

    const fetchAllUsers = async () => {
      try {
        const response = await fetch("/api/users/all", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAllUsers(data.map((user: any) => ({ id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email })));
        } else {
          console.error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAccruedValues()
    fetchAllUsers()
  }
  , [monthFilter, yearFilter])

  const filteredValues = accruedValues.filter((value) => {
    if (!value.user) {
      return false;
    }
    const matchesSearch =
      value.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUser = userFilter === "all" || value.user.id === userFilter

    return matchesSearch && matchesUser
  })

  // Calculate summary stats
  const totalEarned = filteredValues.reduce((sum, value) => sum + parseFloat(value.totalEarnedAmount.toString()), 0)
  const uniqueUsers = new Set(filteredValues.map((v) => v.user.id)).size

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
      const userData: { [key: string]: { name: string; email: string; totalEarned: number; jobsPerMonth: { [month: string]: number }; totalJobs: number } } = {};

      detailedAccruedValues.forEach((value: AccruedValueDetailed) => {
        const userId = value.user.id;
        const monthYear = `${value.month}-${value.year}`;

        if (!userData[userId]) {
          userData[userId] = {
            name: value.user.name,
            email: value.user.email,
            totalEarned: 0,
            jobsPerMonth: {},
            totalJobs: 0,
          };
        }

        userData[userId].totalEarned += parseFloat(value.earnedAmount.toString());
        userData[userId].totalJobs += 1;
        userData[userId].jobsPerMonth[monthYear] = (userData[userId].jobsPerMonth[monthYear] || 0) + 1;
      });

      let csvContent = "User Name,User Email,Total Earned,Total Jobs";
      const allMonthsYears = Array.from(new Set(detailedAccruedValues.map((v: AccruedValueDetailed) => `${v.month}-${v.year}`))).sort();

      allMonthsYears.forEach(my => {
        csvContent += `,Jobs in ${my}`;
      });
      csvContent += "\n";

      for (const userId in userData) {
        const data = userData[userId];
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

  const uniqueUsersList = Array.from(new Set(accruedValues.map((v) => v.user?.id).filter(Boolean)))
    .map((id) => {
      const user = accruedValues.find((v) => v.user?.id === id)?.user
      return user
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
          <p className="text-muted-foreground">Track user performance</p>
        </div>
        <Button onClick={handleExport} disabled={loading || accruedValues.length === 0}>
          <FileText className="h-4 w-3 mr-2" />
          Export
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
                <p className="text-sm font-medium">Total Earned Across All Users</p>
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
                <p className="text-sm font-medium">Unique Users with Earnings</p>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
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
                <p className="text-sm font-medium">Total Records (Users)</p>
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {allUsers.map((user) => (
                  <SelectItem key={user?.id} value={user?.id || ""}>
                    {user?.name}
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
              <SelectTrigger className="w-full sm:w-[120px]">
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
          <CardDescription>Total earnings per user</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading accrued values...</p>
            </div>
          ) : (
            <div>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredValues.map((value) => (
                  <Card key={value.user.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(value.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{value.user.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{value.user.email}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Total Earned</p>
                        <p className="text-lg font-bold text-green-600">{formatNaira(parseFloat(value.totalEarnedAmount.toString()))}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Total Earned</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredValues.map((value) => (
                      <TableRow key={value.user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{getInitials(value.user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p>{value.user.name}</p>
                              <p className="text-sm text-muted-foreground">{value.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">{formatNaira(parseFloat(value.totalEarnedAmount.toString()))}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {/* Actions can go here */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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