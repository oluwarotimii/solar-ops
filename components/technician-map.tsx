"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation, Maximize2, Minimize2 } from "lucide-react"

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

interface TechnicianMapProps {
  technicians: TechnicianLocation[]
  selectedTechnician: string | null
  onTechnicianSelect: (id: string | null) => void
}

declare global {
  interface Window {
    L: any
  }
}

export default function TechnicianMap({ technicians, selectedTechnician, onTechnicianSelect }: TechnicianMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== "undefined" && !window.L) {
        // Load Leaflet CSS
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)

        // Load Leaflet JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => {
          setMapLoaded(true)
        }
        document.head.appendChild(script)
      } else if (window.L) {
        setMapLoaded(true)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstanceRef.current) {
      // Center on Lagos, Nigeria
      const map = window.L.map(mapRef.current).setView([6.5244, 3.3792], 10)

      // Add OpenStreetMap tiles
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    }
  }, [mapLoaded])

  // Update markers when technicians change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return

    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker)
    })
    markersRef.current.clear()

    // Add new markers
    technicians.forEach((tech) => {
      if (!tech.lastLocation) return

      const { latitude, longitude } = tech.lastLocation
      const isSelected = selectedTechnician === tech.id

      // Create custom icon based on status
      const iconColor = getStatusColor(tech.status)
      const iconSize = isSelected ? [40, 40] : [30, 30]

      const customIcon = window.L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            width: ${iconSize[0]}px;
            height: ${iconSize[1]}px;
            background-color: ${iconColor};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ${isSelected ? "transform: scale(1.2);" : ""}
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: iconSize,
        iconAnchor: [iconSize[0] / 2, iconSize[1]],
      })

      const marker = window.L.marker([latitude, longitude], { icon: customIcon })
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${tech.name}</h3>
            <p style="margin: 0 0 4px 0; color: #666;">Status: <span style="color: ${iconColor}; font-weight: bold;">${tech.status}</span></p>
            ${
              tech.currentJob
                ? `
              <p style="margin: 0 0 4px 0; color: #666;">Job: ${tech.currentJob.title}</p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">${tech.currentJob.locationAddress}</p>
            `
                : '<p style="margin: 0 0 8px 0; color: #666;">No active job</p>'
            }
            <p style="margin: 0; color: #999; font-size: 11px;">
              Last seen: ${new Date(tech.lastLocation.timestamp).toLocaleString()}
            </p>
          </div>
        `)
        .on("click", () => {
          onTechnicianSelect(isSelected ? null : tech.id)
        })
        .addTo(map)

      markersRef.current.set(tech.id, marker)

      // Add tracking path for active technicians
      if (tech.isTracking && tech.status === "active") {
        // This would be enhanced with actual route data
        const circle = window.L.circle([latitude, longitude], {
          color: iconColor,
          fillColor: iconColor,
          fillOpacity: 0.1,
          radius: 100,
        }).addTo(map)

        // Store circle reference for cleanup
        markersRef.current.set(`${tech.id}-circle`, circle)
      }
    })

    // Auto-fit map to show all technicians
    if (technicians.length > 0) {
      const validLocations = technicians
        .filter((t) => t.lastLocation)
        .map((t) => [t.lastLocation!.latitude, t.lastLocation!.longitude])

      if (validLocations.length > 0) {
        const group = new window.L.featureGroup(validLocations.map((loc) => window.L.marker(loc)))
        map.fitBounds(group.getBounds().pad(0.1))
      }
    }
  }, [technicians, selectedTechnician, mapLoaded, onTechnicianSelect])

  // Focus on selected technician
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedTechnician) return

    const selectedTech = technicians.find((t) => t.id === selectedTechnician)
    if (selectedTech?.lastLocation) {
      const { latitude, longitude } = selectedTech.lastLocation
      mapInstanceRef.current.setView([latitude, longitude], 15, {
        animate: true,
        duration: 1,
      })
    }
  }, [selectedTechnician, technicians])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10B981" // Green
      case "idle":
        return "#F59E0B" // Yellow
      case "offline":
        return "#EF4444" // Red
      default:
        return "#6B7280" // Gray
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Trigger map resize after fullscreen toggle
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 100)
  }

  const selectedTech = technicians.find((t) => t.id === selectedTechnician)

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
        <div
          ref={mapRef}
          className={`bg-gray-100 rounded-lg relative overflow-hidden border ${isFullscreen ? "h-screen" : "h-96"}`}
        >
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 space-y-2">
            <Button variant="outline" size="sm" className="bg-white shadow-md" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-white rounded-lg shadow-md p-3 space-y-2">
              <div className="text-xs font-medium mb-2">Technician Status</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Idle</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Offline</span>
              </div>
            </div>
          </div>

          {/* Attribution */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
            © OpenStreetMap
          </div>
        </div>

        {/* Fullscreen Selected Technician Details */}
        {isFullscreen && selectedTech && (
          <div className="absolute top-4 left-4 z-10 w-80">
            <Card className="p-4 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{selectedTech.name}</h3>
                    <Badge
                      className={`${
                        getStatusColor(selectedTech.status) === "#10B981"
                          ? "bg-green-100 text-green-800"
                          : getStatusColor(selectedTech.status) === "#F59E0B"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedTech.status}
                    </Badge>
                  </div>

                  {selectedTech.currentJob && (
                    <div className="text-sm">
                      <p className="font-medium">{selectedTech.currentJob.title}</p>
                      <p className="text-muted-foreground">{selectedTech.currentJob.locationAddress}</p>
                    </div>
                  )}

                  {selectedTech.lastLocation && (
                    <div className="text-xs text-muted-foreground">
                      <p>Last seen: {new Date(selectedTech.lastLocation.timestamp).toLocaleString()}</p>
                      <p>Accuracy: ±{selectedTech.lastLocation.accuracy}m</p>
                      <p>
                        Coordinates: {selectedTech.lastLocation.latitude.toFixed(6)},{" "}
                        {selectedTech.lastLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="sm" onClick={() => onTechnicianSelect(null)}>
                  ×
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Selected Technician Details (Non-fullscreen) */}
      {!isFullscreen && selectedTech && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{selectedTech.name}</h3>
                <Badge
                  className={`${
                    getStatusColor(selectedTech.status) === "#10B981"
                      ? "bg-green-100 text-green-800"
                      : getStatusColor(selectedTech.status) === "#F59E0B"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedTech.status}
                </Badge>
              </div>

              {selectedTech.currentJob && (
                <div className="text-sm">
                  <p className="font-medium">{selectedTech.currentJob.title}</p>
                  <p className="text-muted-foreground">{selectedTech.currentJob.locationAddress}</p>
                </div>
              )}

              {selectedTech.lastLocation && (
                <div className="text-xs text-muted-foreground">
                  <p>Last seen: {new Date(selectedTech.lastLocation.timestamp).toLocaleString()}</p>
                  <p>Accuracy: ±{selectedTech.lastLocation.accuracy}m</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedTech.lastLocation && mapInstanceRef.current) {
                    mapInstanceRef.current.setView(
                      [selectedTech.lastLocation.latitude, selectedTech.lastLocation.longitude],
                      17,
                      { animate: true },
                    )
                  }
                }}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Center
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onTechnicianSelect(null)}>
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
