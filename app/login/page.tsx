"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Info } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        router.push("/dashboard")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("demo123")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">🌞 Solar Field Operations</CardTitle>
            <CardDescription>Sign in to your Nigerian solar operations dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Demo Accounts
            </CardTitle>
            <CardDescription>Click to quickly fill login form (Password: demo123)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin("admin@demo.com")}
                className="justify-start"
              >
                👨‍💼 Admin - John Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin("supervisor@demo.com")}
                className="justify-start"
              >
                👩‍💼 Supervisor - Sarah Supervisor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin("tech1@demo.com")}
                className="justify-start"
              >
                🔧 Technician - Emeka Okafor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin("tech2@demo.com")}
                className="justify-start"
              >
                🔧 Technician - Adebayo Adeyemi
              </Button>
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t">
              💡 Need to setup database first?{" "}
              <a href="/setup" className="text-blue-600 hover:underline">
                Go to Setup
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
