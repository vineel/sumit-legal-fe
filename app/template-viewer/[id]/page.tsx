"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Calendar, 
  User, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle
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
    }>
  }>
  global_questions?: Array<{
    question: string
    required: boolean
  }>
}

export default function TemplateViewerPage() {
  const params = useParams()
  const templateId = params.id as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      const response = await fetch(`http://localhost:5000/api/admin/template/single/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch template')
      }
      const data = await response.json()
      setTemplate(data)
    } catch (error) {
      console.error('Error fetching template:', error)
      toast({
        title: "Error",
        description: "Failed to load template. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    window.close()
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

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Template Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The template you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={handleGoBack} variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{template.templatename}</h1>
                <p className="text-muted-foreground mt-2">
                  {template.description || 'No description provided'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {template.clauses?.length || 0} clause{template.clauses?.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Template Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Template Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Created by:</span>
                  <span>{template.userid.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Created on:</span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Status:</span>
                  <Badge variant={template.active ? "default" : "secondary"}>
                    {template.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Questions Section */}
        {template.global_questions && template.global_questions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Global Questions</CardTitle>
              <CardDescription>
                Questions that will be asked during agreement creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.global_questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{question.question}</h4>
                      {question.required && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clauses Section */}
        <Card>
          <CardHeader>
            <CardTitle>Template Clauses</CardTitle>
            <CardDescription>
              Review all the clauses included in this template
            </CardDescription>
          </CardHeader>
          <CardContent>
            {template.clauses && template.clauses.length > 0 ? (
              <div className="space-y-6">
                {template.clauses.map((clause, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {index + 1}. {clause.clause_name}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">{clause.variants.length} variant{clause.variants.length !== 1 ? 's' : ''}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {clause.variants.map((variant, variantIndex) => (
                        <div key={variantIndex} className="bg-muted/50 rounded-lg p-4">
                          <h4 className="font-medium mb-3">{variant.variant_label}</h4>
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
                <h3 className="text-lg font-semibold mb-2">No clauses available</h3>
                <p className="text-muted-foreground">
                  This template doesn't have any clauses defined yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Close Template
          </Button>
        </div>
      </main>
    </div>
  )
}

