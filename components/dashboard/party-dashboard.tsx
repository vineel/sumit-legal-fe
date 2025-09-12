"use client"
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { User as UserIcon, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Clock, CheckCircle, Download, MessageSquare } from "lucide-react"
import Link from "next/link";
import { getAgreements  } from "@/lib/user"

// Mock session data
// const mockSessions = [
//   {
//     id: "1",
//     title: "NDA with TechCorp Inc.",
//     counterparty: "TechCorp Inc.",
//     status: "draft" as const,
//     progress: 60,
//     lastActivity: "2 hours ago",
//     description: "Software development partnership agreement",
//   },
//   {
//     id: "2",
//     title: "SaaS Agreement with StartupXYZ",
//     counterparty: "StartupXYZ",
//     status: "in-progress" as const,
//     progress: 85,
//     lastActivity: "1 day ago",
//     description: "SaaS licensing and subscription terms",
//     unresolvedClauses: 2,
//   },
//   {
//     id: "3",
//     title: "Professional Services Agreement with MegaCorp",
//     counterparty: "MegaCorp",
//     status: "resolved" as const,
//     progress: 100,
//     lastActivity: "3 days ago",
//     description: "Consulting engagement contract",
//   },
//   {
//     id: "4",
//     title: "NDA with InnovateLab",
//     counterparty: "InnovateLab",
//     status: "exported" as const,
//     progress: 100,
//     lastActivity: "1 week ago",
//     description: "Research collaboration agreement",
//   },
// ]

type AgreementStatus = "draft" | "in-progress" | "resolved" | "exported"
const statusConfig = {
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-800", icon: FileText },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  exported: { label: "Exported", color: "bg-gray-100 text-gray-800", icon: Download },
}
interface Agreement {
  _id: string
  partyAName: string
  partyBName: string
  status: AgreementStatus
  clauses?: any[]
  updatedAt: string
}
 

export function PartyDashboard() {
  const { user, logout } = useAuth()
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          console.error("No auth token found")
          return
        }

        // Tell TS: rawData is unknown[] (or any[])
        const rawData: any[] = await getAgreements(token)

        const data: Agreement[] = rawData.map((item) => ({
          _id: item._id,
          partyAName: item.partyAName ?? "Unknown",
          partyBName: item.partyBName ?? "Unknown",
          status: (item.status as AgreementStatus) ?? "draft",
          clauses: item.clauses ?? [],
          updatedAt: item.updatedAt ?? new Date().toISOString(),
        }))

        console.log(data, "data>>!>23")
        setAgreements(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAgreements()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-heading font-semibold">Legal Collaboration Platform </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserIcon className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} variant="destructive">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Dashboard </h2>
          <p className="text-muted-foreground">Manage your agreement sessions and collaborations</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/intake">
                <Plus className="w-4 h-4" />
                Start New Agreement
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Agreements Grid */}
        {!loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {agreements.map((agreement) => {
    const config = statusConfig[agreement.status]
    const StatusIcon = config.icon

    return (
      <Card
        key={agreement._id}
        className="hover:shadow-md transition-shadow bg-yellow-50 border border-gray-200"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {agreement.partyAName || "Untitled Agreement"}
              </CardTitle>
              <CardDescription className="mt-1">
                With {agreement.partyBName || "Unknown Party"}
              </CardDescription>
            </div>
            <Badge className={`${config.color} flex items-center gap-1`} variant="secondary">
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {agreement.status === "draft"
                  ? "0%"
                  : agreement.status === "in-progress"
                  ? "85%" // 👈 replace with real value if available
                  : "100%"}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{
                  width:
                    agreement.status === "draft"
                      ? "0%"
                      : agreement.status === "in-progress"
                      ? "85%"
                      : "100%",
                }}
              />
            </div>
          </div>

          {/* Counterparty */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Counterparty:</span>
            <span className="font-medium">{agreement.partyBName || "Unknown"}</span>
          </div>

          {/* Unresolved Clauses */}
          {agreement.clauses && agreement.clauses.length > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Unresolved:</span>
              <Badge variant="destructive" className="text-xs">
                {agreement.clauses.length} clauses
              </Badge>
            </div>
          )}

          {/* Last Activity */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Last activity:</span>
            <span>{new Date(agreement.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2 justify-center">
            {agreement.status === "draft" && (
              <Button asChild size="sm" className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white">
                <Link href={`/intake?session=${agreement._id}`}>Continue</Link>
              </Button>
            )}
            {agreement.status === "in-progress" && (
              <Button asChild size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                <Link href={`/collaboration?session=${agreement._id}`}>Resolve</Link>
              </Button>
            )}
            {(agreement.status === "resolved" || agreement.status === "exported") && (
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={`/document?session=${agreement._id}`}>View Document</Link>
              </Button>
            )}

            {/* Always show these */}
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={`/collaboration?session=${agreement._id}`}>View Collaborations</Link>
            </Button>
             <Button asChild size="sm" variant="outline">
               <Link href={`/agreement/${agreement._id}`}>Details</Link>
             </Button>
          </div>
        </CardContent>
      </Card>
    )
  })}
          </div>
        )}

        {/* Empty State */}
        {agreements.length === 0 && !loading && (
          <Card className="text-center py-12 mt-8">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No Agreement Sessions Yet</CardTitle>
              <CardDescription className="mb-4">Start your first agreement collaboration to get started</CardDescription>
              <Button asChild>
                <Link href="/intake">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Agreement
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        </main>
      </div>
    )
  }
