"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react"
import { getTemplates, Template } from "@/lib/templateApi"

interface ClauseVariant {
  variant_label: string
  text: string
  best_used_when?: string
}

interface ClauseType {
  clause_name: string
  variants: ClauseVariant[]
}

export default function TemplateViewPage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchTemplate(params.id as string)
    }
  }, [params.id])

  const fetchTemplate = async (templateId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found. Please log in again.")
        return
      }

      const response = await getTemplates(token)
      const templates = response.templates || []
      const foundTemplate = templates.find((t: any) => t._id === templateId)
      
      if (foundTemplate) {
        console.log("Found template:", foundTemplate) // Debug log
        setTemplate(foundTemplate)
      } else {
        setError("Template not found")
      }
    } catch (err: any) {
      console.error("Error fetching template:", err)
      setError("Failed to load template")
    } finally {
      setLoading(false)
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => router.push('/admin/templates')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Template not found</h3>
          <Button 
            variant="outline"
            onClick={() => router.push('/admin/templates')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin?tab=templates')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-heading font-semibold">{template.agreement_type || template.templatename || "Untitled Template"}</h1>
                <p className="text-sm text-muted-foreground">Template Details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Template Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agreement Type</label>
                  <p className="text-lg font-semibold">{template.agreement_type || template.templatename || "Untitled Template"}</p>
                </div>
                
                {template.category && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <div className="mt-1">
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  </div>
                )}
                
                {template.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm mt-1">{template.description}</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sections:</span>
                    <span className="font-medium">{template.clauses?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Options:</span>
                    <span className="font-medium">
                      {template.clauses?.reduce((total, clause) => total + clause.variants.length, 0) || 0}
                    </span>
                  </div>
                </div>
                
                {template.createdAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm mt-1">{formatDate(template.createdAt)}</p>
                  </div>
                )}
                
                {template.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm mt-1">{formatDate(template.updatedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Template Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Agreement Sections</CardTitle>
                <CardDescription>
                  All sections and options in this template
                </CardDescription>
              </CardHeader>
              <CardContent>
                {template.clauses && template.clauses.length > 0 ? (
                  <div className="space-y-6">
                    {template.clauses.map((clause, clauseIndex) => (
                      <div key={clauseIndex} className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4 bg-green-100 p-3 rounded-lg">
                          <h3 className="text-lg font-semibold text-green-800">{clause.clause_name}</h3>
                          <Badge variant="secondary" className="bg-green-200 text-green-800">
                            {clause.variants.length} option{clause.variants.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          {clause.variants.map((variant, variantIndex) => (
                            <div key={variantIndex} className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-medium mb-3">{variant.variant_label}</h4>
                              
                              {variant.best_used_when && (
                                <div className="mb-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-blue-700">Best Used When:</span>
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                    <p className="text-sm text-blue-800">{variant.best_used_when}</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="bg-background rounded border p-3">
                                <p className="text-sm whitespace-pre-wrap">{variant.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No sections found</h3>
                    <p className="text-muted-foreground">This template doesn't have any sections yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
