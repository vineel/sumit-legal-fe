"use client"

import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  CheckCircle,
} from "lucide-react";
import {fetchDashboardStatus,DashboardStatusData,allactivitylogs  } from "@/lib/admin";
import { UserManagement } from "./user-management";
import { TemplateManagementNew } from "./template-management-new";
import { AgreementManagement } from "../agreement-management";
import { AuditLogs } from "./audit-logs";


// Removed mock stats - using real data from API


interface ActivityLog {
  _id: string;
  usr_id: { _id: string; name: string; email: string };
  type: string;
  description?: string;
  timestamp: string;
}
 

export function AdminDashboard() {
  const { user, logout } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
 const [status, setStatus] = useState<DashboardStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([]);
 
const [isLoading, setIsLoading] = useState(true);
const [fetchError, setFetchError] = useState<string | null>(null);

  // Get current tab from URL parameter
  const currentTab = searchParams.get('tab') || 'overview'

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', value)
    router.push(newUrl.pathname + newUrl.search)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <Users className="w-4 h-4 text-blue-500" />
      case 'user_logged_in':
        return <Users className="w-4 h-4 text-green-500" />
      case 'user_approved':
        return <Users className="w-4 h-4 text-green-600" />
      case 'user_rejected':
        return <Users className="w-4 h-4 text-red-500" />
      case 'profile_updated':
        return <Settings className="w-4 h-4 text-blue-500" />
      case 'template_created':
        return <FileText className="w-4 h-4 text-purple-500" />
      case 'agreement_created':
        return <FileText className="w-4 h-4 text-green-500" />
      case 'agreement_signed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'user_registered':
        return 'New User Registration'
      case 'user_logged_in':
        return 'User Login'
      case 'user_approved':
        return 'User Approved'
      case 'user_rejected':
        return 'User Rejected'
      case 'profile_updated':
        return 'Profile Updated'
      case 'template_created':
        return 'Template Created'
      case 'agreement_created':
        return 'Agreement Created'
      case 'agreement_signed':
        return 'Agreement Signed'
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getActivityType = (type: string) => {
    switch (type) {
      case 'user_registered':
      case 'user_logged_in':
      case 'user_approved':
      case 'user_rejected':
      case 'profile_updated':
        return 'User'
      case 'template_created':
        return 'Template'
      case 'agreement_created':
      case 'agreement_signed':
        return 'Agreement'
      default:
        return 'System'
    }
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
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">System Overview</h2>
          <p className="text-muted-foreground">
            Comprehensive management and analytics for your IBD Contracting platform
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
                    {status?.totalUsers}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
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
                    {status?.approvedUsers}
                  </p>
                  <p className="text-sm text-muted-foreground">Approved Users</p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">
                    {status?.totalAgreements || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Signed Agreements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

            {/* Enhanced Recent Activity - Full Width */}
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest system events and user actions across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {activities.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No recent activity found.</p>
                        <p className="text-sm text-muted-foreground mt-1">Activity will appear here as users interact with the system.</p>
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity._id} className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="font-medium text-sm text-foreground">
                                  {getActivityTitle(activity.type)}
                                </p>
                                {activity.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                {getTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {(activity.usr_id?.name || activity.usr_id?.email || "Unknown")[0].toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {activity.usr_id?.name || activity.usr_id?.email || "Unknown user"}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {getActivityType(activity.type)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

          </TabsContent>


          <TabsContent value="agreements" className="space-y-6">
            <AgreementManagement userRole="admin" />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <TemplateManagementNew />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLogs />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}
