"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FileText, 
  Plus, 
  Edit,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getTemplates, createTemplate, updateAdminTemplate, deleteAdminTemplate, Template } from "@/lib/templateApi"
import { getAdminClauses, Clause } from "@/lib/clause"

export function TemplateManagement() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [clauses, setClauses] = useState<Clause[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    templatename: "",
    description: "",
    category: "",
    clauses: [] as string[]
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const [templatesData, clausesData] = await Promise.all([
        getTemplates(token),
        getAdminClauses(token)
      ])
      
      setTemplates(templatesData.templates || [])
      setClauses(clausesData.clauses || [])
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.response?.data?.message || "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
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

      await createTemplate(token, formData)
      
      toast({
        title: "Success",
        description: "Template created successfully",
        variant: "default"
      })
      
      setIsCreateDialogOpen(false)
      setFormData({ templatename: "", description: "", category: "", clauses: [] })
      fetchTemplates()
    } catch (err: any) {
      console.error("Error creating template:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create template",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

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

      await updateAdminTemplate(token, editingTemplate._id, formData)
      
      toast({
        title: "Success",
        description: "Template updated successfully",
        variant: "default"
      })
      
      setIsEditDialogOpen(false)
      setEditingTemplate(null)
      setFormData({ templatename: "", description: "", category: "", clauses: [] })
      fetchTemplates()
    } catch (err: any) {
      console.error("Error updating template:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update template",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      setActionLoading(templateId)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive"
        })
        return
      }

      await deleteAdminTemplate(token, templateId)
      
      toast({
        title: "Success",
        description: "Template deleted successfully",
        variant: "default"
      })
      
      fetchTemplates()
    } catch (err: any) {
      console.error("Error deleting template:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete template",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      templatename: template.templatename,
      description: template.description,
      category: template.category || "",
      clauses: template.clauses || []
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (template: Template) => {
    setViewingTemplate(template)
    setIsViewDialogOpen(true)
  }

  const filteredTemplates = templates.filter(template =>
    template.templatename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.category && template.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Management</h1>
          <p className="text-muted-foreground">Manage document templates and their clauses</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
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
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.templatename}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Badge variant="outline">{template.category || "General"}</Badge>
                </div>
              </CardHeader>
            
              <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{template.clauses?.length || 0} clauses</span>
                </div>
                </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openViewDialog(template)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(template)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteTemplate(template._id)}
                  disabled={actionLoading === template._id}
                >
                  {actionLoading === template._id ? (
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

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No templates match your search criteria." : "Get started by creating your first template."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}

      {/* Create Template Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
          <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>Add a new document template</CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={formData.templatename}
                  onChange={(e) => setFormData({ ...formData, templatename: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category (e.g., NDA, Contract)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Select Clauses</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                  {clauses.map((clause) => (
                    <div key={clause._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`clause-${clause._id}`}
                        checked={formData.clauses.includes(clause._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              clauses: [...formData.clauses, clause._id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              clauses: formData.clauses.filter(id => id !== clause._id)
                            })
                          }
                        }}
                      />
                      <label
                        htmlFor={`clause-${clause._id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {clause.name}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {clause.category}
                      </Badge>
                </div>
                  ))}
                  {clauses.length === 0 && (
                    <p className="text-sm text-muted-foreground">No clauses available. Create clauses first.</p>
                  )}
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
                  onClick={handleCreateTemplate}
                  disabled={!formData.templatename || !formData.description || actionLoading === "create"}
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

      {/* Edit Template Dialog */}
      {isEditDialogOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Template</CardTitle>
              <CardDescription>Update template information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={formData.templatename}
                  onChange={(e) => setFormData({ ...formData, templatename: e.target.value })}
                  placeholder="Enter template name"
                />
                </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter template description"
                  rows={3}
                />
                </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category (e.g., NDA, Contract)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Select Clauses</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                  {clauses.map((clause) => (
                    <div key={clause._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`clause-${clause._id}`}
                        checked={formData.clauses.includes(clause._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              clauses: [...formData.clauses, clause._id]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              clauses: formData.clauses.filter(id => id !== clause._id)
                            })
                          }
                        }}
                      />
                      <label
                        htmlFor={`clause-${clause._id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {clause.name}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {clause.category}
                      </Badge>
                    </div>
                  ))}
                  {clauses.length === 0 && (
                    <p className="text-sm text-muted-foreground">No clauses available. Create clauses first.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingTemplate(null)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleUpdateTemplate}
                  disabled={!formData.templatename || !formData.description || actionLoading === "update"}
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

      {/* View Template Dialog */}
      {isViewDialogOpen && viewingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Template Details
              </CardTitle>
              <CardDescription>View template information and clauses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{viewingTemplate.templatename}</h3>
                <p className="text-muted-foreground">{viewingTemplate.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-sm">{viewingTemplate.category || "General"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm">{viewingTemplate.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={viewingTemplate.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {viewingTemplate.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(viewingTemplate.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">Included Clauses</label>
                <div className="space-y-2">
                  {viewingTemplate.clauses && viewingTemplate.clauses.length > 0 ? (
                    viewingTemplate.clauses.map((clauseId) => {
                      const clause = clauses.find(c => c._id === clauseId)
                      return clause ? (
                        <div key={clauseId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{clause.name}</p>
                            <p className="text-sm text-muted-foreground">{clause.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{clause.category}</Badge>
                            <Badge className={clause.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {clause.status}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div key={clauseId} className="p-3 border rounded-lg text-muted-foreground">
                          Clause not found (ID: {clauseId})
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-muted-foreground">No clauses included in this template.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    setViewingTemplate(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}