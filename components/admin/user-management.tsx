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
  Trash2,
  Shield,
  UserCheck,
  UserX,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllUsers, approveUser, rejectUser, activateUser, deactivateUser, updateUser, deleteUser, User } from "@/lib/admin"

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
        user.id === userId ? { ...user, status: 'active' } : user
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
        user.id === userId ? { ...user, status: 'inactive' } : user
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

  const handleActivateUser = async (userId: string) => {
    try {
      console.log("=== FRONTEND ACTIVATE USER DEBUG ===");
      console.log("User ID:", userId);
      
      setActionLoading(`activate-${userId}`)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      console.log("Token found:", !!token);
      
      if (!token) {
        setError("No authentication token found")
        return
      }

      console.log("Calling activateUser API...");
      const result = await activateUser(token, userId)
      console.log("Activate user result:", result);
      
      // Update user status in local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'active' } : user
      ))
      
      toast({
        title: "User Activated",
        description: "User has been activated successfully and can now login.",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error activating user:", err)
      console.error("Error response:", err.response?.data)
      console.error("Error status:", err.response?.status)
      
      let errorMessage = "Failed to activate user. Please try again."
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

  const handleDeactivateUser = async (userId: string) => {
    const reason = prompt("Please provide a reason for deactivating this user (optional):")
    
    try {
      setActionLoading(`deactivate-${userId}`)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      await deactivateUser(token, userId, reason || undefined)
      
      // Update user status in local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'inactive' } : user
      ))
      
      toast({
        title: "User Deactivated",
        description: "User has been deactivated successfully and cannot login.",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error deactivating user:", err)
      console.error("Error response:", err.response?.data)
      console.error("Error status:", err.response?.status)
      
      let errorMessage = "Failed to deactivate user. Please try again."
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      setActionLoading(`delete-${userId}`)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      await deleteUser(token, userId)
      
      // Remove user from local state
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error deleting user:", err)
      console.error("Error response:", err.response?.data)
      console.error("Error status:", err.response?.status)
      
      let errorMessage = "Failed to delete user. Please try again."
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
      case 'active':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><UserCheck className="w-3 h-3" />Active</Badge>
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><UserX className="w-3 h-3" />Inactive</Badge>
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
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    inactive: users.filter(u => u.status === 'inactive').length,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users and their access</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
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

                  {user.status === 'inactive' && user.role !== 'admin' && (
                    <Button
                      onClick={() => {
                        console.log("Activate button clicked for user:", user.id, user.name);
                        handleActivateUser(user.id);
                      }}
                      disabled={actionLoading === `activate-${user.id}`}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      {actionLoading === `activate-${user.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      {actionLoading === `activate-${user.id}` ? "Activating..." : "Activate"}
                    </Button>
                  )}

                  {user.status === 'active' && user.role !== 'admin' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeactivateUser(user.id)}
                      disabled={actionLoading === `deactivate-${user.id}`}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      {actionLoading === `deactivate-${user.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserX className="w-4 h-4" />
                      )}
                      {actionLoading === `deactivate-${user.id}` ? "Deactivating..." : "Deactivate"}
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={actionLoading === `delete-${user.id}` || user.role === 'admin'}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    {actionLoading === `delete-${user.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      )}
    </div>
  )
}