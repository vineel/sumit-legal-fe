"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Template {
  _id: string
  templatename: string
  description: string
  clauses: Array<{
    _id: string
    clause_name: string
    variants: Array<{
      variant_label: string
      text: string
    }>
  }>
  global_questions: Array<{
    question: string
    required: boolean
  }>
  createdAt: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates)
      } else {
        throw new Error(data.message || 'Failed to fetch templates')
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewTemplate = (templateId: string) => {
    router.push(`/template-viewer/${templateId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Templates</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Available Templates</h1>
            <p className="text-muted-foreground mt-2">Choose a template to start creating your agreement</p>
          </div>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
              <p className="text-muted-foreground mb-4">Contact your administrator to add templates.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {template.templatename}
                  </CardTitle>
                  <CardDescription>
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Clause Types:</span>
                      <Badge variant="outline">{template.clauses.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Variants:</span>
                      <Badge variant="outline">
                        {template.clauses.reduce((sum, clause) => sum + clause.variants.length, 0)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Global Questions:</span>
                      <Badge variant="outline">{template.global_questions.length}</Badge>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleViewTemplate(template._id)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
