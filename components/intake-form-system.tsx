"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Users, MessageSquare, Settings, ChevronRight, Scale, Shield, Clock, AlertCircle } from "lucide-react"
import { IntakeForm } from "./intake-form"
import { CollaborationDashboard } from "./collaboration-dashboard"
import { DocumentGenerator } from "./document-generator"
import { MessagingCenter } from "./messaging-center"
import { AdminManagement } from "./admin-management"

type ViewType = "welcome" | "intake" | "collaboration" | "document" | "messaging" | "admin"

export function IntakeFormSystem() {
  const [currentView, setCurrentView] = useState<ViewType>("welcome")
  const [sessionData, setSessionData] = useState({
    sessionId: "nda-session-001",
    parties: ["Brad's Guitars", "Meemer VC"],
    status: "intake-pending",
    progress: 25,
  })

  const navigationItems = [
    { id: "welcome", label: "Overview", icon: Scale, description: "Project overview and status" },
    { id: "intake", label: "Intake Form", icon: FileText, description: "Complete clause preferences" },
    { id: "collaboration", label: "Collaboration", icon: Users, description: "Review and negotiate" },
    { id: "document", label: "Document", icon: FileText, description: "Generated agreement" },
    { id: "messaging", label: "Messages", icon: MessageSquare, description: "Resolve conflicts" },
    { id: "admin", label: "Admin", icon: Settings, description: "Manage templates" },
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case "intake":
        return <IntakeForm onComplete={() => setCurrentView("collaboration")} />
      case "collaboration":
        return <CollaborationDashboard />
      case "document":
        return <DocumentGenerator />
      case "messaging":
        return <MessagingCenter />
      case "admin":
        return <AdminManagement />
      default:
        return <WelcomeView onStartIntake={() => setCurrentView("intake")} sessionData={sessionData} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-sidebar-foreground">LegalCollab</h1>
              <p className="text-sm text-sidebar-foreground/70">AI Contract Platform</p>
            </div>
          </div>

          {/* Session Info */}
          <Card className="mb-6 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">Current Session</CardTitle>
              <CardDescription className="text-xs">{sessionData.sessionId}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{sessionData.progress}%</span>
                  </div>
                  <Progress value={sessionData.progress} className="h-2" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {sessionData.parties.map((party, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {party}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">{renderCurrentView()}</div>
    </div>
  )
}

function WelcomeView({
  onStartIntake,
  sessionData,
}: {
  onStartIntake: () => void
  sessionData: any
}) {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-4">AI-Assisted Contract Negotiation</h1>
          <p className="text-xl text-muted-foreground">
            Streamline legal document collaboration with intelligent matching and real-time resolution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-heading">Smart Intake</CardTitle>
              <CardDescription>
                AI-powered forms that adapt to your preferences and provide intelligent suggestions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="font-heading">Real-time Collaboration</CardTitle>
              <CardDescription>
                Asynchronous negotiation with deterministic matching and conflict resolution
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="font-heading">Secure & Compliant</CardTitle>
              <CardDescription>
                Enterprise-grade security with comprehensive audit trails and legal compliance
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-heading">Session Overview</CardTitle>
            <CardDescription>Current negotiation status and next steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="font-medium">Agreement Type:</span>
                  <Badge variant="outline">Non-Disclosure Agreement</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="font-medium">Parties:</span>
                  <div className="flex gap-2">
                    {sessionData.parties.map((party: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {party}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                  <span className="font-medium">Status:</span>
                  <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Intake Pending</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span className="text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Priority:</span>
                  <Badge variant="outline">Standard</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={onStartIntake} size="lg" className="font-medium">
            Start Intake Process
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" size="lg">
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  )
}
