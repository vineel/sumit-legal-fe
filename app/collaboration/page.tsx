"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { RealTimeCollaborationWorkspace } from "@/components/real-time-collaboration-workspace"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function CollaborationContent() {
  const searchParams = useSearchParams()
  const agreementId = searchParams.get('agreementId')

  if (!agreementId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Agreement ID Required</h1>
          <p className="text-muted-foreground">Please provide a valid agreement ID to access the collaboration workspace.</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="party">
      <RealTimeCollaborationWorkspace agreementId={agreementId} />
    </ProtectedRoute>
  )
}

export default function CollaborationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we load the collaboration workspace.</p>
        </div>
      </div>
    }>
      <CollaborationContent />
    </Suspense>
  )
}
