"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Save, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react"

interface AgreementTemplate {
  _id: string
  partyAName: string
  partyBName: string
  clauses: Array<{
    title: string
    description: string
    partyAPreference: string
    partyBPreference: string
  }>
  effectiveDate: string
  termDuration: string
  jurisdiction: string
}

interface TemplateCreationFromAgreementProps {
  agreement: AgreementTemplate
  onCancel: () => void
  onSuccess: (templateId: string) => void
}

export function TemplateCreationFromAgreement({ 
  agreement, 
  onCancel, 
  onSuccess 
}: TemplateCreationFromAgreementProps) {
  const router = useRouter()
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [selectedClauses, setSelectedClauses] = useState<Set<string>>(
    new Set(agreement.clauses.map(clause => clause.title))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClauseToggle = (clauseTitle: string) => {
    const newSelected = new Set(selectedClauses)
    if (newSelected.has(clauseTitle)) {
      newSelected.delete(clauseTitle)
    } else {
      newSelected.add(clauseTitle)
    }
    setSelectedClauses(newSelected)
  }

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      setError("Template name is required")
      return
    }

    if (selectedClauses.size === 0) {
      setError("Please select at least one clause")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      // Filter selected clauses
      const templateClauses = agreement.clauses.filter(clause => 
        selectedClauses.has(clause.title)
      )

      // Create template data
      const templateData = {
        templatename: templateName,
        description: templateDescription,
        clauses: templateClauses.map(clause => ({
          title: clause.title,
          description: clause.description,
          // Use the agreed preference as the default
          defaultPreference: clause.partyAPreference === clause.partyBPreference 
            ? clause.partyAPreference 
            : 'acceptable'
        })),
        isCustom: true,
        active: true,
        version: "1.0",
        createdby: "user", // This would be the actual user ID
        templatefile: "", // No file for custom templates
        effectiveDate: agreement.effectiveDate,
        termDuration: agreement.termDuration,
        jurisdiction: agreement.jurisdiction
      }

      // In real implementation, this would call the API
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate template creation
      const templateId = `template-${Date.now()}`
      
      onSuccess(templateId)
    } catch (err) {
      console.error("Error creating template:", err)
      setError("Failed to create template. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Template from Agreement</h1>
            <p className="text-muted-foreground">
              Create a reusable template based on this completed agreement
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Template Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>
                  Configure your new template settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Standard NDA Template"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateDescription">Description</Label>
                  <Textarea
                    id="templateDescription"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Describe this template and when to use it..."
                    rows={3}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleCreateTemplate} 
                  disabled={saving || !templateName.trim() || selectedClauses.size === 0}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Template...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Agreement Details & Clause Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Source Agreement</CardTitle>
                <CardDescription>
                  {agreement.partyAName} ↔ {agreement.partyBName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective Date:</span>
                    <span>{new Date(agreement.effectiveDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term Duration:</span>
                    <span>{agreement.termDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jurisdiction:</span>
                    <span>{agreement.jurisdiction}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Clauses</CardTitle>
                <CardDescription>
                  Choose which clauses to include in your template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agreement.clauses.map((clause, index) => {
                    const isSelected = selectedClauses.has(clause.title)
                    const isAgreed = clause.partyAPreference === clause.partyBPreference
                    
                    return (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => handleClauseToggle(clause.title)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{clause.title}</h4>
                              {isAgreed && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Agreed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {clause.description}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              <span>Party A: {clause.partyAPreference}</span>
                              <span className="mx-2">•</span>
                              <span>Party B: {clause.partyBPreference}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {isSelected && (
                                <CheckCircle className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  {selectedClauses.size} of {agreement.clauses.length} clauses selected
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
