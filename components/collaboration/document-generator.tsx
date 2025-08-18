"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Eye, AlertTriangle } from "lucide-react"

interface DocumentGeneratorProps {
  comparisonResults: any[]
  sessionId: string
}

export function DocumentGenerator({ comparisonResults, sessionId }: DocumentGeneratorProps) {
  const [showPreview, setShowPreview] = useState(false)

  const unresolvedCount = comparisonResults.filter((result) => result.isUnresolved).length
  const resolvedCount = comparisonResults.length - unresolvedCount

  const generateDocumentText = () => {
    return `
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on [DATE] between Brad's Guitars ("Disclosing Party") and Meemer VC ("Receiving Party").

1. NATURE OF NDA (MUTUAL VS. UNILATERAL)
Each party anticipates disclosing certain confidential or proprietary information to the other in connection with their potential business relationship. Accordingly, both parties agree to maintain such information in confidence and to use it solely as provided in this Agreement.

2. DEFINITIONS
Confidential Information refers to any information, whether disclosed orally, visually, or in writing, that a reasonable person would consider confidential under the circumstances. This may include, without limitation, technical data, product plans, and business forecasts.

3. PURPOSE OF DISCLOSURE
The Confidential Information shall be used solely for evaluating a potential business relationship concerning guitar manufacturing and investment opportunities and for no other purpose.

4. USE RESTRICTIONS
The Recipient shall use the Confidential Information solely for the Purpose stated in this Agreement and shall not use such information for its own benefit or for the benefit of any third party, except as expressly permitted herein.

5. TERM OF CONFIDENTIALITY
[🔴 UNRESOLVED – INSERT NEGOTIATED LANGUAGE HERE]

[Additional clauses would continue...]

---
Generated on: ${new Date().toLocaleDateString()}
Session ID: ${sessionId}
Status: ${unresolvedCount > 0 ? "DRAFT - Contains unresolved clauses" : "FINAL"}
    `.trim()
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Generation
          </CardTitle>
          <p className="text-sm text-muted-foreground">Generate the final NDA based on resolved preferences</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{resolvedCount}</div>
              <div className="text-sm text-green-600">Resolved Clauses</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-800">{unresolvedCount}</div>
              <div className="text-sm text-red-600">Unresolved Clauses</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">
                {Math.round((resolvedCount / comparisonResults.length) * 100)}%
              </div>
              <div className="text-sm text-blue-600">Complete</div>
            </div>
          </div>

          {unresolvedCount > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Warning:</strong> This document contains {unresolvedCount} unresolved clause
                {unresolvedCount > 1 ? "s" : ""} that require negotiation before finalization.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button onClick={() => setShowPreview(!showPreview)} variant="outline" className="gap-2 bg-transparent">
              <Eye className="w-4 h-4" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
            <Button className="gap-2" disabled={unresolvedCount > 0}>
              <Download className="w-4 h-4" />
              Download Final Document
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export Draft
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Document Preview</span>
              <Badge variant={unresolvedCount > 0 ? "destructive" : "default"}>
                {unresolvedCount > 0 ? "DRAFT" : "FINAL"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-6 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{generateDocumentText()}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <p className="text-sm text-muted-foreground">Choose your preferred format for the document</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 bg-transparent">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Microsoft Word</span>
              </div>
              <span className="text-sm text-muted-foreground">Editable .docx format for further customization</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 bg-transparent">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="font-medium">PDF Document</span>
              </div>
              <span className="text-sm text-muted-foreground">Final formatted document ready for signatures</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
