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
  AlertCircle
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
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
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
        setError("No authentication token found. Please log in again.")
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
      
      let errorMessage = "Failed to fetch data"
      
      if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again."
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to access this data"
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

  const handleCreateTemplate = async () => {
    // Validation
    if (!formData.templatename.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Template description is required",
        variant: "destructive"
      })
      return
    }

    if (formData.clauses.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one clause for the template",
        variant: "destructive"
      })
      return
    }

    try {
      setActionLoading("create")
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please log in again.",
          variant: "destructive"
        })
        return
      }

      const templateData = {
        templatename: formData.templatename.trim(),
        description: formData.description.trim(),
        category: formData.category.trim() || "General",
        clauses: formData.clauses
      }

      await createTemplate(token, templateData)
      
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
      
      let errorMessage = "Failed to create template"
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again."
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to create templates"
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid template data. Please check your input."
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later."
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    // Validation
    if (!formData.templatename.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Template description is required",
        variant: "destructive"
      })
      return
    }

    if (formData.clauses.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one clause for the template",
        variant: "destructive"
      })
      return
    }

    try {
      setActionLoading("update")
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please log in again.",
          variant: "destructive"
        })
        return
      }

      const templateData = {
        templatename: formData.templatename.trim(),
        description: formData.description.trim(),
        category: formData.category.trim() || "General",
        clauses: formData.clauses
      }

      await updateAdminTemplate(token, editingTemplate._id, templateData)
      
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
      
      let errorMessage = "Failed to update template"
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again."
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to update templates"
      } else if (err.response?.status === 404) {
        errorMessage = "Template not found"
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid template data. Please check your input."
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later."
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) return

    try {
      setActionLoading(templateId)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found. Please log in again.",
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
      
      let errorMessage = "Failed to delete template"
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again."
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to delete templates"
      } else if (err.response?.status === 404) {
        errorMessage = "Template not found"
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later."
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template)
    
    // Extract clause IDs from the template
    let clauseIds: string[] = []
    if (template.clauses && Array.isArray(template.clauses)) {
      // If clauses are populated objects, extract their IDs
      clauseIds = template.clauses.map((clause: any) => 
        typeof clause === 'string' ? clause : clause._id || clause.id
      )
    } else if (template.clauseIds && Array.isArray(template.clauseIds)) {
      // If clauseIds field exists, use it
      clauseIds = template.clauseIds
    }
    
    console.log("Template data for editing:", template)
    console.log("Extracted clause IDs:", clauseIds)
    
    // setFormData({
    //   templatename: template.templatename,
    //   description: template.description,
    //   category: template.category || "",
    //   clauses: clauseIds
    // })
    setFormData({
  templatename: template.templatename || "",
  description: template.description || "",
  category: (template as any).category || "",
  clauses: clauseIds
})
    setIsEditDialogOpen(true)
  }


  // const filteredTemplates = templates.filter(template =>
  //   template.templatename.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   (template.category && template.category.toLowerCase().includes(searchTerm.toLowerCase()))
  // )
  const filteredTemplates = templates.filter(template =>
  (template.templatename || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
  (template.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
  (template as any).category?.toLowerCase().includes(searchTerm.toLowerCase())

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
        <Button onClick={() => {
          setFormData({ templatename: "", description: "", category: "", clauses: [] })
          setIsCreateDialogOpen(true)
        }}>
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
                {/* <Badge variant="outline">{template.category || "General"}</Badge> */}
                <Badge variant="outline">{(template as any).category || "General"}</Badge>

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
            <Button onClick={() => {
              setFormData({ templatename: "", description: "", category: "", clauses: [] })
              setIsCreateDialogOpen(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}

      {/* Create Template Dialog */}
      {isCreateDialogOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateDialogOpen(false)
              setFormData({ templatename: "", description: "", category: "", clauses: [] })
            }
          }}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <label className="text-sm font-medium mb-2 block">Select Clauses</label>
                {clauses.length === 0 ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">No clauses available</p>
                    <p className="text-xs text-muted-foreground">Create clauses first to add them to templates</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {formData.clauses.length} of {clauses.length} clauses selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, clauses: clauses.map(c => c._id) })}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, clauses: [] })}
                          className="text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-3 bg-muted/20">
                      {clauses.map((clause) => (
                        <div 
                          key={clause._id} 
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                            formData.clauses.includes(clause._id) 
                              ? 'bg-accent/10 border-accent' 
                              : 'bg-background border-border hover:border-accent/50'
                          }`}
                        >
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
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`clause-${clause._id}`}
                              className="text-sm font-medium leading-none cursor-pointer block"
                            >
                              {clause.name}
                            </label>
                            {clause.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {clause.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {clause.category || "General"}
                              </Badge>
                              <Badge 
                                className={`text-xs ${
                                  clause.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {clause.status}
                              </Badge>
                              {clause.required && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setFormData({ templatename: "", description: "", category: "", clauses: [] })
                  }}
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
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditDialogOpen(false)
              setEditingTemplate(null)
              setFormData({ templatename: "", description: "", category: "", clauses: [] })
            }
          }}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <label className="text-sm font-medium mb-2 block">Select Clauses</label>
                {clauses.length === 0 ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">No clauses available</p>
                    <p className="text-xs text-muted-foreground">Create clauses first to add them to templates</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {formData.clauses.length} of {clauses.length} clauses selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, clauses: clauses.map(c => c._id) })}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, clauses: [] })}
                          className="text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-3 bg-muted/20">
                      {clauses.map((clause) => (
                        <div 
                          key={clause._id} 
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                            formData.clauses.includes(clause._id) 
                              ? 'bg-accent/10 border-accent' 
                              : 'bg-background border-border hover:border-accent/50'
                          }`}
                        >
                          <Checkbox
                            id={`edit-clause-${clause._id}`}
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
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`edit-clause-${clause._id}`}
                              className="text-sm font-medium leading-none cursor-pointer block"
                            >
                              {clause.name}
                            </label>
                            {clause.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {clause.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {clause.category || "General"}
                              </Badge>
                              <Badge 
                                className={`text-xs ${
                                  clause.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {clause.status}
                              </Badge>
                              {clause.required && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

    </div>
  )
}