"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, User, RefreshCw, Eye, Phone, Play, Square, Loader2, AlertTriangle } from "lucide-react"
import TechnicianMap from "@/components/technician-map"

interface TechnicianLocation {
  id: string
  name: string
  email: string
  phone: string
  currentJob?: {
    id: string
    title: string
    locationAddress: string
    status: string
  }
  lastLocation?: {
    latitude: number
    longitude: number
    timestamp: string
    accuracy: number
  }
  status: "active" | "idle" | "offline"
  journeyStartTime?: string
  isTracking: boolean
}

export default function TrackingPage() {
  const [technicianLocations, setTechnicianLocations] = useState<TechnicianLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null)

  const fetchTechnicianLocations = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Authentication token not found.")
        setLoading(false)
        return
      }

      const response = await fetch("/api/tracking/technicians", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch technician locations.")
      }

      const data = await response.json()
      setTechnicianLocations(data)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching locations.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTechnicianLocations()
    // Set up interval to refresh locations every 30 seconds
    const interval = setInterval(fetchTechnicianLocations, 30000);
    return () => clearInterval(interval);
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "idle":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleStartTracking = async (technicianId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/tracking/start-journey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ technicianId }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to start tracking.")
      }
      fetchTechnicianLocations() // Refresh data after action
    } catch (err: any) {
      setError(err.message || "Error starting tracking.")
    }
  }

  const handleStopTracking = async (technicianId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/tracking/end-journey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ technicianId }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to stop tracking.")
      }
      fetchTechnicianLocations() // Refresh data after action
    } catch (err: any) {
      setError(err.message || "Error stopping tracking.")
    }
  }

  const refreshLocations = () => {
    fetchTechnicianLocations()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-lg">Loading technician locations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-600">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <p className="text-lg">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Live Tracking</h1>
          <p className="text-muted-foreground">Real-time technician locations and job progress</p>
        </div>
        <Button onClick={refreshLocations} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold">{technicianLocations.filter((t) => t.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-full">
                <User className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Idle</p>
                <p className="text-2xl font-bold">{technicianLocations.filter((t) => t.status === "idle").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-full">
                <User className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Offline</p>
                <p className="text-2xl font-bold">{technicianLocations.filter((t) => t.status === "offline").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{technicianLocations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map View */}
      <Card>
        <CardHeader>
          <CardTitle>Live Map</CardTitle>
          <CardDescription>Real-time technician locations and routes</CardDescription>
        </CardHeader>
        <CardContent>
          <TechnicianMap
            technicians={technicianLocations}
            selectedTechnician={selectedTechnician}
            onTechnicianSelect={setSelectedTechnician}
          />
        </CardContent>
      </Card>

      {/* Technician Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {technicianLocations.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            <p>No technicians found or tracking data available.</p>
            <p className="text-sm">Ensure technicians are active and tracking.</p>
          </div>
        ) : (
          technicianLocations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  <Badge className={getStatusColor(location.status)}>{location.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Current Job */}
                {location.currentJob ? (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">{location.currentJob.title}</p>
                    <p className="text-sm text-blue-700">{location.currentJob.locationAddress}</p>
                    {location.journeyStartTime && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                        <Clock className="h-3 w-3" />
                        <span>Active for {formatDuration(location.journeyStartTime)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">No active job</p>
                  </div>
                )}

                {/* Last Location */}
                {location.lastLocation && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Last Location</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {location.lastLocation.latitude.toFixed(6)}, {location.lastLocation.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-muted-foreground ml-6">
                      {new Date(location.lastLocation.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Tracking Controls */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {location.isTracking ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleStopTracking(location.id)}
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Stop Tracking
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleStartTracking(location.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start Tracking
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={() => setSelectedTechnician(location.id)}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>

                  {location.phone && (
                    <Button variant="outline" size="sm">
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
