 "use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Edit, Trash2, Mail, Calendar, Check, X, Clock } from "lucide-react"
import Link from "next/link"
import { fetchAllUsers, searchUsers, updateUser, deleteUser, type User } from "@/lib/admin"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function UserManagement() {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editStatus, setEditStatus] = useState<string>("active")
  const [deletingUser, setDeletingUser] = useState<User | null>(null)



  const safeUsers: User[] = Array.isArray(users) ? users : []
  const filteredUsers = safeUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "party":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const updated = await updateUser(userId, { status: "active" })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)))
    } catch (e) {
      console.error("Failed to approve user", e)
    }
  }

  const handleRejectUser = async (userId: string) => {
    try {
      const updated = await updateUser(userId, { status: "inactive" })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)))
    } catch (e) {
      console.error("Failed to reject user", e)
    }
  }

  const pendingCount = safeUsers.filter((u) => u.status === "pending").length


  const normalizeUserRecord = (r: any): User => {
    return {
      id: r.id ?? r._id ?? "",
      name: r.name ?? "",
      email: r.email ?? "",
      role: r.role ?? "party",
      status: r.status ?? "pending",
    }
  }

  const normalizeUserArray = (data: any): User[] => {
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
      ? data.users
      : Array.isArray(data?.data)
      ? data.data
      : []
    return arr.map(normalizeUserRecord)
  }

  const fetchAndSetUsers = async () => {
    try {
      setLoading(true)
      const data = await fetchAllUsers()
      const normalized = normalizeUserArray(data)
      console.log("Fetched data:", normalized)
      setUsers(normalized)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAndSetUsers()
  }, [])

  // Debounced search using API
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        if (searchTerm.trim().length === 0) {
          await fetchAndSetUsers()
        } else {
          const results = await searchUsers(searchTerm.trim())
          const normalized = normalizeUserArray(results)
          setUsers(normalized)
        }
      } catch (e) {
        console.error("Search failed", e)
      }
    }, 300)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [searchTerm])

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (e) {
      console.error("Failed to delete user", e)
    }
  }

  const openEditModal = (u: User) => {
    const normalized = normalizeUserRecord(u)
    setEditingUser(normalized)
    setEditStatus(normalized.status)
  }

  const submitEdit = async () => {
    if (!editingUser) return
    try {
      const updated = await updateUser(editingUser.id, { status: editStatus as any })
      await fetchAndSetUsers()
    } catch (e) {
      console.error("Failed to update user", e)
    } finally {
      setEditingUser(null)
    }
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
              <h1 className="text-xl font-heading font-semibold">User Management</h1>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {pendingCount} pending approval
                </Badge>
              )}
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
            <h2 className="text-2xl font-heading font-bold mb-2">User Management</h2>
            <p className="text-muted-foreground">Review and approve user registrations, manage user permissions</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Review user registrations and manage account permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getRoleColor(u.role)} variant="secondary">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(u.status)} variant="secondary">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {u.status === "pending" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApproveUser(u.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectUser(u.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeletingUser(u)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-accent">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{users.filter((u) => u.status === "active").length}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{users.filter((u) => u.role === "admin").length}</div>
              <div className="text-sm text-muted-foreground">Admin Users</div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Status Modal */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Status</DialogTitle>
              <DialogDescription>Only status can be updated by admin.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-muted-foreground">User</div>
                <div className="font-medium">{editingUser?.name} ({editingUser?.email})</div>
              </div>
              <div>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)} className="bg-transparent">Cancel</Button>
              <Button onClick={submitEdit}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete user?</DialogTitle>
              <DialogDescription>Are you sure you want to delete this user? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="text-sm">
              <div className="text-muted-foreground">User</div>
              <div className="font-medium">{deletingUser?.name} ({deletingUser?.email})</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingUser(null)} className="bg-transparent">Cancel</Button>
              <Button variant="destructive" onClick={async () => { if (deletingUser) { await handleDelete(deletingUser.id); setDeletingUser(null); await fetchAndSetUsers() } }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
