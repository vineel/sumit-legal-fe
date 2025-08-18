"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, X, GripVertical, Info } from "lucide-react"
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
    isRejected: false,
    selectedVariant: null,
    ranking: clause.available_variants.map((_, index) => index + 1),
    ...preference,
  }

  // Mock AI suggestions based on clause type
  const getAiSuggestion = () => {
    const suggestions: Record<string, string> = {
      "Nature of NDA (Mutual vs. Unilateral)":
        "Based on typical business partnerships, I recommend 'Standard Mutual' as your first choice. This provides balanced protection for both parties and is widely accepted in collaborative relationships.",
      Definitions:
        "For comprehensive protection, I suggest ranking 'Comprehensive' first. This ensures broader coverage of confidential information, including oral disclosures and unmarked materials.",
      "Confidentiality Obligations":
        "Consider 'Mutual Balanced' as your top choice. This provides strong protection while maintaining reasonable obligations for both parties.",
      "Purpose of Disclosure":
        "I recommend 'Specific Purpose' as your first choice to maintain tighter control over how your confidential information is used.",
      "Use Restrictions":
        "Rank 'Purpose-Bound Use' first for maximum protection. This limits the recipient's use to only the agreed-upon purpose.",
    }
    return (
      suggestions[clause.clause_type] ||
      "Consider your business needs and risk tolerance when ranking these options. Higher-ranked options typically provide stronger protection."
    )
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
    const labels = ["Most Preferred", "Acceptable", "Least Preferred"]
    return labels[index] || `Option ${index + 1}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-heading mb-2">{clause.clause_type}</CardTitle>
            <CardDescription className="text-base">{clause.question_text}</CardDescription>
            {clause.field_required && (
              <Badge variant="secondary" className="mt-2">
                Required
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAiSuggestion(!showAiSuggestion)}
            className="gap-2 ml-4"
          >
            <Sparkles className="w-4 h-4" />
            AI Suggestion
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Suggestion */}
        {showAiSuggestion && (
          <Alert>
            <Sparkles className="w-4 h-4" />
            <AlertDescription className="mt-2">
              <strong>AI Recommendation:</strong> {getAiSuggestion()}
            </AlertDescription>
          </Alert>
        )}

        {/* Additional Notes */}
        {clause.additional_notes && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Context:</strong> {clause.additional_notes}
            </AlertDescription>
          </Alert>
        )}

        {/* Reject Option */}
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
          <Button
            variant={safePreference.isRejected ? "destructive" : "outline"}
            size="sm"
            onClick={handleReject}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            {safePreference.isRejected ? "Rejected" : "Mark as Unacceptable"}
          </Button>
          <span className="text-sm text-muted-foreground">
            Mark this entire clause as unacceptable if none of the options work for you
          </span>
        </div>

        {/* Ranking Interface */}
        {!safePreference.isRejected && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Rank your preferences (drag to reorder):</h3>
              <span className="text-sm text-muted-foreground">
                1 = Most Preferred, {clause.available_variants.length} = Least Preferred
              </span>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="variants">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {safePreference.ranking.map((rankIndex, index) => {
                      const variant = clause.available_variants[rankIndex - 1]
                      const isSelected = safePreference.selectedVariant === variant

                      return (
                        <Draggable key={variant} draggableId={variant} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all
                                ${isSelected ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}
                                ${snapshot.isDragging ? "shadow-lg" : ""}
                              `}
                              onClick={() => handleVariantSelect(variant)}
                            >
                              <div {...provided.dragHandleProps} className="text-muted-foreground">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="flex items-center gap-3 flex-1">
                                <Badge variant="outline" className="min-w-[100px] justify-center">
                                  {getRankingLabel(index)}
                                </Badge>
                                <span className="font-medium">{variant}</span>
                              </div>

                              {isSelected && <Badge variant="default">Selected</Badge>}
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

            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Instructions:</strong> Drag items to reorder your preferences, then click on your most preferred
              option to select it. Your selection will be used if both parties rank it highly, otherwise the system will
              use your ranking to find the best compromise.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
