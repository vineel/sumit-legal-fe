"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  CheckCircle, 
  Clock, 
  Mail,
  Send,
  Plus,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getTemplates, Template } from "@/lib/templateApi"
import { Clause } from "@/lib/clause"
import { createAgreement, sendInvite } from "@/lib/agreements"

export function TemplateSelectionPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteData, setInviteData] = useState({
    partyBEmail: ""
  })
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const data = await getTemplates(token)
      console.log("=== TEMPLATES DATA DEBUG ===")
      console.log("Raw templates data:", data)
      console.log("Templates array:", data.templates)
      if (data.templates && data.templates.length > 0) {
        console.log("First template structure:", data.templates[0])
        console.log("First template templatename:", data.templates[0].templatename)
      }
      setTemplates(data.templates || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching templates:", err)
      setError("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template =>
    (template.templatename && template.templatename.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSelectTemplate = (template: Template) => {
    console.log("=== TEMPLATE SELECTION DEBUG ===")
    console.log("Template clicked:", template.templatename || "Unnamed Template")
    console.log("Template ID:", template._id)
    setSelectedTemplate(template)
    console.log("Selected template set to:", template.templatename || "Unnamed Template")
    
    // Also open the modal immediately after selection
    setTimeout(() => {
      console.log("Opening modal after template selection...")
      setIsInviteDialogOpen(true)
    }, 100)
  }

  const handleCreateAgreement = async () => {
    console.log("=== TEMPLATE SELECTION SEND INVITE DEBUG ===")
    console.log("Selected template:", selectedTemplate)
    console.log("Invite data:", inviteData)
    
    if (!selectedTemplate) {
      console.log("❌ No template selected")
      toast({
        title: "No Template Selected",
        description: "Please select a template first by clicking on one of the template cards above.",
        variant: "destructive"
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteData.partyBEmail)) {
      console.log("❌ Invalid email format:", inviteData.partyBEmail)
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }

    try {
      console.log("✅ Starting agreement creation...")
      setIsCreating(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      console.log("Auth token exists:", !!token)
      
      if (!token) {
        console.log("❌ No auth token found")
        setError("No authentication token found")
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive"
        })
        return
      }

      // Create agreement with invite
      const agreementData = {
        templateId: selectedTemplate._id,
        clauses: selectedTemplate.clauses ? 
          selectedTemplate.clauses.map((clause, index) => {
            // Handle both string IDs and populated clause objects
            if (typeof clause === 'string') {
              return clause
            } else if (clause && typeof clause === 'object') {
              // For new template structure, use clause_name as identifier
              return clause.clause_name || `clause_${index}`
            }
            return ''
          }).filter(id => id !== '') : [],
        partyBEmail: inviteData.partyBEmail,
        effectiveDate: new Date().toISOString().split('T')[0], // Default to today
        termDuration: "1 year", // Default duration
        jurisdiction: "United States" // Default jurisdiction
      }

      console.log("Creating agreement with data:", agreementData)
      console.log("Calling createAgreement API...")
      
      toast({
        title: "Creating Agreement...",
        description: "Sending request to server...",
        variant: "default"
      })
      
      const result = await createAgreement(token, agreementData)
      console.log("✅ Agreement creation result:", result)
      
      toast({
        title: "Agreement Created Successfully",
        description: `Agreement created and invitation sent to ${inviteData.partyBEmail}. They will receive an email to start collaboration.`,
        variant: "default"
      })
      
      // Close dialog and reset form
      setIsInviteDialogOpen(false)
      setInviteData({ partyBEmail: "" })
      setSelectedTemplate(null)
      
      // Navigate to collaboration workspace
      router.push(`/collaboration?agreementId=${result.agreement._id}`)
    } catch (err: any) {
      console.error("Error creating agreement:", err)
      console.error("Error response:", err.response?.data)
      console.error("Error status:", err.response?.status)
      
      let errorMessage = "Failed to create agreement. Please try again."
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast({
        title: "Error Creating Agreement",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Select Template</h1>
                <p className="text-sm text-muted-foreground">Choose a template to start your agreement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="text-center py-8">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">Error Loading Templates</CardTitle>
              <CardDescription className="mb-4">{error}</CardDescription>
              <Button onClick={fetchTemplates}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && templates.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No Templates Available</CardTitle>
              <CardDescription className="mb-4">You don't have any templates yet. Contact your administrator to add templates.</CardDescription>
            </CardContent>
          </Card>
        )}

        {/* Selection Status */}
        {!loading && !error && (
          <div className="mb-6">
            {selectedTemplate ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-800 font-medium">
                    Template Selected: {selectedTemplate.templatename || "Unnamed Template"}
                  </span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Click "Send Invite" below to create an agreement and invite a collaborator.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-800 font-medium">
                    No Template Selected
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Click on a template card below to select it, then click "Send Invite".
                </p>
              </div>
            )}
          </div>
        )}

        {/* Templates Grid */}
        {!loading && !error && filteredTemplates.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card 
                key={template._id} 
                className={`hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                  selectedTemplate?._id === template._id 
                    ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg' 
                    : 'hover:ring-2 hover:ring-gray-300'
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{template.templatename || "Unnamed Template"}</CardTitle>
                        {selectedTemplate?._id === template._id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {template.description || "No description available"}
                      </CardDescription>
                    </div>
                    <Badge 
                      className={template.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"} 
                      variant="secondary"
                    >
                      {template.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Version:</span>
                      <span className="font-medium">v{template.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Clauses:</span>
                      <span className="font-medium">{template.clauses?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(template.createdAt)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click
                      handleSelectTemplate(template)
                    }}
                    disabled={!template.active}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && templates.length > 0 && filteredTemplates.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No Templates Found</CardTitle>
              <CardDescription className="mb-4">Try adjusting your search terms</CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Template Preview: {selectedTemplate.templatename || "Unnamed Template"}</h2>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Close
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{selectedTemplate.description || "No description available"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm">v{selectedTemplate.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Clauses Count</label>
                  <p className="text-sm">{selectedTemplate.clauses?.length || 0}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Included Clauses</h3>
                <div className="space-y-3">
                  {selectedTemplate.clauses && selectedTemplate.clauses.length > 0 ? (
                    selectedTemplate.clauses.map((clause, index) => {
                      // Handle both string IDs and populated clause objects
                      const clauseData = typeof clause === 'string' ? null : clause;
                      
                      // Handle clause data - for new template structure
                      const displayName = clauseData?.clause_name || `Clause ${index + 1}`;
                      const displayDescription = "Clause details will be loaded in the agreement";
                      const displayCategory = 'General';
                      const displayStatus = 'active';
                      
                      return (
                        <div key={clauseData?.clause_name || index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">
                                {displayName}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {displayDescription}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {clauseData && (
                                <>
                                  <Badge variant="outline">{displayCategory}</Badge>
                                  <Badge className={displayStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                    {displayStatus}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-muted-foreground">No clauses included in this template.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => {
                  console.log("=== CONTINUE BUTTON CLICKED ===")
                  console.log("Selected template before opening modal:", selectedTemplate)
                  setIsInviteDialogOpen(true)
                }} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Continue with This Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={(open) => {
        console.log("=== MODAL STATE CHANGE ===")
        console.log("Modal opening:", open)
        console.log("Selected template when modal opens:", selectedTemplate)
        setIsInviteDialogOpen(open)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Invite & Create Agreement
            </DialogTitle>
            <DialogDescription>
              Enter the email address of the party you want to collaborate with using "{selectedTemplate?.templatename || 'Selected Template'}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Info */}
            {(() => {
              console.log("=== MODAL RENDER DEBUG ===")
              console.log("Selected template in modal:", selectedTemplate)
              console.log("Template name:", selectedTemplate?.templatename || "Unnamed Template")
              return null
            })()}
            {selectedTemplate && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Selected Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedTemplate.templatename || "Unnamed Template"}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description || "No description available"}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">Version: v{selectedTemplate.version}</span>
                      <span className="text-muted-foreground">
                        Clauses: {selectedTemplate.clauses?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invite Form - Only Email */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partyBEmail">Party B Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="partyBEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={inviteData.partyBEmail}
                    onChange={(e) => setInviteData(prev => ({ ...prev, partyBEmail: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll send an invitation to this email address to start the collaboration. 
                  <br />
                  <strong>Note:</strong> The user must be registered and approved on the platform to receive the invitation.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsInviteDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log("=== TEMPLATE SELECTION BUTTON CLICKED ===")
                  console.log("Button clicked, isCreating:", isCreating)
                  console.log("Email:", inviteData.partyBEmail)
                  console.log("Selected template:", selectedTemplate)
                  handleCreateAgreement()
                }}
                disabled={isCreating || !inviteData.partyBEmail}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Agreement...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {selectedTemplate ? 'Send Invite' : 'Select Template First'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
