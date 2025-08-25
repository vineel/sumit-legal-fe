"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, FileText, Download, Users, Clock } from "lucide-react"
import { ComparisonTable } from "./comparison-table"
import { ConflictResolution } from "./conflict-resolution"
import { DocumentGenerator } from "./document-generator"
import { AuditReport } from "./audit-report"

// Mock collaboration data based on the sample output
const mockCollaborationData = {
  sessionId: "nda-session-001",
  parties: [
    { name: "Brad's Guitars", email: "brad@bradsguitar.com", status: "completed" },
    { name: "Meemer VC", email: "legal@meemer.vc", status: "completed" },
  ],
  comparisonResults: [
    {
      clause: "Nature of NDA (Mutual vs. Unilateral)",
      selectedVariant: "Standard Mutual",
      bradStatus: "compromise",
      memerStatus: "preferred",
      bradRanking: ["Unilateral Discloser-Only", "Standard Mutual", "Flexible Mutual with Carveouts"],
      memerRanking: ["Standard Mutual", "Flexible Mutual with Carveouts", "Unilateral Discloser-Only"],
    },
    {
      clause: "Definitions",
      selectedVariant: "Lean Definitions",
      bradStatus: "compromise",
      memerStatus: "preferred",
      bradRanking: ["Comprehensive", "Lean Definitions", "Minimal Definitions"],
      memerRanking: ["Lean Definitions", "Minimal Definitions", "Comprehensive"],
    },
    {
      clause: "Term of Confidentiality",
      selectedVariant: null,
      bradStatus: "unresolved",
      memerStatus: "unresolved",
      bradRanking: ["Survival Until Public", "3-Year Fixed Term", "2-Year Term"],
      memerRanking: ["2-Year Term", "3-Year Term", "Survival Until Public"],
      isUnresolved: true,
    },
    {
      clause: "Purpose of Disclosure",
      selectedVariant: "Specific Purpose",
      bradStatus: "preferred",
      memerStatus: "compromise",
      bradRanking: ["Specific Purpose", "Internal Evaluation Only", "General Purpose"],
      memerRanking: ["General Purpose", "Specific Purpose", "Internal Evaluation Only"],
    },
    {
      clause: "Use Restrictions",
      selectedVariant: "Purpose-Bound Use",
      bradStatus: "compromise",
      memerStatus: "preferred",
      bradRanking: ["Restricted Commercial Use", "Purpose-Bound Use", "Internal Use Only"],
      memerRanking: ["Purpose-Bound Use", "Internal Use Only", "Restricted Commercial Use"],
    },
  ],
  unresolvedClauses: ["Term of Confidentiality"],
  lastActivity: "2 hours ago",
  progress: 95,
}

const statusConfig = {
  preferred: { label: "Preferred", color: "bg-green-100 text-green-800", icon: "✅" },
  compromise: { label: "Compromise", color: "bg-yellow-100 text-yellow-800", icon: "🟡" },
  unresolved: { label: "Unresolved", color: "bg-red-100 text-red-800", icon: "🔴" },
}

export function CollaborationWorkspace() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session") || "new"

  const [activeTab, setActiveTab] = useState("overview")
  const [selectedClause, setSelectedClause] = useState<string | null>(null)

  const unresolvedCount = mockCollaborationData.unresolvedClauses.length
  const resolvedCount = mockCollaborationData.comparisonResults.length - unresolvedCount

  const handleExportResults = () => {
    console.log("[v0] Exporting results for session:", sessionId)
    // Mock export functionality - in real app would trigger download
    const exportData = {
      sessionId,
      parties: mockCollaborationData.parties,
      results: mockCollaborationData.comparisonResults,
      exportedAt: new Date().toISOString(),
    }

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nda-results-${sessionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGenerateDocument = () => {
    console.log("[v0] Generating document for session:", sessionId)
    // Switch to document tab to show document generation
    setActiveTab("document")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="text-sm text-muted-foreground">Session: {sessionId}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-heading font-bold mb-2">NDA Collaboration</h1>
              <p className="text-muted-foreground">Review matching results and resolve conflicts</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExportResults}>
                <Download className="w-4 h-4" />
                Export Results
              </Button>
              <Button className="gap-2" onClick={handleGenerateDocument}>
                <FileText className="w-4 h-4" />
                Generate Document
              </Button>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Parties</p>
                    <p className="text-lg font-semibold">{mockCollaborationData.parties.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-800 font-semibold">{resolvedCount}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-lg font-semibold text-green-800">Clauses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-800 font-semibold">{unresolvedCount}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unresolved</p>
                    <p className="text-lg font-semibold text-red-800">Conflicts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Activity</p>
                    <p className="text-lg font-semibold">{mockCollaborationData.lastActivity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conflicts">
              Resolve Conflicts
              {unresolvedCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unresolvedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="audit">Audit Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ComparisonTable
              results={mockCollaborationData.comparisonResults}
              currentUser={user?.name || ""}
              onClauseSelect={setSelectedClause}
            />
          </TabsContent>

          <TabsContent value="conflicts" className="mt-6">
            <ConflictResolution
              unresolvedClauses={mockCollaborationData.unresolvedClauses}
              comparisonResults={mockCollaborationData.comparisonResults}
              sessionId={sessionId}
            />
          </TabsContent>

          <TabsContent value="document" className="mt-6">
            <DocumentGenerator comparisonResults={mockCollaborationData.comparisonResults} sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditReport
              comparisonResults={mockCollaborationData.comparisonResults}
              currentUser={user?.name || ""}
              parties={mockCollaborationData.parties}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
