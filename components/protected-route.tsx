"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import * as React from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "party" | "admin"
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [hasMounted, setHasMounted] = useState(false)

  // Ensure component is only rendered on the client to avoid hydration issues
  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && hasMounted) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && user.role !== requiredRole) {
        router.push(user.role === "admin" ? "/admin" : "/dashboard")
      }
    }
  }, [user, isLoading, hasMounted, requiredRole, redirectTo, router])

  // Return null during server-side rendering and initial hydration
  if (!hasMounted) {
    return null
  }

  if (isLoading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null
  }

  return <>{children}</>
}