"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const setupDatabase = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.details || "Setup failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">🌞 Solar Field Operations Setup</CardTitle>
          <CardDescription className="text-center">
            Initialize your database with demo data for Nigerian solar operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result && !error && (
            <div className="text-center space-y-4">
              <p className="text-gray-600">Click the button below to set up your database with:</p>
              <ul className="text-left space-y-2 max-w-md mx-auto">
                <li>✅ User roles and permissions</li>
                <li>✅ Nigerian job types with Naira values</li>
                <li>✅ Demo users (Super Admin, Admin, Technicians)</li>
                <li>✅ Sample jobs in Lagos, Abuja, Port Harcourt</li>
                <li>✅ Multi-technician assignments</li>
              </ul>

              <Button onClick={setupDatabase} disabled={isLoading} size="lg" className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up database...
                  </>
                ) : (
                  "Setup Database"
                )}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Setup Failed:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Success!</strong> Database setup completed successfully!
                </AlertDescription>
              </Alert>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3">🎉 Demo Accounts Created (Password: demo123)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-green-700">Admin Accounts:</h4>
                    <ul className="space-y-1 text-green-600">
                      <li>• superadmin@demo.com</li>
                      <li>• admin@demo.com</li>
                      <li>• supervisor@demo.com</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-700">Technicians:</h4>
                    <ul className="space-y-1 text-green-600">
                      <li>• tech1@demo.com (Emeka)</li>
                      <li>• tech2@demo.com (Adebayo)</li>
                      <li>• tech3@demo.com (Fatima)</li>
                      <li>• tech4@demo.com (Chinedu)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🇳🇬 Nigerian Context Setup:</h3>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Currency: Nigerian Naira (₦)</li>
                  <li>• Locations: Lagos, Abuja, Port Harcourt</li>
                  <li>• Phone format: +234-XXX-XXX-XXXX</li>
                  <li>• Job values: ₦75,000 - ₦750,000</li>
                </ul>
              </div>

              <div className="text-center pt-4">
                <Button asChild size="lg">
                  <a href="/login">Go to Login Page</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
