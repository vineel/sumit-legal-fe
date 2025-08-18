"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, Download, Send } from "lucide-react"
import type { ClausePreference } from "./intake-form-wizard"

interface DocumentPreviewProps {
  preferences: Record<string, ClausePreference>
  onBack: () => void
  onSubmit: () => void
}

export function DocumentPreview({ preferences, onBack, onSubmit }: DocumentPreviewProps) {
  const [previewType, setPreviewType] = useState<"best" | "worst">("best")

  // Mock document generation based on preferences
  const generatePreview = (type: "best" | "worst") => {
    const clauses = Object.entries(preferences).map(([clauseType, preference]) => {
      if (preference.isRejected) {
        return {
          title: clauseType,
          content: "[CLAUSE REJECTED - Will need negotiation]",
          status: "rejected" as const,
        }
      }

      const variants = getClauseVariants(clauseType)
      let selectedVariant = preference.selectedVariant

      if (type === "worst") {
        // For worst case, assume the least preferred option
        const worstRankIndex = Math.max(...preference.ranking) - 1
        selectedVariant = variants[worstRankIndex] || selectedVariant
      }

      return {
        title: clauseType,
        content: generateClauseText(clauseType, selectedVariant || variants[0]),
        status: preference.selectedVariant ? "selected" : ("estimated" as const),
        variant: selectedVariant || variants[0],
      }
    })

    return clauses
  }

  const getClauseVariants = (clauseType: string) => {
    // This would come from the intake schema in a real app
    const variantMap: Record<string, string[]> = {
      "Nature of NDA (Mutual vs. Unilateral)": [
        "Standard Mutual",
        "Flexible Mutual with Carveouts",
        "Unilateral Discloser-Only",
      ],
      Definitions: ["Comprehensive", "Lean Definitions", "Minimal Definitions"],
      // Add more as needed
    }
    return variantMap[clauseType] || ["Standard Option", "Alternative Option", "Minimal Option"]
  }

  const generateClauseText = (clauseType: string, variant: string) => {
    // Mock clause text generation
    const clauseTexts: Record<string, Record<string, string>> = {
      "Nature of NDA (Mutual vs. Unilateral)": {
        "Standard Mutual":
          "This Agreement shall be mutual, with both parties having the right to disclose and receive Confidential Information under the same terms and conditions.",
        "Flexible Mutual with Carveouts":
          "This Agreement shall be mutual, with both parties having the right to disclose and receive Confidential Information, subject to specific carveouts as defined herein.",
        "Unilateral Discloser-Only":
          "This Agreement shall be unilateral, with only the Disclosing Party sharing Confidential Information with the Receiving Party.",
      },
      Definitions: {
        Comprehensive:
          "'Confidential Information' means all information, whether written, oral, electronic, visual, or in any other form, that is disclosed by one party to the other, including but not limited to technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.",
        "Lean Definitions":
          "'Confidential Information' means information that is marked as confidential or proprietary, or that would reasonably be considered confidential under the circumstances of disclosure.",
        "Minimal Definitions":
          "'Confidential Information' means information specifically marked as 'Confidential' in writing by the disclosing party.",
      },
    }

    return clauseTexts[clauseType]?.[variant] || `[${variant} clause text for ${clauseType}]`
  }

  const bestCasePreview = generatePreview("best")
  const worstCasePreview = generatePreview("worst")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "selected":
        return "bg-green-100 text-green-800"
      case "estimated":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back to Form
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">Document Preview</h1>
            <p className="text-muted-foreground">Review your NDA before submission</p>
          </div>
        </div>
      </div>

      {/* Preview Tabs */}
      <Tabs value={previewType} onValueChange={(value) => setPreviewType(value as "best" | "worst")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="best">Best Case Scenario</TabsTrigger>
          <TabsTrigger value="worst">Worst Case Scenario</TabsTrigger>
        </TabsList>

        <TabsContent value="best" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Best Case NDA Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This preview assumes optimal matching with your counterparty's preferences
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {bestCasePreview.map((clause, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{clause.title}</h3>
                    <Badge className={getStatusColor(clause.status)}>
                      {clause.status === "selected"
                        ? "Your Selection"
                        : clause.status === "estimated"
                          ? "Estimated Match"
                          : "Needs Resolution"}
                    </Badge>
                  </div>
                  {clause.variant && <p className="text-sm text-muted-foreground mb-2">Variant: {clause.variant}</p>}
                  <p className="text-sm leading-relaxed">{clause.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worst" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Worst Case NDA Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This preview shows potential outcomes if preferences don't align well
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {worstCasePreview.map((clause, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{clause.title}</h3>
                    <Badge className={getStatusColor(clause.status)}>
                      {clause.status === "selected"
                        ? "Your Selection"
                        : clause.status === "estimated"
                          ? "Compromise Option"
                          : "Needs Resolution"}
                    </Badge>
                  </div>
                  {clause.variant && <p className="text-sm text-muted-foreground mb-2">Variant: {clause.variant}</p>}
                  <p className="text-sm leading-relaxed">{clause.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center mt-8">
        <div className="text-sm text-muted-foreground">
          Ready to submit your preferences? Your counterparty will complete their intake, and the system will generate
          the final NDA.
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export Preview
          </Button>
          <Button onClick={onSubmit} className="gap-2">
            <Send className="w-4 h-4" />
            Submit Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}
