"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Eye } from "lucide-react"

interface AuditReportProps {
  comparisonResults: any[]
  currentUser: string
  parties: { name: string; email: string; status: string }[]
}

export function AuditReport({ comparisonResults, currentUser, parties }: AuditReportProps) {
  const [selectedParty, setSelectedParty] = useState(parties[0]?.name || "")

  const generateAuditData = (partyName: string) => {
    const isBrad = partyName.includes("Brad")

    return comparisonResults.map((result) => ({
      clause: result.clause,
      outcome: result.isUnresolved ? "unresolved" : result.selectedVariant,
      status: isBrad ? result.bradStatus : result.memerStatus,
      ranking: isBrad ? result.bradRanking : result.memerRanking,
      fallbackGuidance: result.isUnresolved
        ? "Consider hybrid approach with different terms for different information types"
        : null,
    }))
  }

  const auditData = generateAuditData(selectedParty)

  const statusConfig = {
    preferred: { label: "Preferred", color: "bg-green-100 text-green-800", icon: "✅" },
    compromise: { label: "Compromise", color: "bg-yellow-100 text-yellow-800", icon: "🟡" },
    unresolved: { label: "Unresolved", color: "bg-red-100 text-red-800", icon: "🔴" },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Reports
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Private summaries showing how each clause was resolved for each party
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export All Reports
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Eye className="w-4 h-4" />
              Generate Combined Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Party Selection */}
      <Tabs value={selectedParty} onValueChange={setSelectedParty}>
        <TabsList className="grid w-full grid-cols-2">
          {parties.map((party) => (
            <TabsTrigger key={party.name} value={party.name}>
              {party.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {parties.map((party) => (
          <TabsContent key={party.name} value={party.name} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Report - {party.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Private summary of clause resolutions and strategic guidance
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Clause Name</th>
                        <th className="text-left p-3 font-medium">Resolution Outcome</th>
                        <th className="text-left p-3 font-medium">Your Rankings</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditData.map((item, index) => {
                        const config = statusConfig[item.status as keyof typeof statusConfig]

                        return (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="font-medium">{item.clause}</div>
                            </td>
                            <td className="p-3">
                              {item.outcome === "unresolved" ? (
                                <Badge variant="destructive" className="text-xs">
                                  🔴 Unresolved
                                </Badge>
                              ) : (
                                <span className="font-medium">{item.outcome}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1 text-sm">
                                {item.ranking.map((option: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {idx + 1}
                                    </Badge>
                                    <span>{option}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className={config.color} variant="secondary">
                                <span className="mr-1">{config.icon}</span>
                                {config.label}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Fallback Guidance */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">🔴 Fallback Guidance (Unresolved Clauses)</h4>
                  <div className="space-y-2 text-sm">
                    {auditData
                      .filter((item) => item.fallbackGuidance)
                      .map((item, index) => (
                        <div key={index}>
                          <strong>{item.clause}:</strong> {item.fallbackGuidance}
                        </div>
                      ))}
                    {auditData.filter((item) => item.fallbackGuidance).length === 0 && (
                      <p className="text-muted-foreground">No unresolved clauses requiring fallback guidance.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
