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
import { Plus, Search, DollarSign, Users, Calendar, Star } from "lucide-react"

interface AccruedValue {
  technician: {
    id: string
    name: string
    email: string
  }
  totalEarnedAmount: number
}

export default function AccruedValuesPage() {
  const [accruedValues, setAccruedValues] = useState<AccruedValue[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [technicianFilter, setTechnicianFilter] = useState("all")

  useEffect(() => {
    const fetchAccruedValues = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/accrued-values', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const { accruedValues } = await response.json();
        if (Array.isArray(accruedValues)) {
          setAccruedValues(accruedValues);
        } else {
          console.error("Fetched data is not an array:", accruedValues);
          setAccruedValues([]); // Ensure it's always an array
        }
      } catch (error) {
        console.error('Error fetching accrued values:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccruedValues()
  }
  , [])

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
                {uniqueTechniciansList.map((tech) => (
                  <SelectItem key={tech?.id} value={tech?.id || ""}>
                    {tech?.name}
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