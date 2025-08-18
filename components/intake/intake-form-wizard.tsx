"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Home, Eye } from "lucide-react"
import { ClauseRankingStep } from "./clause-ranking-step"
import { DocumentPreview } from "./document-preview"
import { intakeSchema } from "@/lib/intake-schema"

export type ClausePreference = {
  clauseType: string
  selectedVariant: string | null
  ranking: number[]
  isRejected: boolean
  aiSuggestion?: string
}

export function IntakeFormWizard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  const [currentStep, setCurrentStep] = useState(0)
  const [preferences, setPreferences] = useState<Record<string, ClausePreference>>({})
  const [showPreview, setShowPreview] = useState(false)

  // Initialize preferences
  useEffect(() => {
    const initialPreferences: Record<string, ClausePreference> = {}
    intakeSchema.forEach((clause) => {
      initialPreferences[clause.clause_type] = {
        clauseType: clause.clause_type,
        selectedVariant: null,
        ranking: clause.available_variants.map((_, index) => index + 1),
        isRejected: false,
      }
    })
    setPreferences(initialPreferences)
  }, [])

  const currentClause = intakeSchema[currentStep]
  const totalSteps = intakeSchema.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  const updatePreference = (clauseType: string, preference: Partial<ClausePreference>) => {
    setPreferences((prev) => ({
      ...prev,
      [clauseType]: { ...prev[clauseType], ...preference },
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setShowPreview(true)
    }
  }

  const handlePrevious = () => {
    if (showPreview) {
      setShowPreview(false)
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // In a real app, this would submit to the backend
    console.log("Submitting preferences:", preferences)
    router.push(`/collaboration?session=${sessionId || "new"}`)
  }

  const canProceed = () => {
    if (!currentClause) return false
    const preference = preferences[currentClause.clause_type]
    return preference && (preference.selectedVariant || preference.isRejected)
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <div className="text-sm text-muted-foreground">Session: {sessionId || "New NDA"}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <DocumentPreview preferences={preferences} onBack={handlePrevious} onSubmit={handleSubmit} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="text-sm text-muted-foreground">Session: {sessionId || "New NDA"}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-heading font-bold">NDA Intake Form</h1>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Clause Step */}
        {currentClause && (
          <ClauseRankingStep
            clause={currentClause}
            preference={preferences[currentClause.clause_type]}
            onUpdate={(preference) => updatePreference(currentClause.clause_type, preference)}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="gap-2"
              disabled={Object.keys(preferences).length === 0}
            >
              <Eye className="w-4 h-4" />
              Preview Document
            </Button>

            <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
              {currentStep === totalSteps - 1 ? "Review & Submit" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
