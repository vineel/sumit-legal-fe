"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Info } from "lucide-react"

interface ComparisonResult {
  clause: string
  selectedVariant: string | null
  bradStatus: "preferred" | "compromise" | "unresolved"
  memerStatus: "preferred" | "compromise" | "unresolved"
  bradRanking: string[]
  memerRanking: string[]
  isUnresolved?: boolean
}

interface ComparisonTableProps {
  results: ComparisonResult[]
  currentUser: string
  onClauseSelect: (clause: string) => void
}

const statusConfig = {
  preferred: { label: "Preferred", color: "bg-green-100 text-green-800", icon: "✅" },
  compromise: { label: "Compromise", color: "bg-yellow-100 text-yellow-800", icon: "🟡" },
  unresolved: { label: "Unresolved", color: "bg-red-100 text-red-800", icon: "🔴" },
}

export function ComparisonTable({ results, currentUser, onClauseSelect }: ComparisonTableProps) {
  const isCurrentUserBrad = currentUser.includes("Brad") || currentUser.includes("brad")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Clause Comparison Results
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Review how each clause was resolved based on both parties' preferences
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Clause</th>
                <th className="text-left p-3 font-medium">Selected Variant</th>
                <th className="text-left p-3 font-medium">Brad's Guitars</th>
                <th className="text-left p-3 font-medium">Meemer VC</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => {
                const bradConfig = statusConfig[result.bradStatus]
                const memerConfig = statusConfig[result.memerStatus]

                return (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{result.clause}</div>
                    </td>
                    <td className="p-3">
                      {result.selectedVariant ? (
                        <span className="font-medium">{result.selectedVariant}</span>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          UNRESOLVED
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge className={bradConfig.color} variant="secondary">
                        <span className="mr-1">{bradConfig.icon}</span>
                        {bradConfig.label}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={memerConfig.color} variant="secondary">
                        <span className="mr-1">{memerConfig.icon}</span>
                        {memerConfig.label}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onClauseSelect(result.clause)}
                          className="text-xs"
                        >
                          View Details
                        </Button>
                        {result.isUnresolved && (
                          <Button size="sm" className="text-xs gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Status Legend:</h4>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span>✅</span>
              <span>Preferred - Your top choice was selected</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🟡</span>
              <span>Compromise - An acceptable alternative was chosen</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔴</span>
              <span>Unresolved - Requires negotiation</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
