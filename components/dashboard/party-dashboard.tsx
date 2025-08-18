"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Clock, CheckCircle, Download, MessageSquare } from "lucide-react"
import Link from "next/link"

// Mock session data
const mockSessions = [
  {
    id: "1",
    title: "NDA with TechCorp Inc.",
    counterparty: "TechCorp Inc.",
    status: "draft" as const,
    progress: 60,
    lastActivity: "2 hours ago",
    description: "Software development partnership agreement",
  },
  {
    id: "2",
    title: "NDA with StartupXYZ",
    counterparty: "StartupXYZ",
    status: "in-progress" as const,
    progress: 85,
    lastActivity: "1 day ago",
    description: "Investment discussion confidentiality",
    unresolvedClauses: 2,
  },
  {
    id: "3",
    title: "NDA with MegaCorp",
    counterparty: "MegaCorp",
    status: "resolved" as const,
    progress: 100,
    lastActivity: "3 days ago",
    description: "Acquisition due diligence",
  },
  {
    id: "4",
    title: "NDA with InnovateLab",
    counterparty: "InnovateLab",
    status: "exported" as const,
    progress: 100,
    lastActivity: "1 week ago",
    description: "Research collaboration agreement",
  },
]

const statusConfig = {
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-800", icon: FileText },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  exported: { label: "Exported", color: "bg-gray-100 text-gray-800", icon: Download },
}

export function PartyDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-heading font-semibold">Legal Collaboration Platform</h1>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Manage your NDA sessions and collaborations</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/intake">
                <Plus className="w-4 h-4" />
                Start New NDA
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
              <Link href="/collaboration">
                <MessageSquare className="w-4 h-4" />
                View Collaborations
              </Link>
            </Button>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockSessions.map((session) => {
            const config = statusConfig[session.status]
            const StatusIcon = config.icon

            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-heading">{session.title}</CardTitle>
                      <CardDescription className="mt-1">{session.description}</CardDescription>
                    </div>
                    <Badge className={config.color} variant="secondary">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{session.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${session.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Counterparty:</span>
                    <span className="font-medium">{session.counterparty}</span>
                  </div>

                  {session.unresolvedClauses && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Unresolved:</span>
                      <Badge variant="destructive" className="text-xs">
                        {session.unresolvedClauses} clauses
                      </Badge>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Last activity:</span>
                    <span>{session.lastActivity}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {session.status === "draft" && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/intake?session=${session.id}`}>Continue</Link>
                      </Button>
                    )}
                    {session.status === "in-progress" && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/collaboration?session=${session.id}`}>Resolve</Link>
                      </Button>
                    )}
                    {(session.status === "resolved" || session.status === "exported") && (
                      <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Link href={`/document?session=${session.id}`}>View Document</Link>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/session/${session.id}`}>Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {mockSessions.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No NDA Sessions Yet</CardTitle>
              <CardDescription className="mb-4">Start your first NDA collaboration to get started</CardDescription>
              <Button asChild>
                <Link href="/intake">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New NDA
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
