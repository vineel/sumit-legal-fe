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
// import { getTemplateById, Template } from "@/lib/user"
import { getTemplateById, Template } from "@/lib/templateApi"
import { getAgreementById } from "@/lib/agreements"

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
  const templateId = searchParams.get("templateId")
  const agreementId = searchParams.get("agreementId")

  const [currentStep, setCurrentStep] = useState(0)
  const [preferences, setPreferences] = useState<Record<string, ClausePreference>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)
  const [agreement, setAgreement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch template and agreement data
  useEffect(() => {
    const fetchData = async () => {
      if (!templateId || !agreementId) {
        setError("Missing template or agreement ID")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setError("No authentication token found")
          return
        }

        // Fetch template and agreement data in parallel
        const [templateData, agreementData] = await Promise.all([
          getTemplateById(templateId),
          getAgreementById(token, agreementId)
        ])

        setTemplate(templateData)
        setAgreement(agreementData)

        // Initialize preferences based on template clauses
        const initialPreferences: Record<string, ClausePreference> = {}
        if (templateData.clauses && templateData.clauses.length > 0) {
          // Use template clauses if available
          templateData.clauses.forEach((clause, index) => {
            const clauseKey = clause.clause_name || `clause_${index}`
            initialPreferences[clauseKey] = {
              clauseType: clauseKey,
              selectedVariant: null,
              ranking: [index + 1],
              isRejected: false,
            }
          })
        } else {
          // Fallback to intake schema
          intakeSchema.forEach((clause) => {
            initialPreferences[clause.clause_type] = {
              clauseType: clause.clause_type,
              selectedVariant: null,
              ranking: clause.available_variants.map((_, index) => index + 1),
              isRejected: false,
            }
          })
        }
        setPreferences(initialPreferences)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load template or agreement data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [templateId, agreementId])

  // Use template clauses if available, otherwise fallback to intake schema
  const availableClauses = template?.clauses && template.clauses.length > 0 
    ? template.clauses.map((clause, index) => ({
        clause_type: clause.clause_name || `clause_${index}`,
        question_text: clause.clause_name || `Clause ${index + 1}`,
        field_required: true,
        input_required_for_drafting: true,
        available_variants: clause.variants?.map(v => v.variant_label) || [
          "Standard",
          "Custom"
        ],
        additional_notes: ""
      }))
    : intakeSchema

  const currentClause = availableClauses[currentStep]
  const totalSteps = availableClauses.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading template and agreement data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

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

      {/* Template & Agreement Info */}
      {(template || agreement) && (
        <div className="border-b bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {template && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Template</h3>
                  <p className="font-medium">{template.templatename}</p>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                </div>
              )}
              {agreement && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Agreement</h3>
                  <p className="font-medium">
                    {agreement.partyAName} ↔ {agreement.partyBEmail || "Invited Party"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {agreement.status || "Draft"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
