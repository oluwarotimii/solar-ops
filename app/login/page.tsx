"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sun } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Demo login - check against demo accounts
    const demoAccounts = {
      "superadmin@demo.com": { role: "Super Admin", name: "Super Admin" },
      "admin@demo.com": { role: "Admin", name: "John Admin" },
      "supervisor@demo.com": { role: "Supervisor", name: "Sarah Supervisor" },
      "tech1@demo.com": { role: "Technician", name: "Mike Johnson" },
      "tech2@demo.com": { role: "Technician", name: "David Smith" },
      "tech3@demo.com": { role: "Technician", name: "Lisa Wilson" },
      "tech4@demo.com": { role: "Technician", name: "Robert Brown" },
    }

    setTimeout(() => {
      if (demoAccounts[email as keyof typeof demoAccounts] && password === "demo123") {
        // Store demo user info
        localStorage.setItem(
          "demoUser",
          JSON.stringify({
            email,
            ...demoAccounts[email as keyof typeof demoAccounts],
          }),
        )
        router.push("/dashboard")
      } else {
        setError("Invalid credentials. Use demo accounts with password 'demo123'")
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Sun className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Solar Field Ops</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>

            <div className="text-center">
              <Button variant="link" onClick={() => router.push("/register")}>
                Don't have an account? Register
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
