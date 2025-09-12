"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getAllUsers, approveUser, rejectUser, User } from "@/lib/admin"

interface PendingUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt?: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
}

export function UserApproval() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const data = await getAllUsers(token)
      // Filter users with pending status
      const pendingUsers = data.users.filter((user: User) => user.status === 'pending')
      setPendingUsers(pendingUsers)
    } catch (err) {
      console.error("Error fetching pending users:", err)
      setError("Failed to load pending users")
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      setApproving(userId)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      await approveUser(token, userId)

      // Remove user from pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId))
      
      toast({
        title: "User Approved",
        description: "User has been approved successfully and can now login.",
        variant: "default"
      })
    } catch (err) {
      console.error("Error approving user:", err)
      setError("Failed to approve user")
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive"
      })
    } finally {
      setApproving(null)
    }
  }

  const handleRejectUser = async (userId: string) => {
    try {
      setRejecting(userId)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      await rejectUser(token, userId)

      // Remove user from pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId))
      setRejectReason("")
      setSelectedUserId(null)
      
      toast({
        title: "User Rejected",
        description: "User has been rejected and cannot login.",
        variant: "default"
      })
    } catch (err) {
      console.error("Error rejecting user:", err)
      setError("Failed to reject user")
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
        variant: "destructive"
      })
    } finally {
      setRejecting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pending users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve new user registrations
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {pendingUsers.length} Pending
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No pending user approvals at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user, index) => (
            <Card key={user.id || `user-${index}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Registered: {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </div>

                {user.address && (user.address.city || user.address.state || user.address.country) && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Location:</strong>{" "}
                    {[user.address.city, user.address.state, user.address.country]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveUser(user.id)}
                    disabled={approving === user.id}
                    className="flex items-center gap-2"
                  >
                    {approving === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {approving === user.id ? "Approving..." : "Approve"}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => setSelectedUserId(user.id)}
                    disabled={rejecting === user.id}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedUserId && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject User</CardTitle>
              <CardDescription>
                Please provide a reason for rejecting this user registration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejectReason">Reason for rejection</Label>
                <Textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleRejectUser(selectedUserId)}
                  disabled={rejecting === selectedUserId}
                  variant="destructive"
                  className="flex-1"
                >
                  {rejecting === selectedUserId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Rejecting...
                    </>
                  ) : (
                    "Reject User"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedUserId(null)
                    setRejectReason("")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </Card>
      )}
    </div>
  )
}
