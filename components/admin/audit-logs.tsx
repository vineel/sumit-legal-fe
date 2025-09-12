"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, User, Activity, Loader2 } from "lucide-react"
import { allactivitylogs } from "@/lib/admin"


interface ActivityLog {
  _id: string;
  usr_id: { _id: string; name: string; email: string };
  type: string;
  description?: string;
  timestamp: string;
}

export function AuditLogs() {
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const response = await allactivitylogs()
        setLogs(response.data || [])
      } catch (err: any) {
        console.error("Error fetching activity logs:", err)
        setError("Failed to load activity logs")
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const userName = log.usr_id?.name || log.usr_id?.email || "Unknown"
    const action = log.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    const details = log.description || ""
    
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === "all" || action.toLowerCase().includes(actionFilter.toLowerCase())
    return matchesSearch && matchesAction
  })

  const getActionColor = (action: string) => {
    if (action.includes("Login") || action.includes("Logged")) return "bg-blue-100 text-blue-800"
    if (action.includes("Completed") || action.includes("Resolved") || action.includes("Approved")) return "bg-green-100 text-green-800"
    if (action.includes("Updated") || action.includes("Created")) return "bg-yellow-100 text-yellow-800"
    if (action.includes("Deleted") || action.includes("Failed") || action.includes("Rejected")) return "bg-red-100 text-red-800"
    if (action.includes("Registered")) return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-800"
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold mb-2">System Audit Logs</h2>
        <p className="text-muted-foreground">Track all system activities and user actions</p>
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
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading activity logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <div className="text-red-600">
                          <p>{error}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => window.location.reload()}
                          >
                            Retry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No activity logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const userName = log.usr_id?.name || log.usr_id?.email || "Unknown"
                      const action = log.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                      const details = log.description || ""
                      
                      return (
                        <tr key={log._id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {getTimeAgo(log.timestamp)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="w-3 h-3" />
                              {userName}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getActionColor(action)} variant="secondary">
                              <Activity className="w-3 h-3 mr-1" />
                              {action}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{details}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-muted-foreground text-sm">-</span>
                          </td>
                          <td className="p-3">
                            <span className="text-muted-foreground text-sm">-</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
