"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect based on role
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">AI-Assisted Legal Collaboration</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Streamline NDA creation and negotiation with intelligent clause matching and real-time collaboration
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
        <div className="mt-8 p-4 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground mb-2">Quick Access:</p>
          <div className="flex gap-4 justify-center text-sm">
            <Link href="/login" className="text-accent hover:underline">
              Party Login
            </Link>
            <Link href="/admin/login" className="text-accent hover:underline">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
