"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sun, Zap, MapPin, Users } from "lucide-react"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSetup, setIsSetup] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
      return
    }

    // Check if database is set up
    checkDatabaseSetup()
  }, [router])

  const checkDatabaseSetup = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com", password: "test" }),
      })

      // If we get any response (even error), database is set up
      setIsSetup(true)
    } catch (error) {
      // If we get network error, database might not be set up
      setIsSetup(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Solar Field Operations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Sun className="h-16 w-16 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Solar Field Operations</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete field operations management system for Nigerian solar installations, maintenance, and technician
            tracking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Job Management</CardTitle>
              <CardDescription>
                Assign and track solar installations, maintenance, and repairs across Nigeria
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Live Tracking</CardTitle>
              <CardDescription>Real-time GPS tracking of technicians with OpenStreetMap integration</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Manage technicians, earnings, and performance across multiple locations</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Get Started</CardTitle>
              <CardDescription className="text-center">
                {isSetup
                  ? "Database is ready! Sign in to access your dashboard."
                  : "Set up your database first, then sign in to get started."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSetup && (
                <Button onClick={() => router.push("/setup")} className="w-full" size="lg">
                  Setup Database
                </Button>
              )}

              <Button
                onClick={() => router.push("/login")}
                variant={isSetup ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>

              <Button onClick={() => router.push("/register")} variant="outline" className="w-full">
                Register New Account
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 text-sm text-gray-500">
          <p>🇳🇬 Built for Nigerian Solar Operations</p>
          <p>Currency: Nigerian Naira (₦) • Timezone: West Africa Time (WAT)</p>
        </div>
      </div>
    </div>
  )
}
