"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, X, Info, Lightbulb, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import the intake schema data
const intakeSchema = [
  {
    clause_type: "Nature of NDA (Mutual vs. Unilateral)",
    question_text: "Will both parties be sharing confidential information (mutual), or only one party (unilateral)?",
    field_required: true,
    input_required_for_drafting: true,
    human_ranking_of_preference: [1, 2, 3],
    available_variants: ["Standard Mutual", "Flexible Mutual with Carveouts", "Unilateral Discloser-Only"],
    additional_notes:
      "Mutual NDAs provide symmetrical protection. Unilateral NDAs favor the Discloser and should be used when only one side shares sensitive information.",
  },
  {
    clause_type: "Definitions",
    question_text: "What level of specificity should be used to define 'Confidential Information'?",
    field_required: true,
    input_required_for_drafting: true,
    human_ranking_of_preference: [1, 2, 3],
    available_variants: ["Comprehensive", "Lean Definitions", "Minimal Definitions"],
    additional_notes:
      "Comprehensive definitions cover a broader scope of information. Minimal definitions are narrower and may exclude oral or unmarked disclosures.",
  },
  {
    clause_type: "Confidentiality Obligations",
    question_text: "What standard of care should apply for protecting Confidential Information?",
    field_required: true,
    input_required_for_drafting: true,
    human_ranking_of_preference: [1, 2, 3],
    available_variants: [
      "Mutual Balanced",
      "Strict Mutual (Enhanced Care Standard)",
      "Unilateral Recipient Obligations",
    ],
    additional_notes: "Strict care standards offer stronger protection but may be burdensome in practice.",
  },
]

interface IntakeFormProps {
  onComplete: () => void
}

export function IntakeForm({ onComplete }: IntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [showAIGuidance, setShowAIGuidance] = useState(false)

  const totalSteps = intakeSchema.length
  const progress = ((currentStep + 1) / totalSteps) * 100
  const currentClause = intakeSchema[currentStep]

  const handleRankingChange = (variant: string, rank: number | "x") => {
    const clauseType = currentClause.clause_type
    setResponses((prev) => ({
      ...prev,
      [clauseType]: {
        ...prev[clauseType],
        rankings: {
          ...prev[clauseType]?.rankings,
          [variant]: rank,
        },
      },
    }))
  }

  const handleNotesChange = (notes: string) => {
    const clauseType = currentClause.clause_type
    setResponses((prev) => ({
      ...prev,
      [clauseType]: {
        ...prev[clauseType],
        notes,
      },
    }))
  }

  const canProceed = () => {
    const clauseType = currentClause.clause_type
    const response = responses[clauseType]
    if (!response?.rankings) return false

    // Check if at least one variant has a numeric ranking
    return Object.values(response.rankings).some((rank) => typeof rank === "number")
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getRankingColor = (rank: number | "x") => {
    if (rank === "x") return "bg-destructive text-destructive-foreground"
    if (rank === 1) return "bg-primary text-primary-foreground"
    if (rank === 2) return "bg-accent text-accent-foreground"
    if (rank === 3) return "bg-secondary text-secondary-foreground"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Clause Preference Intake</h1>
              <p className="text-muted-foreground">
                Step {currentStep + 1} of {totalSteps} - {currentClause.clause_type}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAIGuidance(!showAIGuidance)} className="gap-2">
              <Lightbulb className="w-4 h-4" />
              AI Guidance
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  {currentClause.clause_type}
                  {currentClause.field_required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-base">{currentClause.question_text}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ranking Interface */}
                <div>
                  <h3 className="font-medium mb-4">Rank your preferences (1 = most preferred, X = unacceptable)</h3>
                  <div className="space-y-3">
                    {currentClause.available_variants.map((variant, index) => (
                      <div key={variant} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <Label className="font-medium">{variant}</Label>
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, "x"].map((rank) => (
                            <button
                              key={rank}
                              onClick={() => handleRankingChange(variant, rank as number | "x")}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                                responses[currentClause.clause_type]?.rankings?.[variant] === rank
                                  ? getRankingColor(rank as number | "x")
                                  : "border-border hover:border-primary"
                              }`}
                            >
                              {rank === "x" ? <X className="w-4 h-4" /> : rank}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="notes" className="font-medium">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any specific requirements or concerns for this clause..."
                    value={responses[currentClause.clause_type]?.notes || ""}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="gap-2 bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                    {currentStep === totalSteps - 1 ? "Complete Intake" : "Next"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clause Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Clause Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{currentClause.additional_notes}</p>
              </CardContent>
            </Card>

            {/* AI Guidance */}
            {showAIGuidance && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-heading flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Based on your role as a Discloser, consider prioritizing comprehensive definitions and strict
                      confidentiality obligations.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Suggested Rankings:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Comprehensive</span>
                        <Badge className="bg-primary/10 text-primary">1st</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Lean Definitions</span>
                        <Badge className="bg-accent/10 text-accent">2nd</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimal Definitions</span>
                        <Badge className="bg-destructive/10 text-destructive">Avoid</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-heading">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {intakeSchema.map((clause, index) => (
                    <div key={clause.clause_type} className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index < currentStep ? "bg-primary" : index === currentStep ? "bg-accent" : "bg-muted"
                        }`}
                      />
                      <span className={index <= currentStep ? "text-foreground" : "text-muted-foreground"}>
                        {clause.clause_type}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
