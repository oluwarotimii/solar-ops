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
import { Plus, Search, DollarSign, Users, Calendar, Star, Eye, Edit } from "lucide-react"
import AddAccruedValueDialog from "@/components/add-accrued-value-dialog"

interface AccruedValue {
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
  sharePercentage: number
  jobValue: number
  earnedAmount: number
  rating: number
  month: number
  year: number
  createdAt: string
}

export default function AccruedValuesPage() {
  const [accruedValues, setAccruedValues] = useState<AccruedValue[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [technicianFilter, setTechnicianFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("2024")
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    const fetchAccruedValues = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/accrued-values', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setAccruedValues(data);
        } else {
          console.error("Fetched data is not an array:", data);
          setAccruedValues([]); // Ensure it's always an array
        }
      } catch (error) {
        console.error('Error fetching accrued values:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccruedValues()
  }, [])

  const handleAddAccruedValue = async (newValue: any) => {
    try {
      const response = await fetch("/api/accrued-values", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newValue),
      });

      if (response.ok) {
        setShowAddDialog(false);
        fetchAccruedValues();
      } else {
        console.error("Failed to create accrued value");
      }
    } catch (error) {
      console.error("Error creating accrued value:", error);
    }
  };

  const filteredValues = accruedValues.filter((value) => {
    const matchesSearch =
      value.technician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.job.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTechnician = technicianFilter === "all" || value.technician.id === technicianFilter
    const matchesMonth = monthFilter === "all" || value.month.toString() === monthFilter
    const matchesYear = value.year.toString() === yearFilter

    return matchesSearch && matchesTechnician && matchesMonth && matchesYear
  })

  // Calculate summary stats
  const totalEarned = filteredValues.reduce((sum, value) => sum + value.earnedAmount, 0)
  const avgRating = filteredValues.reduce((sum, value) => sum + value.rating, 0) / filteredValues.length || 0
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

  const uniqueTechniciansList = Array.from(new Set(accruedValues.map((v) => v.technician.id)))
    .map((id) => {
      const tech = accruedValues.find((v) => v.technician.id === id)?.technician
      return tech
    })
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accrued Values</h1>
          <p className="text-muted-foreground">Track technician earnings and performance in Nigerian Naira</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Accrued Value
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <AddAccruedValueDialog onValueAdded={handleAddAccruedValue} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Earned</p>
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
                <p className="text-sm font-medium">Active Technicians</p>
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
                <p className="text-sm font-medium">Total Records</p>
                <p className="text-2xl font-bold">{filteredValues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-full">
                <Star className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Avg Rating</p>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
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
                  placeholder="Search technicians or jobs..."
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
                {uniqueTechniciansList.map((tech) => (
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
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accrued Values Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accrued Values ({filteredValues.length})</CardTitle>
          <CardDescription>Detailed breakdown of technician earnings and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Job Value</TableHead>
                  <TableHead>Earned</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredValues.map((value) => (
                  <TableRow key={value.id}>
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
                      <div>
                        <p className="font-medium">{value.job.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {value.job.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{value.sharePercentage}%</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatNaira(value.jobValue)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">{formatNaira(value.earnedAmount)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{value.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{new Date(value.createdAt).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredValues.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No accrued values found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
