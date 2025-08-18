"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Filter, Download, Calendar, User, Activity } from "lucide-react"
import Link from "next/link"

// Mock audit log data
const mockAuditLogs = [
  {
    id: "1",
    timestamp: "2024-01-16 14:30:25",
    user: "john@bradsguitar.com",
    action: "Session Completed",
    details: "NDA session nda-session-001 completed successfully",
    sessionId: "nda-session-001",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "2",
    timestamp: "2024-01-16 13:45:12",
    user: "sarah@meemer.vc",
    action: "Clause Resolved",
    details: "Resolved conflict for 'Term of Confidentiality' clause",
    sessionId: "nda-session-001",
    ipAddress: "192.168.1.101",
    userAgent: "Firefox/121.0.0.0",
  },
  {
    id: "3",
    timestamp: "2024-01-16 12:15:33",
    user: "admin@demo.com",
    action: "Clause Updated",
    details: "Updated clause variant 'Standard Mutual' in Nature of NDA",
    sessionId: null,
    ipAddress: "192.168.1.1",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "4",
    timestamp: "2024-01-16 11:20:45",
    user: "john@bradsguitar.com",
    action: "Intake Submitted",
    details: "Submitted intake preferences for session nda-session-001",
    sessionId: "nda-session-001",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "5",
    timestamp: "2024-01-16 10:30:15",
    user: "mike@techcorp.com",
    action: "User Login",
    details: "User logged in successfully",
    sessionId: null,
    ipAddress: "192.168.1.102",
    userAgent: "Safari/17.0.0.0",
  },
]

export function AuditLogs() {
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase())
    return matchesSearch && matchesAction
  })

  const getActionColor = (action: string) => {
    if (action.includes("Login") || action.includes("Logout")) return "bg-blue-100 text-blue-800"
    if (action.includes("Completed") || action.includes("Resolved")) return "bg-green-100 text-green-800"
    if (action.includes("Updated") || action.includes("Created")) return "bg-yellow-100 text-yellow-800"
    if (action.includes("Deleted") || action.includes("Failed")) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
              <h1 className="text-xl font-heading font-semibold">Audit Logs</h1>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-heading font-bold mb-2">System Audit Logs</h2>
            <p className="text-muted-foreground">Track all system activities and user actions</p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Actions</option>
            <option value="login">Login/Logout</option>
            <option value="session">Session</option>
            <option value="clause">Clause</option>
            <option value="user">User</option>
          </select>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </Button>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log ({filteredLogs.length} entries)</CardTitle>
            <CardDescription>Comprehensive log of all system activities and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Timestamp</th>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Action</th>
                    <th className="text-left p-3 font-medium">Details</th>
                    <th className="text-left p-3 font-medium">Session</th>
                    <th className="text-left p-3 font-medium">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3" />
                          {log.user}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getActionColor(log.action)} variant="secondary">
                          <Activity className="w-3 h-3 mr-1" />
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{log.details}</span>
                      </td>
                      <td className="p-3">
                        {log.sessionId ? (
                          <Badge variant="outline" className="text-xs">
                            {log.sessionId}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-muted-foreground">
                          <div>{log.ipAddress}</div>
                          <div className="text-xs">{log.userAgent}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Log Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-accent">{mockAuditLogs.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockAuditLogs.filter((log) => log.action.includes("Login")).length}
              </div>
              <div className="text-sm text-muted-foreground">Login Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockAuditLogs.filter((log) => log.action.includes("Completed")).length}
              </div>
              <div className="text-sm text-muted-foreground">Completed Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {mockAuditLogs.filter((log) => log.action.includes("Updated")).length}
              </div>
              <div className="text-sm text-muted-foreground">System Updates</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
