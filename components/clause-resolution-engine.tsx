"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, XCircle, Zap, Brain, Scale } from "lucide-react"

interface ClausePreference {
  clauseType: string
  selectedVariant: string | null
  ranking: string[]
  isRejected: boolean
  userNotes?: string
}

interface Party {
  id: string
  name: string
  preferences: Record<string, ClausePreference>
}

interface ClauseResolutionEngineProps {
  party1: Party
  party2: Party
  onResolutionComplete: (resolvedClauses: ResolvedClause[]) => void
}

interface ResolvedClause {
  clauseType: string
  selectedVariant: string
  resolutionMethod: "direct_match" | "ranking_compromise" | "tie_breaker" | "requires_negotiation"
  confidence: number
  reasoning: string
  alternativeOptions?: string[]
}

export function ClauseResolutionEngine({ party1, party2, onResolutionComplete }: ClauseResolutionEngineProps) {
  const [isResolving, setIsResolving] = useState(false)
  const [resolutionProgress, setResolutionProgress] = useState(0)
  const [resolvedClauses, setResolvedClauses] = useState<ResolvedClause[]>([])

  const runResolutionEngine = async () => {
    setIsResolving(true)
    setResolutionProgress(0)

    const clauses = Object.keys(party1.preferences)
    const resolved: ResolvedClause[] = []

    for (let i = 0; i < clauses.length; i++) {
      const clauseType = clauses[i]
      const pref1 = party1.preferences[clauseType]
      const pref2 = party2.preferences[clauseType]

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500))

      const resolution = resolveClause(clauseType, pref1, pref2)
      resolved.push(resolution)

      setResolutionProgress(((i + 1) / clauses.length) * 100)
    }

    setResolvedClauses(resolved)
    setIsResolving(false)
    onResolutionComplete(resolved)
  }

  const resolveClause = (clauseType: string, pref1: ClausePreference, pref2: ClausePreference): ResolvedClause => {
    // Handle rejections
    if (pref1.isRejected || pref2.isRejected) {
      return {
        clauseType,
        selectedVariant: "",
        resolutionMethod: "requires_negotiation",
        confidence: 0,
        reasoning: `${pref1.isRejected ? party1.name : party2.name} has rejected all variants`,
        alternativeOptions: [],
      }
    }

    // Direct match - both parties selected the same variant
    if (pref1.selectedVariant === pref2.selectedVariant && pref1.selectedVariant) {
      return {
        clauseType,
        selectedVariant: pref1.selectedVariant,
        resolutionMethod: "direct_match",
        confidence: 95,
        reasoning: "Both parties selected the same variant",
      }
    }

    // Ranking-based compromise
    const ranking1 = pref1.ranking || []
    const ranking2 = pref2.ranking || []

    let bestMatch = ""
    let bestScore = -1
    let bestRank1 = -1
    let bestRank2 = -1

    ranking1.forEach((variant1, index1) => {
      const index2 = ranking2.findIndex((variant2) => variant2 === variant1)
      if (index2 !== -1) {
        const score = ranking1.length - index1 + (ranking2.length - index2)
        if (score > bestScore) {
          bestScore = score
          bestMatch = variant1
          bestRank1 = index1 + 1
          bestRank2 = index2 + 1
        }
      }
    })

    if (bestMatch) {
      const confidence = Math.min(90, bestScore * 10)
      return {
        clauseType,
        selectedVariant: bestMatch,
        resolutionMethod: "ranking_compromise",
        confidence,
        reasoning: `Best compromise: ${party1.name} ranked #${bestRank1}, ${party2.name} ranked #${bestRank2}`,
        alternativeOptions: ranking1.slice(0, 3).filter((v) => v !== bestMatch),
      }
    }

    // Tie-breaker logic (fallback to most commonly used variant)
    const tieBreaker = getTieBreakerVariant(clauseType)
    return {
      clauseType,
      selectedVariant: tieBreaker,
      resolutionMethod: "tie_breaker",
      confidence: 30,
      reasoning: "No ranking overlap found, using most commonly used variant as tie-breaker",
      alternativeOptions: [...new Set([...ranking1, ...ranking2])].slice(0, 3),
    }
  }

  const getTieBreakerVariant = (clauseType: string): string => {
    // Mock tie-breaker logic - in real app, this would query usage statistics
    const commonVariants: Record<string, string> = {
      "Nature of NDA (Mutual vs. Unilateral)": "Standard Mutual",
      Definitions: "Comprehensive",
      "Confidentiality Obligations": "Mutual Balanced",
      "Purpose of Disclosure": "Specific Purpose",
      "Use Restrictions": "Purpose-Bound Use",
    }
    return commonVariants[clauseType] || "Standard Option"
  }

  const getResolutionIcon = (method: string) => {
    switch (method) {
      case "direct_match":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "ranking_compromise":
        return <Scale className="w-4 h-4 text-blue-600" />
      case "tie_breaker":
        return <Zap className="w-4 h-4 text-yellow-600" />
      case "requires_negotiation":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Intelligent Clause Resolution Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isResolving && resolvedClauses.length === 0 && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Resolve Clauses</h3>
            <p className="text-muted-foreground mb-4">
              The AI engine will analyze both parties' preferences and find optimal matches
            </p>
            <Button onClick={runResolutionEngine} className="gap-2">
              <Zap className="w-4 h-4" />
              Start Resolution Process
            </Button>
          </div>
        )}

        {isResolving && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Analyzing Preferences...</h3>
              <p className="text-muted-foreground">Processing clause rankings and finding optimal matches</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Resolution Progress</span>
                <span>{Math.round(resolutionProgress)}%</span>
              </div>
              <Progress value={resolutionProgress} className="h-3" />
            </div>
          </div>
        )}

        {resolvedClauses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Resolution Results</h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {resolvedClauses.filter((c) => c.confidence >= 80).length} High Confidence
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {resolvedClauses.filter((c) => c.resolutionMethod === "requires_negotiation").length} Need Discussion
                </Badge>
              </div>
            </div>

            {resolvedClauses.map((clause, index) => (
              <Card key={index} className="border-l-4 border-l-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getResolutionIcon(clause.resolutionMethod)}
                      <h4 className="font-medium">{clause.clauseType}</h4>
                    </div>
                    <Badge variant="outline" className={getConfidenceColor(clause.confidence)}>
                      {clause.confidence}% Confidence
                    </Badge>
                  </div>

                  {clause.selectedVariant && (
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground">Selected Variant:</span>
                      <p className="font-medium">{clause.selectedVariant}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <span className="text-sm text-muted-foreground">Resolution Method:</span>
                    <p className="text-sm">{clause.reasoning}</p>
                  </div>

                  {clause.alternativeOptions && clause.alternativeOptions.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Alternative Options:</span>
                      <div className="flex gap-2 mt-1">
                        {clause.alternativeOptions.map((option, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
