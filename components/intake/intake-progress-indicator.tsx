"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, AlertCircle } from "lucide-react"

interface IntakeProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  completedSteps: number[]
  hasIssues?: number[]
}

export function IntakeProgressIndicator({
  currentStep,
  totalSteps,
  completedSteps,
  hasIssues = [],
}: IntakeProgressIndicatorProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100
  const completionRate = (completedSteps.length / totalSteps) * 100

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-heading font-semibold">NDA Intake Progress</h2>
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps} • {Math.round(completionRate)}% Complete
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          {completedSteps.length}/{totalSteps} Clauses
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Started</span>
          <span>In Progress</span>
          <span>Ready for Review</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const isCompleted = completedSteps.includes(index)
          const isCurrent = index === currentStep
          const hasIssue = hasIssues.includes(index)

          return (
            <div
              key={index}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                    ? "bg-green-100 text-green-700"
                    : hasIssue
                      ? "bg-red-100 text-red-700"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-3 h-3" />
              ) : hasIssue ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              <span>Step {index + 1}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
