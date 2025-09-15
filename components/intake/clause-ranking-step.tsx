"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { X, GripVertical, Info, Lightbulb, MessageSquare, Star, AlertTriangle } from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import type { ClausePreference } from "./intake-form-wizard"

interface ClauseRankingStepProps {
  clause: {
    clause_type: string
    question_text: string
    available_variants: string[]
    additional_notes?: string
    field_required: boolean
  }
  preference: ClausePreference
  onUpdate: (preference: Partial<ClausePreference>) => void
}

export function ClauseRankingStep({ clause, preference, onUpdate }: ClauseRankingStepProps) {
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)

  if (!preference) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading clause preferences...</div>
        </CardContent>
      </Card>
    )
  }

  const safePreference = {
    selectedVariant: preference?.selectedVariant ?? null,
    ranking: preference?.ranking ?? clause.available_variants.map((_, index) => index + 1),
    isRejected: preference?.isRejected ?? false,
  }

  const getAiSuggestion = () => {
    const suggestions: Record<string, string> = {
      "Nature of NDA (Mutual vs. Unilateral)":
        "Based on typical business partnerships, I recommend 'Standard Mutual' as your first choice. This provides balanced protection for both parties and is widely accepted in collaborative relationships. Mutual NDAs demonstrate good faith and are less likely to be rejected.",
      Definitions:
        "For comprehensive protection, I suggest ranking 'Comprehensive' first. This ensures broader coverage of confidential information, including oral disclosures and unmarked materials. However, be aware that overly broad definitions may face pushback from sophisticated counterparties.",
      "Confidentiality Obligations":
        "Consider 'Mutual Balanced' as your top choice. This provides strong protection while maintaining reasonable obligations for both parties. The enhanced care standard offers maximum protection but may be seen as burdensome in routine business relationships.",
      "Purpose of Disclosure":
        "I recommend 'Specific Purpose' as your first choice to maintain tighter control over how your confidential information is used. This limits scope creep and provides clearer enforcement boundaries if disputes arise.",
      "Use Restrictions":
        "Rank 'Purpose-Bound Use' first for maximum protection. This limits the recipient's use to only the agreed-upon purpose and prevents unauthorized commercialization of your confidential information.",
    }
    return (
      suggestions[clause.clause_type] ||
      "Consider your business needs and risk tolerance when ranking these options. Higher-ranked options typically provide stronger protection but may face more resistance from counterparties."
    )
  }

  const getRiskLevel = (index: number) => {
    switch (index) {
      case 0:
        return { level: "low", label: "Preferred", color: "text-green-600 bg-green-50 border-green-200" }
      case 1:
        return { level: "medium", label: "Acceptable", color: "text-yellow-600 bg-yellow-50 border-yellow-200" }
      default:
        return { level: "high", label: "Unacceptable", color: "text-red-600 bg-red-50 border-red-200" }
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newRanking = Array.from(safePreference.ranking)
    const [reorderedItem] = newRanking.splice(result.source.index, 1)
    newRanking.splice(result.destination.index, 0, reorderedItem)

    onUpdate({ ranking: newRanking })
  }

  const handleVariantSelect = (variant: string) => {
    onUpdate({
      selectedVariant: variant,
      isRejected: false,
    })
  }

  const handleReject = () => {
    onUpdate({
      isRejected: !safePreference.isRejected,
      selectedVariant: safePreference.isRejected ? null : safePreference.selectedVariant,
    })
  }

  const getRankingLabel = (index: number) => {
    const labels = ["1st Choice", "2nd Choice", "Unacceptable"]
    return labels[index] || `Option ${index + 1}`
  }

  const getRankingIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Star className="w-4 h-4 text-primary" />
      case 1:
        return (
          <div className="w-4 h-4 rounded-full bg-secondary text-xs flex items-center justify-center text-white font-bold">
            2
          </div>
        )
      default:
        return <AlertTriangle className="w-4 h-4 text-destructive" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-heading mb-2">{clause.clause_type}</CardTitle>
            <CardDescription className="text-base leading-relaxed">{clause.question_text}</CardDescription>
            {clause.field_required && (
              <Badge variant="secondary" className="mt-2">
                Required
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-card/50 rounded-lg p-4 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-2">AI Recommendation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{getAiSuggestion()}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-accent hover:text-accent/80"
                onClick={() => setShowAiSuggestion(!showAiSuggestion)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                {showAiSuggestion ? "Hide Details" : "Show Details"}
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {clause.additional_notes && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Context:</strong> {clause.additional_notes}
            </AlertDescription>
          </Alert>
        )}

        {safePreference.isRejected ? (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <X className="w-4 h-4" />
              <span className="font-medium">All variants rejected</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              You've indicated that none of these clause variants are acceptable. This may require custom negotiation.
            </p>
            <Button variant="outline" size="sm" onClick={handleReject}>
              Reconsider Options
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="gap-2 text-destructive hover:text-destructive/80 hover:bg-destructive/5 bg-transparent"
            >
              <X className="w-4 h-4" />
              Mark as Unacceptable
            </Button>
            <span className="text-sm text-muted-foreground">
              Mark this entire clause as unacceptable if none of the options work for you
            </span>
          </div>
        )}

        {!safePreference.isRejected && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Rank Your Preferences</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3" /> 1st Choice
                <div className="w-3 h-3 rounded-full bg-secondary text-[10px] flex items-center justify-center text-white font-bold">
                  2
                </div>
                2nd Choice
                <AlertTriangle className="w-3 h-3" /> Unacceptable
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="variants">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {safePreference.ranking.map((rankIndex, index) => {
                      const variant = clause.available_variants[rankIndex - 1]
                      const isSelected = safePreference.selectedVariant === variant
                      const risk = getRiskLevel(index)

                      return (
                        <Draggable key={variant} draggableId={variant} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                bg-card border rounded-lg p-4 transition-all cursor-pointer
                                ${isSelected ? "ring-2 ring-primary border-primary" : "hover:border-border/60"}
                                ${snapshot.isDragging ? "shadow-lg scale-105" : ""}
                              `}
                              onClick={() => handleVariantSelect(variant)}
                            >
                              <div className="flex items-start gap-3">
                                <div {...provided.dragHandleProps} className="flex-shrink-0 mt-1">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex-shrink-0 mt-1">{getRankingIcon(index)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {getRankingLabel(index)}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${risk.color}`}>
                                      {risk.label.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="font-medium text-sm mb-3">{variant}</p>
                                  <Button variant={isSelected ? "default" : "outline"} size="sm">
                                    {isSelected ? "Selected" : "Select This Option"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="font-medium">Instructions:</div>
              <ul className="space-y-1 text-xs">
                <li>• Drag items to reorder your preferences from most to least preferred</li>
                <li>• Click on your most preferred option to select it</li>
                <li>• Your selection will be used if both parties rank it highly</li>
                <li>• The system will use your ranking to find the best compromise if needed</li>
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Additional Notes (Optional)</label>
          <Textarea
            placeholder="Add any specific requirements or concerns about this clause..."
            value=""
            onChange={(e) => {}}
            className="min-h-[80px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            These notes will be shared with the other party to help explain your preferences.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
