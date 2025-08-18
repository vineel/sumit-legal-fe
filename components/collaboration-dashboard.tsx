"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Clock, MessageSquare, FileText, Users } from "lucide-react"

export function CollaborationDashboard() {
  const comparisonData = [
    {
      clause: "Nature of NDA (Mutual vs. Unilateral)",
      selected: "Standard Mutual",
      bradStatus: "yellow",
      meemerStatus: "green",
      resolved: true,
    },
    {
      clause: "Definitions",
      selected: "Lean Definitions",
      bradStatus: "yellow",
      meemerStatus: "green",
      resolved: true,
    },
    {
      clause: "Term of Confidentiality",
      selected: "UNRESOLVED",
      bradStatus: "red",
      meemerStatus: "red",
      resolved: false,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-primary text-primary-foreground"
      case "yellow":
        return "bg-accent text-accent-foreground"
      case "red":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Collaboration Dashboard</h1>
          <p className="text-xl text-muted-foreground">Review clause matching results and resolve conflicts</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">16</div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <div>
                  <div className="text-2xl font-bold">1</div>
                  <div className="text-sm text-muted-foreground">Unresolved</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-accent" />
                <div>
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-sm text-muted-foreground">Parties</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-chart-1" />
                <div>
                  <div className="text-2xl font-bold">94%</div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-heading">Clause Comparison Results</CardTitle>
            <CardDescription>AI-powered matching results with party preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonData.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <h3 className="font-medium">{item.clause}</h3>
                    </div>
                    <div>
                      {item.resolved ? (
                        <Badge className="bg-primary/10 text-primary">{item.selected}</Badge>
                      ) : (
                        <Badge variant="destructive">{item.selected}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div
                        className={`w-4 h-4 rounded-full ${getStatusColor(item.bradStatus)}`}
                        title="Brad's Guitars"
                      />
                      <span className="text-sm">Brad's Guitars</span>
                    </div>
                    <div className="flex gap-2">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(item.meemerStatus)}`} title="Meemer VC" />
                      <span className="text-sm">Meemer VC</span>
                    </div>
                  </div>
                  {!item.resolved && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Discuss Resolution
                        </Button>
                        <Button size="sm" variant="outline">
                          View AI Suggestions
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Preview
              </CardTitle>
              <CardDescription>Preview the generated agreement with current selections</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Preview Document</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Active Discussions
              </CardTitle>
              <CardDescription>Resolve unmatched clauses through AI-assisted messaging</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                Open Messaging Center
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
