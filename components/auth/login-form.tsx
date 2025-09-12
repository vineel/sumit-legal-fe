"use client"

import * as React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  // If already logged in as admin, block user login and send to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      router.replace("/admin")
    }
  }, [user, router])

  // Check for pending approval message
  useEffect(() => {
    const message = searchParams.get("message")
    if (message === "pending_approval") {
      setSuccessMessage("Account created successfully! Your account is pending admin approval. You will receive an email notification once approved.")
    }
    if (message === "account_inactive") {
      setError("Your account has been deactivated. Please contact support for assistance.")
    }
  }, [searchParams])


  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setError("")
  //   setIsLoading(true)

  //   try {
  //     const success = await login(email, password)
  //     if (success) {
  //       router.push("/dashboard")
  //     } else {
  //       setError("Invalid email or password")
  //     }
  //   } catch (err) {
  //     setError("An error occurred. Please try again.")
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setIsLoading(true)

  const result = await login(email, password)

  if (result.success) {
    router.push("/dashboard")
  } else {
    setError(result.message || "Login failed. Please try again.")
  }

  setIsLoading(false)
}


  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
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
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link href="/forgot-password" className="text-sm text-accent hover:underline">
            Forgot your password?
          </Link>
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </div>
        </div>

        {/* <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Demo Accounts:</p>
          <div className="space-y-1 text-xs font-mono">
            <div>party1@demo.com / demo123</div>
            <div>party2@demo.com / demo123</div>
          </div>
        </div> */}
      </CardContent>
    </Card>
  )
}
