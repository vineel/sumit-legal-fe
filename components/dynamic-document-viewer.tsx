"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Download,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Users,
  Scale,
  Eye,
  MessageSquare,
} from "lucide-react"
import type { ClausePreference } from "./intake/intake-form-wizard"

interface Party {
  id: string
  name: string
  preferences: Record<string, ClausePreference>
  status: "pending" | "completed" | "reviewing"
}

interface DynamicDocumentViewerProps {
  currentParty: Party
  otherParty?: Party
  sessionId: string
  documentType: "nda" | "contract"
}

type ClauseStatus = "agreed" | "conflict" | "pending" | "rejected"

interface ResolvedClause {
  clauseType: string
  title: string
  selectedVariant: string
  status: ClauseStatus
  confidence: number
  reasoning: string
  alternativeOptions?: string[]
  requiresNegotiation: boolean
}

export function DynamicDocumentViewer({
  currentParty,
  otherParty,
  sessionId,
  documentType = "nda",
}: DynamicDocumentViewerProps) {
  const [viewMode, setViewMode] = useState<"live" | "best" | "worst">("live")
  const [showCoverPage, setShowCoverPage] = useState(true)

  const resolvedClauses = useMemo(() => {
    const clauses: ResolvedClause[] = []

    Object.entries(currentParty.preferences).forEach(([clauseType, currentPref]) => {
      const otherPref = otherParty?.preferences[clauseType]

      let status: ClauseStatus = "pending"
      let selectedVariant = currentPref.selectedVariant || ""
      let confidence = 50
      let reasoning = "Waiting for other party's preferences"
      let requiresNegotiation = false

      if (currentPref.isRejected) {
        status = "rejected"
        confidence = 0
        reasoning = "You have rejected all variants of this clause"
        requiresNegotiation = true
      } else if (otherPref) {
        if (otherPref.isRejected) {
          status = "conflict"
          confidence = 0
          reasoning = "Other party has rejected all variants"
          requiresNegotiation = true
        } else if (currentPref.selectedVariant === otherPref.selectedVariant) {
          status = "agreed"
          confidence = 95
          reasoning = "Both parties selected the same variant"
        } else {
          // Find best compromise based on rankings
          const currentRanking = currentPref.ranking || []
          const otherRanking = otherPref.ranking || []

          let bestMatch = ""
          let bestScore = -1

          currentRanking.forEach((currentRank, currentIndex) => {
            const otherIndex = otherRanking.findIndex((rank) => rank === currentRank)
            if (otherIndex !== -1) {
              const score = currentRanking.length - currentIndex + (otherRanking.length - otherIndex)
              if (score > bestScore) {
                bestScore = score
                bestMatch = getVariantByRank(clauseType, currentRank)
              }
            }
          })

          if (bestMatch) {
            selectedVariant = bestMatch
            status = "agreed"
            confidence = Math.min(90, bestScore * 10)
            reasoning = `Compromise option based on both parties' rankings`
          } else {
            status = "conflict"
            confidence = 20
            reasoning = "No acceptable compromise found"
            requiresNegotiation = true
          }
        }
      }

      clauses.push({
        clauseType,
        title: getClauseTitle(clauseType),
        selectedVariant,
        status,
        confidence,
        reasoning,
        requiresNegotiation,
      })
    })

    return clauses
  }, [currentParty.preferences, otherParty?.preferences])

  const getVariantByRank = (clauseType: string, rank: number): string => {
    const variants = getClauseVariants(clauseType)
    return variants[rank - 1] || variants[0]
  }

  const getClauseVariants = (clauseType: string): string[] => {
    const variantMap: Record<string, string[]> = {
      "Nature of NDA (Mutual vs. Unilateral)": [
        "Standard Mutual",
        "Flexible Mutual with Carveouts",
        "Unilateral Discloser-Only",
      ],
      Definitions: ["Comprehensive", "Lean Definitions", "Minimal Definitions"],
      "Confidentiality Obligations": [
        "Mutual Balanced",
        "Strict Mutual (Enhanced Care Standard)",
        "Unilateral Recipient Obligations",
      ],
      "Purpose of Disclosure": ["Specific Purpose", "General Purpose", "Internal Evaluation Only"],
      "Use Restrictions": ["Purpose-Bound Use", "Internal Use Only", "Restricted Commercial Use"],
    }
    return variantMap[clauseType] || ["Standard Option", "Alternative Option", "Minimal Option"]
  }

  const getClauseTitle = (clauseType: string): string => {
    return clauseType.replace(/([A-Z])/g, " $1").trim()
  }

  const getStatusIcon = (status: ClauseStatus) => {
    switch (status) {
      case "agreed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "conflict":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "rejected":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = (status: ClauseStatus) => {
    switch (status) {
      case "agreed":
        return "bg-green-50 text-green-700 border-green-200"
      case "conflict":
        return "bg-red-50 text-red-700 border-red-200"
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const generateClauseText = (clauseType: string, variant: string): string => {
    const clauseTexts: Record<string, Record<string, string>> = {
      "Nature of NDA (Mutual vs. Unilateral)": {
        "Standard Mutual":
          "This Agreement shall be mutual, with both parties having the right to disclose and receive Confidential Information under the same terms and conditions set forth herein.",
        "Flexible Mutual with Carveouts":
          "This Agreement shall be mutual, with both parties having the right to disclose and receive Confidential Information, subject to specific carveouts and exceptions as defined in Schedule A.",
        "Unilateral Discloser-Only":
          "This Agreement shall be unilateral, with only the Disclosing Party sharing Confidential Information with the Receiving Party under the terms set forth herein.",
      },
      Definitions: {
        Comprehensive:
          "'Confidential Information' means all information, whether written, oral, electronic, visual, or in any other form, that is disclosed by one party to the other, including but not limited to technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.",
        "Lean Definitions":
          "'Confidential Information' means information that is marked as confidential or proprietary, or that would reasonably be considered confidential under the circumstances of disclosure, including technical, business, or financial information.",
        "Minimal Definitions":
          "'Confidential Information' means information specifically marked as 'Confidential' in writing by the disclosing party at the time of disclosure.",
      },
    }
    return clauseTexts[clauseType]?.[variant] || `[${variant} clause text for ${clauseType}]`
  }

  const overallProgress =
    resolvedClauses.length > 0
      ? (resolvedClauses.filter((c) => c.status === "agreed").length / resolvedClauses.length) * 100
      : 0

  const conflictCount = resolvedClauses.filter((c) => c.status === "conflict" || c.requiresNegotiation).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Status Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Dynamic Document Viewer</h1>
            <p className="text-muted-foreground">Real-time NDA generation with intelligent clause matching</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Session: {sessionId}
            </Badge>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Users className="w-4 h-4" />
              {otherParty ? "Both Parties Active" : "Waiting for Other Party"}
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  <span className="font-medium">Overall Progress</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <p className="text-sm text-muted-foreground">{Math.round(overallProgress)}% Complete</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Agreed Clauses</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {resolvedClauses.filter((c) => c.status === "agreed").length}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Conflicts</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{conflictCount}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {resolvedClauses.filter((c) => c.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Tabs */}
      <Tabs value={showCoverPage ? "cover" : "clauses"} onValueChange={(v) => setShowCoverPage(v === "cover")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="cover">Cover Page</TabsTrigger>
          <TabsTrigger value="clauses">Legal Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="cover">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Non-Disclosure Agreement - Cover Page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4 py-8">
                <h2 className="text-2xl font-heading font-bold">MUTUAL NON-DISCLOSURE AGREEMENT</h2>
                <div className="space-y-2">
                  <p className="text-lg">Between:</p>
                  <p className="font-medium">{currentParty.name}</p>
                  <p className="text-muted-foreground">and</p>
                  <p className="font-medium">{otherParty?.name || "[Other Party Name]"}</p>
                </div>
                <Separator className="my-6" />
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <h3 className="font-medium mb-2">Document Status</h3>
                    <div className="space-y-1">
                      <p>Progress: {Math.round(overallProgress)}%</p>
                      <p>Conflicts: {conflictCount}</p>
                      <p>Generated: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Next Steps</h3>
                    <div className="space-y-1">
                      {conflictCount > 0 ? (
                        <p className="text-red-600">Requires negotiation</p>
                      ) : otherParty ? (
                        <p className="text-green-600">Ready for review</p>
                      ) : (
                        <p className="text-yellow-600">Awaiting other party</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clauses">
          <div className="space-y-6">
            {/* View Mode Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">View Mode:</span>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="live">Live Status</TabsTrigger>
                  <TabsTrigger value="best">Best Case</TabsTrigger>
                  <TabsTrigger value="worst">Worst Case</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Clauses */}
            <div className="space-y-4">
              {resolvedClauses.map((clause, index) => (
                <Card key={clause.clauseType} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-heading flex items-center gap-2">
                          {getStatusIcon(clause.status)}
                          {clause.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={getStatusColor(clause.status)}>
                            {clause.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            Confidence:{" "}
                            <span className={getConfidenceColor(clause.confidence)}>{clause.confidence}%</span>
                          </Badge>
                          {clause.requiresNegotiation && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              Needs Discussion
                            </Badge>
                          )}
                        </div>
                      </div>
                      {clause.requiresNegotiation && (
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <MessageSquare className="w-4 h-4" />
                          Discuss
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground mb-1">AI Reasoning:</p>
                      <p className="text-sm">{clause.reasoning}</p>
                    </div>

                    {clause.selectedVariant && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Selected Variant: {clause.selectedVariant}</p>
                        <div className="bg-card border rounded-lg p-4">
                          <p className="text-sm leading-relaxed">
                            {generateClauseText(clause.clauseType, clause.selectedVariant)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          {conflictCount > 0
            ? `${conflictCount} clauses need discussion before finalizing`
            : "Document ready for final review and signature"}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export Draft
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Eye className="w-4 h-4" />
            Preview PDF
          </Button>
          <Button className="gap-2" disabled={conflictCount > 0}>
            <Send className="w-4 h-4" />
            {conflictCount > 0 ? "Resolve Conflicts First" : "Finalize Document"}
          </Button>
        </div>
      </div>
    </div>
  )
}
