"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Sun, EyeIcon, EyeOffIcon, ArrowLeft } from "lucide-react"
import zxcvbn from 'zxcvbn'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setFormData((prev) => ({ ...prev, password: newPassword }))
    const result = zxcvbn(newPassword)
    setPasswordStrength(result.score * 25) // Score is 0-4, convert to 0-100
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (passwordStrength < 50) { // Require at least a 'fair' password strength
      setError("Password is too weak. Please use a stronger password.")
      setLoading(false)
      return
    }

    // Make actual API call
    try {
      console.log('[Frontend] Sending registration data:', formData);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null, // Send null if empty
        }),
      });

      const data = await response.json();
      console.log('[Frontend] Registration API response:', data);

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      console.error('[Frontend] Registration fetch error:', err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center  justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
        <Card className="w-full max-w-md mt-10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Sun className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Registration Submitted</CardTitle>
            <CardDescription>
              Your account is pending approval. You will be notified once an administrator approves your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="relative flex w-full md:max-w-6xl mx-auto bg-white md:rounded-xl shadow-lg overflow-hidden">
        {/* Left Panel: Register Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full relative">
            <div className="absolute top-0 left-0">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Join Us!</h2>
            <p className="text-gray-600 mb-8 text-center">Create your Solar Field Ops account</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    required
                    className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    required
                    className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone.startsWith("+234") ? formData.phone : "+234" + formData.phone}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (!newValue.startsWith("+234")) {
                      setFormData((prev) => ({ ...prev, phone: "+234" + newValue.replace(/^\+234/, '') }));
                    } else {
                      setFormData((prev) => ({ ...prev, phone: newValue }));
                    }
                  }}
                  required
                  placeholder="+2348012345678"
                  className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">Toggle password visibility</span>
                  </Button>
                </div>
                {formData.password && (
                  <Progress value={passwordStrength} className="w-full" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                    className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">Toggle confirm password visibility</span>
                  </Button>
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-navy-blue text-white py-3 px-4 rounded-md hover:bg-navy-blue-dark transition-colors duration-200 flex items-center justify-center font-bold text-lg"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Register
              </Button>

              <div className="text-center text-base text-gray-600 mt-6">
                Already have an account?{' '}
                <Button type="button" variant="link" onClick={() => router.push("/login")} className="text-blue-600 hover:text-blue-500 p-0 h-auto text-base font-semibold">
                  Sign In
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

