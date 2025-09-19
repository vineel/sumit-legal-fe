"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  CheckCircle,
  XCircle,
  Clock, 
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
  Search,
  Edit,
  Shield,
  UserCheck,
  UserX
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllUsers, approveUser, rejectUser, updateUser, User } from "@/lib/admin"

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found. Please log in again.")
        return
      }

      const data = await getAllUsers(token)
      console.log("Fetched users data:", data) // Debug log
      console.log("Users array:", data?.users)
      console.log("First user:", data?.users?.[0])
      
      if (data && data.users) {
        setUsers(data.users)
        console.log("Users set in state:", data.users.length, "users")
      } else {
        setError("No user data received from server")
      }
    } catch (err: any) {
      console.error("Error fetching users:", err)
      
      let errorMessage = "Failed to load users"
      
      if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again."
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to access user data"
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later."
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      console.log("=== FRONTEND APPROVE USER DEBUG ===");
      console.log("User ID:", userId);
      
      setActionLoading(`approve-${userId}`)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      console.log("Token found:", !!token);
      
      if (!token) {
        setError("No authentication token found")
        return
      }

      console.log("Calling approveUser API...");
      const result = await approveUser(token, userId)
      console.log("Approve user result:", result);
      
      // Update user status in local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'approved' } : user
      ))
      
      toast({
        title: "User Approved",
        description: "User has been approved successfully and can now login.",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error approving user:", err)
      console.error("Error response:", err.response?.data)
      console.error("Error status:", err.response?.status)
      
      let errorMessage = "Failed to approve user. Please try again."
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectUser = async (userId: string) => {
    try {
      setActionLoading(`reject-${userId}`)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      await rejectUser(token, userId)
      
      // Update user status in local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'rejected' } : user
      ))
      
      toast({
        title: "User Rejected",
        description: "User has been rejected and cannot login.",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error rejecting user:", err)
      console.error("Error response:", err.response?.data)
      console.error("Error status:", err.response?.status)
      
      let errorMessage = "Failed to reject user. Please try again."
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }




  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><UserCheck className="w-3 h-3" />Approved</Badge>
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><UserX className="w-3 h-3" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1"><Shield className="w-3 h-3" />Admin</Badge>
    }
    return <Badge variant="outline">User</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: users.length,
    approved: users.filter(u => u.status === 'approved').length,
    pending: users.filter(u => u.status === 'pending').length,
    rejected: users.filter(u => u.status === 'rejected').length,
    admins: users.filter(u => u.role === 'admin').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all platform users and their access</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
        </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search users by name, email, status, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No users match your search criteria." : "No users have been registered yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user, index) => (
            <Card key={user.id || `user-${index}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {user.name}
                      {getRoleBadge(user.role)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </CardDescription>
                      </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(user.status)}
                  </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                  Registered: {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                    </div>

                <div className="flex gap-2 flex-wrap">
                  {user.status === 'pending' && (
                    <>
                      <Button 
                        onClick={() => {
                          console.log("Approve button clicked for user:", user.id, user.name);
                          handleApproveUser(user.id);
                        }}
                        disabled={actionLoading === `approve-${user.id}`}
                        className="flex items-center gap-2"
                        size="sm" 
                      >
                        {actionLoading === `approve-${user.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {actionLoading === `approve-${user.id}` ? "Approving..." : "Approve"}
                      </Button>

                      <Button 
                        variant="destructive" 
                        onClick={() => handleRejectUser(user.id)}
                        disabled={actionLoading === `reject-${user.id}`}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        {actionLoading === `reject-${user.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {actionLoading === `reject-${user.id}` ? "Rejecting..." : "Reject"}
                      </Button>
                    </>
                  )}


                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      )}
    </div>
  )
}