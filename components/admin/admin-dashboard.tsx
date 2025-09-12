"use client"

import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  FileText,
  Database,
  Activity,
  Settings,
  Plus,
  Clock,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {fetchDashboardStatus,DashboardStatusData,allactivitylogs  } from "@/lib/admin";
import { UserApproval } from "./user-approval";
import { TemplateManagement } from "./template-management";
import { ClauseManagement } from "./clause-management";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { AgreementManagement } from "../agreement-management";


const mockStats = {
  totalUsers: 156,
  activeSessions: 23,
  totalClauses: 89,
  totalTemplates: 12,
  monthlyGrowth: 12.5,
  systemHealth: 98.2,
  avgResolutionTime: "2.3 hours",
  successRate: 94.7,
  recentActivity: [
    { action: "New user registered", user: "john@company.com", time: "2 hours ago", type: "user" },
    { action: "Clause bank updated", user: "admin@demo.com", time: "4 hours ago", type: "system" },
    { action: "NDA session completed", user: "sarah@startup.com", time: "6 hours ago", type: "session" },
    { action: "Template uploaded", user: "admin@demo.com", time: "1 day ago", type: "template" },
    { action: "AI model updated", user: "system", time: "2 days ago", type: "ai" },
      { action: "NDA session completed", user: "sarah@startup.com", time: "6 hours ago", type: "session" },
    { action: "Template uploaded", user: "admin@demo.com", time: "1 day ago", type: "template" },
    { action: "AI model updated", user: "system", time: "2 days ago", type: "ai" },
      { action: "NDA session completed", user: "sarah@startup.com", time: "6 hours ago", type: "session" },
    { action: "Template uploaded", user: "admin@demo.com", time: "1 day ago", type: "template" },
    { action: "AI model updated", user: "system", time: "2 days ago", type: "ai" },
  ],
  systemAlerts: [
    { type: "warning", message: "3 unresolved sessions require attention", count: 3, priority: "high" },
    { type: "info", message: "System backup completed successfully", count: 1, priority: "low" },
    { type: "warning", message: "Clause bank sync pending", count: 1, priority: "medium" },
  ],
  analytics: {
    sessionsThisWeek: 47,
    avgSessionDuration: "45 min",
    topClauses: [
      { name: "Term of Confidentiality", usage: 89, trend: "up" },
      { name: "Purpose of Disclosure", usage: 76, trend: "stable" },
      { name: "Use Restrictions", usage: 65, trend: "down" },
    ],
    userActivity: [
      { day: "Mon", sessions: 12 },
      { day: "Tue", sessions: 19 },
      { day: "Wed", sessions: 15 },
      { day: "Thu", sessions: 22 },
      { day: "Fri", sessions: 18 },
      { day: "Sat", sessions: 8 },
      { day: "Sun", sessions: 5 },
    ],
  },
}


interface ActivityLog {
  _id: string;
  usr_id: { _id: string; name: string; email: string };
  type: string;
  timestamp: string;
}
 

export function AdminDashboard() {
  const { user, logout } = useAuth()
 const [status, setStatus] = useState<DashboardStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([]);
 
const [isLoading, setIsLoading] = useState(true);
const [fetchError, setFetchError] = useState<string | null>(null);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Users className="w-4 h-4 text-blue-500" />
      case "system":
        return <Settings className="w-4 h-4 text-green-500" />
      case "session":
        return <Activity className="w-4 h-4 text-purple-500" />
      case "template":
        return <FileText className="w-4 h-4 text-orange-500" />
      case "ai":
        return <Zap className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

useEffect(() => {
  async function fetchActivityLogs() {
    try {
      const data = await allactivitylogs();
      console.log(data,"data>>>!23");
      if (data?.success) {
        setActivities(data?.data);
      } else {
        setFetchError("Failed to load activities");
      }
    } catch (err) {
      setFetchError("Error loading activities");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  fetchActivityLogs();
}, []);
     useEffect(() => {
    setLoading(true)

    fetchDashboardStatus()
      .then((data) => {
        setStatus(data)
        console.log(data,"ddd")
        setError(null)
      })
      .catch((err) => {
        console.error("Error fetching dashboard status:", err)
        setError("Failed to load dashboard status.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

 

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-accent" />
                <h1 className="text-xl font-heading font-semibold">Admin Dashboard</h1>
              </div>
              {/* <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                System Health: {mockStats?.systemHealth}%
              </Badge> */}
            </div>
            <div className="flex items-center gap-4">
              {/* <Button variant="ghost" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button> */}
              {/* <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export Report
              </Button> */}
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <NotificationDropdown />
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
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">System Overview</h2>
          <p className="text-muted-foreground">
            Comprehensive management and analytics for your legal collaboration platform
          </p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">
                    {/* {mockStats?.totalUsers} */}
                     {status?.totalUsers}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <div className="flex items-center gap-1 mt-1">
                    {/* <TrendingUp className="w-3 h-3 text-green-500" /> */}
                    {/* <span className="text-xs text-green-600">+{mockStats?.monthlyGrowth}% this month</span> */}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">
                    {/* {mockStats?.activeSessions} */}
                            {status?.activeUsers}
                    </p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  {/* <p className="text-xs text-muted-foreground mt-1">Avg: {mockStats?.avgResolutionTime}</p> */}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">
           
                       {status?.totalClauses}
                    
                    </p>
                  <p className="text-sm text-muted-foreground">Clause Variants</p>
                  {/* <p className="text-xs text-green-600 mt-1">{mockStats?.successRate}% success rate</p> */}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">
                  {status?.totalTemplates}
                    </p>
                  <p className="text-sm text-muted-foreground">Templates</p>
                  {/* <p className="text-xs text-muted-foreground mt-1">
                    {mockStats?.analytics?.sessionsThisWeek} sessions this week
                  </p> */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="approvals">User Approvals</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="clauses">Clauses</TabsTrigger>
         
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Clause Bank
                  </CardTitle>
                  <CardDescription>Manage clause variants and legal text</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href="/admin/clauses">
                        <Plus className="w-4 h-4 mr-2" />
                        Manage Clauses
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Recent Activity & Alerts */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Enhanced Recent Activity */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Recent Activity
      </CardTitle>
      <CardDescription>Latest system events and user actions</CardDescription>
    </CardHeader>
    <CardContent>
      {/* <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {mockStats.recentActivity.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            {getActivityIcon(activity.type)}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div> */}
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
  {activities.length === 0 ? (
    <p className="text-muted-foreground text-sm">No recent activity found.</p>
  ) : (
    activities.map((activity) => (
      <div key={activity._id} className="flex items-start gap-3">
        {getActivityIcon(activity.type)}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">{activity.type.replace(/_/g, " ")}</p>
              <p className="text-xs text-muted-foreground">
                {activity.usr_id?.name || activity.usr_id?.email || "Unknown user"}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(activity.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    ))
  )}
</div>

      {/* <div className="mt-4">
        <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
          <Link href="/admin/audit">View Full Audit Log</Link>
        </Button>
      </div> */}
    </CardContent>
  </Card>
  

  {/* Enhanced System Alerts */}
  {/* ...system alerts card (optional) */}
</div>

          </TabsContent>


          <TabsContent value="agreements" className="space-y-6">
            <AgreementManagement userRole="admin" />
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <UserApproval />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <TemplateManagement />
          </TabsContent>

          <TabsContent value="clauses" className="space-y-6">
            <ClauseManagement />
          </TabsContent>

          {/* <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm">23%</span>
                    </div>
                    <Progress value={23} className="h-2" />

                    <div className="flex justify-between">
                      <span className="text-sm">Memory</span>
                      <span className="text-sm">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />

                    <div className="flex justify-between">
                      <span className="text-sm">Storage</span>
                      <span className="text-sm">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Database Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Connection: Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Backup: Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Sync: Pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm">120ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm">99.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Requests/min</span>
                      <span className="text-sm">1,247</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent> */}
        </Tabs>
      </main>
    </div>
  )
}
