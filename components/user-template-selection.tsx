"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  Eye,
  ExternalLink,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Template {
  _id: string
  templatename: string
  description?: string
  active: boolean
  createdAt: string
  userid: {
    _id: string
    name: string
  }
  clauses?: Array<{
    clause_name: string
    variants: Array<{
      variant_label: string
      text: string
      best_used_when?: string
    }>
  }>
  global_questions?: Array<{
    question: string
    required: boolean
  }>
}

export function UserTemplateSelection() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      console.log('Token found:', !!token)
      
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      console.log('Fetching templates from backend server')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Failed to fetch templates: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Response data:', data)
      
      // Filter only active templates and populate userid properly
      const activeTemplates = data.templates?.filter((template: any) => template.active) || []
      console.log('Active templates:', activeTemplates.length)
      setTemplates(activeTemplates)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: `Failed to load templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.templatename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewTemplate = (templateId: string) => {
    // Open template in new tab
    window.open(`/template-viewer/${templateId}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Choose a Template</h1>
              <p className="text-muted-foreground mt-2">
                Select a legal agreement template to get started
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No templates found' : 'No templates available'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Contact your administrator to add templates'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.templatename}</CardTitle>
                      <CardDescription className="mt-2">
                        {template.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {template.clauses?.length || 0} clause{template.clauses?.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Template Info */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Created by: {template.userid.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={() => handleViewTemplate(template._id)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Template
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleViewTemplate(template._id)}
                        size="icon"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
