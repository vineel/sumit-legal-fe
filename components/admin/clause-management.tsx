"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Tag,
  BookOpen
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAdminClauses, createAdminClause, updateAdminClause, deleteAdminClause, Clause } from "@/lib/clause"

export function ClauseManagement() {
  const [clauses, setClauses] = useState<Clause[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingClause, setEditingClause] = useState<Clause | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    required: false,
    status: "active" as "active" | "inactive"
  })

  useEffect(() => {
    fetchClauses()
  }, [])

  const fetchClauses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const data = await getAdminClauses(token)
      setClauses(data.clauses || [])
    } catch (err: any) {
      console.error("Error fetching clauses:", err)
      setError(err.response?.data?.message || "Failed to fetch clauses")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClause = async () => {
    try {
      setActionLoading("create")
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive"
        })
        return
      }

      await createAdminClause(token, formData)
      
      toast({
        title: "Success",
        description: "Clause created successfully",
        variant: "default"
      })
      
      setIsCreateDialogOpen(false)
      setFormData({ name: "", description: "", category: "", required: false, status: "active" })
      fetchClauses()
    } catch (err: any) {
      console.error("Error creating clause:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create clause",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateClause = async () => {
    if (!editingClause) return

    try {
      setActionLoading("update")
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive"
        })
        return
      }

      await updateAdminClause(token, editingClause._id, formData)
      
      toast({
        title: "Success",
        description: "Clause updated successfully",
        variant: "default"
      })
      
      setIsEditDialogOpen(false)
      setEditingClause(null)
      setFormData({ name: "", description: "", category: "", required: false, status: "active" })
      fetchClauses()
    } catch (err: any) {
      console.error("Error updating clause:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update clause",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteClause = async (clauseId: string) => {
    if (!confirm("Are you sure you want to delete this clause?")) return

    try {
      setActionLoading(clauseId)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive"
        })
        return
      }

      await deleteAdminClause(token, clauseId)
      
      toast({
        title: "Success",
        description: "Clause deleted successfully",
        variant: "default"
      })
      
      fetchClauses()
    } catch (err: any) {
      console.error("Error deleting clause:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete clause",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openEditDialog = (clause: Clause) => {
    setEditingClause(clause)
    setFormData({
      name: clause.name,
      description: clause.description,
      category: clause.category || "",
      required: clause.required || false,
      status: clause.status || "active"
    })
    setIsEditDialogOpen(true)
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredClauses = clauses.filter(clause =>
    clause.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clause.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (clause.category && clause.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading clauses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clause Management</h1>
          <p className="text-muted-foreground">Manage legal clauses and their variants</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Clause
        </Button>
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
          placeholder="Search clauses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clauses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClauses.map((clause) => (
          <Card key={clause._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{clause.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{clause.description}</CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant="outline">{clause.category || "General"}</Badge>
                  <Badge className={`${clause.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} text-xs`}>
                    {clause.status}
                  </Badge>
                  {clause.required && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{clause.variants?.length || 0} variants</span>
                </div>
              </div>

              {clause.variants && clause.variants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Variants:</p>
                  <div className="space-y-1">
                    {clause.variants.slice(0, 2).map((variant, index) => (
                      <div key={index} className="text-xs bg-muted p-2 rounded">
                        <div className="font-medium">{variant.name}</div>
                        <div className="text-muted-foreground">{variant.riskLevel} risk</div>
                      </div>
                    ))}
                    {clause.variants.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{clause.variants.length - 2} more variants
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(clause)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteClause(clause._id)}
                  disabled={actionLoading === clause._id}
                >
                  {actionLoading === clause._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClauses.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No clauses found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No clauses match your search criteria." : "Get started by creating your first clause."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Clause
            </Button>
          )}
        </div>
      )}

      {/* Create Clause Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Clause</CardTitle>
              <CardDescription>Add a new legal clause</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Clause Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter clause name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter clause description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category (e.g., Confidentiality, Liability)"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="required"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="required" className="text-sm font-medium">Required</label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCreateClause}
                  disabled={!formData.name || !formData.description || actionLoading === "create"}
                >
                  {actionLoading === "create" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Clause Dialog */}
      {isEditDialogOpen && editingClause && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Clause</CardTitle>
              <CardDescription>Update clause information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Clause Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter clause name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter clause description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category (e.g., Confidentiality, Liability)"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="required"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="required" className="text-sm font-medium">Required</label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingClause(null)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleUpdateClause}
                  disabled={!formData.name || !formData.description || actionLoading === "update"}
                >
                  {actionLoading === "update" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}