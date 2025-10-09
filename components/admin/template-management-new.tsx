"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ChevronDown,
  ChevronRight,
  Eye,
  GripVertical
} from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { useToast } from "@/hooks/use-toast"
import { getTemplates, createTemplate, updateAdminTemplate, Template, ClauseType } from "@/lib/templateApi"
import { useRouter } from "next/navigation"

// New types for the nested structure
interface ClauseVariant {
  variant_label: string
  text: string
  best_used_when?: string
}

interface GlobalQuestion {
  question: string
  required: boolean
}

// Use the ClauseType from the API
type NewTemplate = Template

export function TemplateManagementNew() {
  const [templates, setTemplates] = useState<NewTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NewTemplate | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Form state for new structure
  const [formData, setFormData] = useState<Partial<NewTemplate>>({
    agreement_type: "",
    description: "",
    category: "",
    clauses: [],
    global_questions: []
  })

  // Clause management state
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set())
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())

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

      const templatesData = await getTemplates(token)
      setTemplates(templatesData.templates || [])
    } catch (err: any) {
      console.error("Error fetching templates:", err)
      
      let errorMessage = "Failed to fetch templates"
      
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

  const addClauseType = () => {
    const newClauseType: ClauseType = {
      clause_name: "",
      variants: []
    }
    setFormData({
      ...formData,
      clauses: [...(formData.clauses || []), newClauseType]
    })
  }

  const removeClauseType = (index: number) => {
    if (!confirm("Are you sure you want to delete this section? This will also delete all options within this section.")) {
      return
    }
    setFormData({
      ...formData,
      clauses: (formData.clauses || []).filter((_, i) => i !== index)
    })
  }

  const updateClauseType = (index: number, field: keyof ClauseType, value: any) => {
    const updatedClauses = [...(formData.clauses || [])]
    updatedClauses[index] = { ...updatedClauses[index], [field]: value }
    setFormData({ ...formData, clauses: updatedClauses })
  }

  const addVariant = (clauseIndex: number) => {
    const newVariant: ClauseVariant = {
      variant_label: "",
      text: "",
      best_used_when: ""
    }
    const updatedClauses = [...(formData.clauses || [])]
    updatedClauses[clauseIndex].variants.push(newVariant)
    setFormData({ ...formData, clauses: updatedClauses })
  }

  const removeVariant = (clauseIndex: number, variantIndex: number) => {
    if (!confirm("Are you sure you want to delete this option?")) {
      return
    }
    const updatedClauses = [...(formData.clauses || [])]
    updatedClauses[clauseIndex].variants = updatedClauses[clauseIndex].variants.filter((_, i) => i !== variantIndex)
    setFormData({ ...formData, clauses: updatedClauses })
  }

  const updateVariant = (clauseIndex: number, variantIndex: number, field: keyof ClauseVariant, value: any) => {
    const updatedClauses = [...(formData.clauses || [])]
    updatedClauses[clauseIndex].variants[variantIndex] = {
      ...updatedClauses[clauseIndex].variants[variantIndex],
      [field]: value
    }
    setFormData({ ...formData, clauses: updatedClauses })
  }

  // Global questions management
  const addGlobalQuestion = () => {
    const newQuestion: GlobalQuestion = {
      question: "",
      required: false
    }
    setFormData({
      ...formData,
      global_questions: [...(formData.global_questions || []), newQuestion]
    })
  }

  const removeGlobalQuestion = (index: number) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return
    }
    setFormData({
      ...formData,
      global_questions: (formData.global_questions || []).filter((_, i) => i !== index)
    })
  }

  const updateGlobalQuestion = (index: number, field: keyof GlobalQuestion, value: any) => {
    const updatedQuestions = [...(formData.global_questions || [])]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setFormData({ ...formData, global_questions: updatedQuestions })
  }

  // Drag and drop handler for clause sections
  const handleDragEnd = (result: DropResult) => {
    try {
      if (!result.destination) return

      const { source, destination } = result
      if (source.index === destination.index) return

      // Validate indices
      if (source.index < 0 || destination.index < 0) return
      if (source.index >= (formData.clauses || []).length || destination.index >= (formData.clauses || []).length) return

      const updatedClauses = Array.from(formData.clauses || [])
      const [reorderedClause] = updatedClauses.splice(source.index, 1)
      updatedClauses.splice(destination.index, 0, reorderedClause)

      setFormData({ ...formData, clauses: updatedClauses })
    } catch (error) {
      console.error('Error in drag and drop:', error)
      toast({
        title: "Error",
        description: "Failed to reorder sections. Please try again.",
        variant: "destructive"
      })
    }
  }


  const handleCreateTemplate = async () => {
    // Validation
    if (!formData.agreement_type || !formData.agreement_type.trim()) {
      toast({
        title: "Validation Error",
        description: "Agreement type is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.clauses || formData.clauses.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one clause type",
        variant: "destructive"
      })
      return
    }

    // Validate each clause type has at least one variant
    for (const clause of formData.clauses) {
      if (!clause.clause_name.trim()) {
        toast({
          title: "Validation Error",
          description: "All clause types must have a name",
          variant: "destructive"
        })
        return
      }
      if (clause.variants.length === 0) {
        toast({
          title: "Validation Error",
          description: `Clause type "${clause.clause_name}" must have at least one variant`,
          variant: "destructive"
        })
        return
      }
      // Validate each variant
      for (const variant of clause.variants) {
        if (!variant.variant_label?.trim() || !variant.text?.trim() || !variant.best_used_when?.trim()) {
          toast({
            title: "Validation Error",
            description: "All variants must have a label, text, and best used when description",
            variant: "destructive"
          })
          return
        }
      }
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
        templatename: formData.agreement_type?.trim() || "",
        description: formData.description?.trim() || "",
        category: formData.category?.trim() || "General",
        clauses: formData.clauses, // Send the new nested structure
        global_questions: formData.global_questions || []
      }

      await createTemplate(token, templateData)
      
      toast({
        title: "Success",
        description: "Template created successfully",
        variant: "default"
      })
      
      setIsCreateDialogOpen(false)
      setFormData({ agreement_type: "", description: "", category: "", clauses: [], global_questions: [] })
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


  const openEditDialog = (template: NewTemplate) => {
    setEditingTemplate(template)
    
    // Handle both new and legacy template structures
    const agreementType = template.agreement_type || template.templatename || ""
    const description = template.description || ""
    const category = template.category || ""
    const clauses = template.clauses || []
    const globalQuestions = (template as any).global_questions || []
    
    // Ensure all variants have the best_used_when field for existing templates
    const processedClauses = clauses.map(clause => ({
      ...clause,
      variants: clause.variants.map(variant => ({
        ...variant,
        best_used_when: variant.best_used_when || ""
      }))
    }))
    
    setFormData({
      agreement_type: agreementType,
      description: description,
      category: category,
      clauses: processedClauses,
      global_questions: globalQuestions
    })
    setIsEditDialogOpen(true)
  }

  const handleViewTemplate = (template: NewTemplate) => {
    // Navigate to template view page
    router.push(`/admin/templates/${template._id}`)
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    // Validation
    if (!formData.agreement_type || !formData.agreement_type.trim()) {
      toast({
        title: "Validation Error",
        description: "Agreement type is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.clauses || formData.clauses.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one section",
        variant: "destructive"
      })
      return
    }

    // Validate each clause type has at least one variant
    for (const clause of formData.clauses) {
      if (!clause.clause_name.trim()) {
        toast({
          title: "Validation Error",
          description: "All sections must have a name",
          variant: "destructive"
        })
        return
      }
      if (clause.variants.length === 0) {
        toast({
          title: "Validation Error",
          description: `Section "${clause.clause_name}" must have at least one option`,
          variant: "destructive"
        })
        return
      }
      // Validate each variant
      for (const variant of clause.variants) {
        if (!variant.variant_label?.trim() || !variant.text?.trim() || !variant.best_used_when?.trim()) {
          toast({
            title: "Validation Error",
            description: "All options must have a name, text, and best used when description",
            variant: "destructive"
          })
          return
        }
      }
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
        templatename: formData.agreement_type?.trim() || "",
        description: formData.description?.trim() || "",
        category: formData.category?.trim() || "General",
        clauses: formData.clauses, // Send the new nested structure
        global_questions: formData.global_questions || []
      }

      await updateAdminTemplate(token, editingTemplate._id!, templateData)
      
      toast({
        title: "Success",
        description: "Template updated successfully",
        variant: "default"
      })
      
      setIsEditDialogOpen(false)
      setEditingTemplate(null)
      setFormData({ agreement_type: "", description: "", category: "", clauses: [], global_questions: [] })
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


  const filteredTemplates = templates.filter(template => {
    const agreementType = template.agreement_type || template.templatename || ""
    const description = template.description || ""
    const category = template.category || ""
    
    return agreementType.toLowerCase().includes(searchTerm.toLowerCase()) ||
           description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.toLowerCase().includes(searchTerm.toLowerCase())
  })

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
          <p className="text-muted-foreground">Create and manage document templates</p>
        </div>
        <Button onClick={() => {
          setFormData({ agreement_type: "", description: "", category: "", clauses: [], global_questions: [] })
          setIsCreateDialogOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Template
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
                  <CardTitle className="text-lg">{template.agreement_type || template.templatename || "Untitled Template"}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Badge variant="outline">{template.category || "General"}</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{template.clauses?.length || 0} sections</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">
                    {template.clauses?.reduce((total, clause) => total + clause.variants.length, 0) || 0} total options
                  </span>
                </div>
                {template.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewTemplate(template)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? "No templates found" : "No templates yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? "No templates match your search criteria." 
              : "Create your first document template to get started."
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => {
              setFormData({ agreement_type: "", description: "", category: "", clauses: [], global_questions: [] })
              setIsCreateDialogOpen(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
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
              setFormData({ agreement_type: "", description: "", category: "", clauses: [], global_questions: [] })
            }
          }}
        >
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>
                Create a document template with different sections and options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Template Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">📋 Template Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-blue-800">Agreement Type *</label>
                    <Input
                      value={formData.agreement_type || ""}
                      onChange={(e) => setFormData({ ...formData, agreement_type: e.target.value })}
                      placeholder="Enter agreement type"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-800">Category</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Enter category"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-blue-800">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Global Questions Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="mb-4">
                  <div>
                    <h3 className="font-semibold text-purple-900">❓ Global Questions</h3>
                    <p className="text-sm text-purple-700">Add questions that users will answer before creating agreements</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(formData.global_questions || []).map((question, questionIndex) => (
                    <Card key={questionIndex} className="border-2 border-purple-300 bg-white">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1">
                              <label className="text-sm font-medium text-purple-800 mb-2 block">Question</label>
                              <Input
                                value={question.question}
                                onChange={(e) => updateGlobalQuestion(questionIndex, "question", e.target.value)}
                                placeholder="Enter question text"
                                className="font-medium"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <label className="flex items-center gap-2 text-sm text-purple-800">
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={(e) => updateGlobalQuestion(questionIndex, "required", e.target.checked)}
                                className="rounded"
                              />
                              Required
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGlobalQuestion(questionIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add Question Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={addGlobalQuestion}
                    className="bg-purple-50 border-2 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 hover:text-purple-800 font-medium shadow-sm"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Clause Types Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="mb-4">
                  <div>
                    <h3 className="font-semibold text-green-900">📝 Agreement Sections</h3>
                    <p className="text-sm text-green-700">Add different sections of the agreement. Drag and drop to reorder sections.</p>
                  </div>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="clause-sections-create">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {(formData.clauses || []).map((clause, clauseIndex) => (
                          <Draggable key={clauseIndex} draggableId={`clause-create-${clauseIndex}`} index={clauseIndex}>
                            {(provided, snapshot) => (
                              <Card 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`border-2 border-green-300 bg-white transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <CardHeader className="pb-3 bg-green-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="cursor-grab hover:cursor-grabbing p-1 hover:bg-green-200 rounded"
                                        title="Drag to reorder"
                                      >
                                        <GripVertical className="w-4 h-4 text-green-600" />
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-sm font-medium text-green-800 mb-2 block">Section Name</label>
                                        <Input
                                          value={clause.clause_name}
                                          onChange={(e) => updateClauseType(clauseIndex, "clause_name", e.target.value)}
                                          placeholder="Enter section name"
                                          className="font-medium"
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeClauseType(clauseIndex)}
                                      className="text-red-600 hover:text-red-700 ml-4"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-3">
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <span className="text-sm font-medium text-green-800">Options for this section ({clause.variants.length})</span>
                                    </div>
                                  </div>

                                  {clause.variants.map((variant, variantIndex) => (
                                    <Card key={variantIndex} className="bg-orange-50 border-orange-200">
                                      <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 flex-1">
                                            <div className="flex-1">
                                              <label className="text-sm font-medium text-orange-800 mb-2 block">Option Name</label>
                                              <Input
                                                value={variant.variant_label}
                                                onChange={(e) => updateVariant(clauseIndex, variantIndex, "variant_label", e.target.value)}
                                                placeholder="Enter option name"
                                                className="font-medium"
                                              />
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeVariant(clauseIndex, variantIndex)}
                                            className="text-red-600 hover:text-red-700 ml-4"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>

                                        <div>
                                          <label className="text-sm font-medium text-orange-800 mb-2 block">Legal Text</label>
                                          <Textarea
                                            value={variant.text}
                                            onChange={(e) => updateVariant(clauseIndex, variantIndex, "text", e.target.value)}
                                            placeholder="Enter legal text"
                                            rows={4}
                                          />
                                        </div>

                                        <div>
                                          <label className="text-sm font-medium text-orange-800 mb-2 block">Best Used When</label>
                                          <Input
                                            value={variant.best_used_when}
                                            onChange={(e) => updateVariant(clauseIndex, variantIndex, "best_used_when", e.target.value)}
                                            placeholder="e.g., When dealing with international clients"
                                            className="font-medium"
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  
                                  {/* Add Another Option Button at Bottom */}
                                  <div className="flex justify-center pt-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="lg"
                                      onClick={() => addVariant(clauseIndex)}
                                      className="bg-orange-50 border-2 border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400 hover:text-orange-800 font-medium shadow-sm"
                                    >
                                      <Plus className="w-5 h-5 mr-2" />
                                      Add Option
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {/* Add Another Section Button */}
              <div className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-sm text-gray-500 bg-white">Need more sections?</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={addClauseType}
                    className="bg-green-50 border-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 hover:text-green-800 font-medium shadow-sm"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                      Add Section
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setFormData({ agreement_type: "", description: "", category: "", clauses: [], global_questions: [] })
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCreateTemplate}
                  disabled={!formData.agreement_type || !formData.clauses || formData.clauses.length === 0 || actionLoading === "create"}
                >
                  {actionLoading === "create" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Template
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
              setFormData({ agreement_type: "", description: "", category: "", clauses: [], global_questions: [] })
            }
          }}
        >
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Template</CardTitle>
              <CardDescription>
                Update template information and sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Template Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">📋 Template Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-blue-800">Agreement Type *</label>
                    <Input
                      value={formData.agreement_type || ""}
                      onChange={(e) => setFormData({ ...formData, agreement_type: e.target.value })}
                      placeholder="Enter agreement type"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-800">Category</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Enter category"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-blue-800">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Global Questions Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="mb-4">
                  <div>
                    <h3 className="font-semibold text-purple-900">❓ Global Questions</h3>
                    <p className="text-sm text-purple-700">Add questions that users will answer before creating agreements</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(formData.global_questions || []).map((question, questionIndex) => (
                    <Card key={questionIndex} className="border-2 border-purple-300 bg-white">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1">
                              <label className="text-sm font-medium text-purple-800 mb-2 block">Question</label>
                              <Input
                                value={question.question}
                                onChange={(e) => updateGlobalQuestion(questionIndex, "question", e.target.value)}
                                placeholder="Enter question text"
                                className="font-medium"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <label className="flex items-center gap-2 text-sm text-purple-800">
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={(e) => updateGlobalQuestion(questionIndex, "required", e.target.checked)}
                                className="rounded"
                              />
                              Required
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGlobalQuestion(questionIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add Question Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={addGlobalQuestion}
                    className="bg-purple-50 border-2 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 hover:text-purple-800 font-medium shadow-sm"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Clause Types Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="mb-4">
                  <div>
                    <h3 className="font-semibold text-green-900">📝 Agreement Sections</h3>
                    <p className="text-sm text-green-700">Add different sections of the agreement. Drag and drop to reorder sections.</p>
                  </div>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="clause-sections-edit">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {(formData.clauses || []).map((clause, clauseIndex) => (
                          <Draggable key={clauseIndex} draggableId={`clause-edit-${clauseIndex}`} index={clauseIndex}>
                            {(provided, snapshot) => (
                              <Card 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`border-2 border-green-300 bg-white transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <CardHeader className="pb-3 bg-green-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="cursor-grab hover:cursor-grabbing p-1 hover:bg-green-200 rounded"
                                        title="Drag to reorder"
                                      >
                                        <GripVertical className="w-4 h-4 text-green-600" />
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-sm font-medium text-green-800 mb-2 block">Section Name</label>
                                        <Input
                                          value={clause.clause_name}
                                          onChange={(e) => updateClauseType(clauseIndex, "clause_name", e.target.value)}
                                          placeholder="Enter section name"
                                          className="font-medium"
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeClauseType(clauseIndex)}
                                      className="text-red-600 hover:text-red-700 ml-4"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-3">
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <span className="text-sm font-medium text-green-800">Options for this section ({clause.variants.length})</span>
                                    </div>
                                  </div>

                                  {clause.variants.map((variant, variantIndex) => (
                                    <Card key={variantIndex} className="bg-orange-50 border-orange-200">
                                      <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 flex-1">
                                            <div className="flex-1">
                                              <label className="text-sm font-medium text-orange-800 mb-2 block">Option Name</label>
                                              <Input
                                                value={variant.variant_label}
                                                onChange={(e) => updateVariant(clauseIndex, variantIndex, "variant_label", e.target.value)}
                                                placeholder="Enter option name"
                                                className="font-medium"
                                              />
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeVariant(clauseIndex, variantIndex)}
                                            className="text-red-600 hover:text-red-700 ml-4"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>

                                        <div>
                                          <label className="text-sm font-medium text-orange-800 mb-2 block">Legal Text</label>
                                          <Textarea
                                            value={variant.text}
                                            onChange={(e) => updateVariant(clauseIndex, variantIndex, "text", e.target.value)}
                                            placeholder="Enter legal text"
                                            rows={4}
                                          />
                                        </div>

                                        <div>
                                          <label className="text-sm font-medium text-orange-800 mb-2 block">Best Used When</label>
                                          <Input
                                            value={variant.best_used_when}
                                            onChange={(e) => updateVariant(clauseIndex, variantIndex, "best_used_when", e.target.value)}
                                            placeholder="e.g., When dealing with international clients"
                                            className="font-medium"
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  
                                  {/* Add Another Option Button at Bottom */}
                                  <div className="flex justify-center pt-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="lg"
                                      onClick={() => addVariant(clauseIndex)}
                                      className="bg-orange-50 border-2 border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400 hover:text-orange-800 font-medium shadow-sm"
                                    >
                                      <Plus className="w-5 h-5 mr-2" />
                                      Add Option
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {/* Add Another Section Button */}
              <div className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-sm text-gray-500 bg-white">Need more sections?</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={addClauseType}
                    className="bg-green-50 border-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 hover:text-green-800 font-medium shadow-sm"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                      Add Section
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingTemplate(null)
                    setFormData({ agreement_type: "", description: "", category: "", clauses: [], global_questions: [] })
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleUpdateTemplate}
                  disabled={!formData.agreement_type || !formData.clauses || formData.clauses.length === 0 || actionLoading === "update"}
                >
                  {actionLoading === "update" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Update Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
