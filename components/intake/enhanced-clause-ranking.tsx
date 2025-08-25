"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Star, AlertTriangle, X, Lightbulb, MessageSquare, ChevronDown, ChevronUp, Info } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type ClauseVariant = {
  id: string
  text: string
  risk_level: "low" | "medium" | "high"
  description: string
}

export type ClauseData = {
  clause_type: string
  title: string
  description: string
  available_variants: ClauseVariant[]
}

export type ClausePreference = {
  clauseType: string
  selectedVariant: string | null
  ranking: string[]
  isRejected: boolean
  aiSuggestion?: string
  userNotes?: string
}

interface EnhancedClauseRankingProps {
  clause: ClauseData
  preference: ClausePreference
  onUpdate: (preference: Partial<ClausePreference>) => void
}

export function EnhancedClauseRanking({ clause, preference, onUpdate }: EnhancedClauseRankingProps) {
  const [showAISuggestion, setShowAISuggestion] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  // Mock AI suggestion based on clause type
  const getAISuggestion = (clauseType: string) => {
    const suggestions = {
      confidentiality_definition:
        "Based on your risk profile, I recommend the 'Broad Definition' variant as it provides comprehensive protection while maintaining flexibility for standard business operations.",
      term_duration:
        "For startup-investor NDAs, a 3-year term is typically sufficient and shows good faith while protecting sensitive information during the due diligence period.",
      permitted_disclosures:
        "The 'Standard Exceptions' variant balances protection with practical business needs, allowing necessary disclosures while maintaining confidentiality.",
    }
    return (
      suggestions[clauseType as keyof typeof suggestions] ||
      "Consider your risk tolerance and business needs when ranking these options."
    )
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newRanking = Array.from(preference.ranking)
    const [reorderedItem] = newRanking.splice(result.source.index, 1)
    newRanking.splice(result.destination.index, 0, reorderedItem)

    onUpdate({ ranking: newRanking })
  }

  const handleReject = () => {
    onUpdate({ isRejected: !preference.isRejected, selectedVariant: null })
  }

  const handleSelectVariant = (variantId: string) => {
    onUpdate({
      selectedVariant: variantId,
      isRejected: false,
      ranking: preference.ranking.includes(variantId)
        ? preference.ranking
        : [variantId, ...preference.ranking.filter((id) => id !== variantId)],
    })
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="font-heading text-xl mb-2">{clause.title}</CardTitle>
            <CardDescription className="text-base leading-relaxed">{clause.description}</CardDescription>
          </div>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>

      <CollapsibleContent>
        <CardContent className="space-y-6">
          {/* AI Suggestion */}
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-2">AI Recommendation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{getAISuggestion(clause.clause_type)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-auto p-0 text-accent hover:text-accent/80"
                  onClick={() => setShowAISuggestion(!showAISuggestion)}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {showAISuggestion ? "Hide Details" : "Show Details"}
                </Button>
              </div>
            </div>
          </div>

          {/* Clause Variants - Drag and Drop Ranking */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Rank Your Preferences</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3" /> 1st Choice
                <div className="w-3 h-3 rounded-full bg-secondary text-[10px] flex items-center justify-center text-white font-bold">
                  2
                </div>
                2nd Choice
                <AlertTriangle className="w-3 h-3" /> Unacceptable
              </div>
            </div>

            {preference.isRejected ? (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <X className="w-4 h-4" />
                  <span className="font-medium">All variants rejected</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  You've indicated that none of these clause variants are acceptable.
                </p>
                <Button variant="outline" size="sm" onClick={handleReject}>
                  Reconsider Options
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="clause-variants">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {preference.ranking.map((variantId, index) => {
                        const variant = clause.available_variants.find((v) => v.id === variantId)
                        if (!variant) return null

                        return (
                          <Draggable key={variantId} draggableId={variantId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-card border rounded-lg p-4 transition-all ${
                                  snapshot.isDragging ? "shadow-lg scale-105" : ""
                                } ${
                                  preference.selectedVariant === variantId
                                    ? "ring-2 ring-primary border-primary"
                                    : "hover:border-border/60"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">{getRankingIcon(index)}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${getRiskColor(variant.risk_level)}`}
                                      >
                                        {variant.risk_level.toUpperCase()} RISK
                                      </Badge>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-auto p-0">
                                            <Info className="w-3 h-3 text-muted-foreground" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                          <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Clause Details</h4>
                                            <p className="text-xs text-muted-foreground">{variant.description}</p>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    <p className="text-sm leading-relaxed mb-3">{variant.text}</p>
                                    <Button
                                      variant={preference.selectedVariant === variantId ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handleSelectVariant(variantId)}
                                    >
                                      {preference.selectedVariant === variantId ? "Selected" : "Select This Option"}
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
            )}
          </div>

          {/* Reject All Option */}
          {!preference.isRejected && (
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReject}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/5"
              >
                <X className="w-4 h-4 mr-2" />
                None of these options are acceptable
              </Button>
            </div>
          )}

          {/* User Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes (Optional)</label>
            <Textarea
              placeholder="Add any specific requirements or concerns about this clause..."
              value={preference.userNotes || ""}
              onChange={(e) => onUpdate({ userNotes: e.target.value })}
              className="min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  )
}
