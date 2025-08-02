"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Info, Sun, Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    console.log("[Login Debug] handleSubmit triggered.");

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
        localStorage.setItem("userEmail", data.email); // Store user email
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

  const useDefaultAdmin = () => {
    setEmail("admin@solar.com")
    setPassword("admin123")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 md:p-0">
      <div className="relative flex w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Left Panel: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="absolute top-4 left-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome Back!</h2>
            <p className="text-gray-600 mb-8 text-center">Please sign in to your Solar Field Ops account</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 top-6"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="remember-me" className="ml-2 text-gray-700">Remember me</Label>
                </div>
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Forgot Password?</a>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-navy-blue text-white py-3 px-4 rounded-md hover:bg-navy-blue-dark transition-colors duration-200 flex items-center justify-center font-bold text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-base text-gray-600 mt-6">
                Don't have an account?{' '}
                <Button type="button" variant="link" onClick={() => router.push("/register")} className="text-blue-600 hover:text-blue-500 p-0 h-auto text-base font-semibold">
                  Register
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel: Graphic */}
        <div className="hidden md:flex md:w-1/2 bg-navy-blue relative items-center justify-center p-16">
          <div className="text-center text-white z-10 space-y-4">
            <h2 className="text-5xl font-bold mb-4">Welcome to Solar Field Ops!</h2>
            <p className="text-xl mb-8">Manage your solar operations with ease and efficiency.</p>
          </div>
          <img
            src="/loginimg.png" // Assuming loginimg.png is in the public folder
            alt="Dashboard Graphic"
            className="absolute inset-0 w-full h-full object-cover opacity-70 transform rotate-3 scale-110"
            style={{ filter: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
