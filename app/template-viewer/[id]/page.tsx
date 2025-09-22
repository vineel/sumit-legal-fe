"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  GripVertical,
  Check,
  X
} from "lucide-react"
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useToast } from "@/hooks/use-toast"

interface ClauseVariant {
  variant_label: string
  text: string
}

interface Clause {
  _id: string
  clause_name: string
  variants: ClauseVariant[]
}

interface GlobalQuestion {
  question: string
  required: boolean
}

interface Template {
  _id: string
  templatename: string
  description: string
  clauses: Clause[]
  global_questions: GlobalQuestion[]
}

interface SelectedClause {
  clause_name: string
  variant: ClauseVariant
  status: 'accepted' | 'rejected'
  order: number
}

export default function TemplateViewerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({})
  const [selectedClauses, setSelectedClauses] = useState<SelectedClause[]>([])
  const [clauseVariantsOrder, setClauseVariantsOrder] = useState<Record<string, Array<ClauseVariant & { order: number }>>>({})
  const [inviteEmail, setInviteEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const templateId = params.id as string

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/template/single/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch template')
      }

      const data = await response.json()
      if (data.success) {
        setTemplate(data.template)
        initializeClauseVariantsOrder(data.template.clauses)
      } else {
        throw new Error(data.message || 'Failed to fetch template')
      }
    } catch (error: any) {
      console.error('Error fetching template:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const initializeClauseVariantsOrder = (clauses: Clause[]) => {
    const order: Record<string, Array<ClauseVariant & { order: number }>> = {}
    clauses.forEach(clause => {
      order[clause.clause_name] = clause.variants.map((variant, index) => ({
        ...variant,
        order: index
      }))
    })
    setClauseVariantsOrder(order)
  }

  const handleGlobalQuestionChange = (question: string, value: string) => {
    setIntakeAnswers(prev => ({
      ...prev,
      [question]: value
    }))
  }

  const handleClauseVariantSelect = (clauseName: string, variant: ClauseVariant, status: 'accepted' | 'rejected') => {
    setSelectedClauses(prev => {
      const filtered = prev.filter(sc => !(sc.clause_name === clauseName && sc.variant.variant_label === variant.variant_label))
      return [...filtered, {
        clause_name: clauseName,
        variant,
        status,
        order: clauseVariantsOrder[clauseName]?.find(v => v.variant_label === variant.variant_label)?.order || 0
      }]
    })
  }

  const handleDrop = (clauseName: string, targetIndex: number, draggedItem: any) => {
    const { clauseName: draggedClauseName, variantIndex: draggedIndex } = draggedItem

    if (clauseName !== draggedClauseName || draggedIndex === targetIndex) {
      return
    }

    setClauseVariantsOrder(prev => {
      const newOrder = { ...prev }
      const variants = [...newOrder[clauseName]]

      // Remove the dragged item from its current position
      const draggedVariant = variants.splice(draggedIndex, 1)[0]
      
      // Insert it at the target position
      variants.splice(targetIndex, 0, draggedVariant)
      
      // Update order numbers
      const updatedVariants = variants.map((variant, index) => ({
        ...variant,
        order: index
      }))

      newOrder[clauseName] = updatedVariants
      return newOrder
    })
  }

  const validateForm = () => {
    if (!template) return false

    // Check if all global questions are answered
    const requiredQuestions = template.global_questions.filter(q => q.required)
    for (const question of requiredQuestions) {
      if (!intakeAnswers[question.question]?.trim()) {
        toast({
          title: "Validation Error",
          description: `Please answer the required question: ${question.question}`,
          variant: "destructive"
        })
        return false
      }
    }

    // Check if all clause variants are selected
    const totalVariants = template.clauses.reduce((sum, clause) => sum + clause.variants.length, 0)
    if (selectedClauses.length !== totalVariants) {
      toast({
        title: "Selection Required",
        description: "Please accept or reject all clause variants before proceeding.",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSendInvite = async () => {
    if (!validateForm()) return

    if (!template) {
      toast({
        title: "Template Error",
        description: "Template not loaded. Please try again.",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('🚀 Creating agreement with template:', template._id)

      const initiatorData = {
        intakeAnswers: intakeAnswers,
        selectedClauses: selectedClauses,
        clauseVariantsOrder: clauseVariantsOrder
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreement/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: template._id,
          inviteEmail: inviteEmail,
          initiatorData: initiatorData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Agreement creation failed:', errorData)
        throw new Error(errorData.message || 'Failed to create agreement')
      }

      const result = await response.json()
      console.log('✅ Agreement created successfully:', result)
      
      toast({
        title: "Invite Sent!",
        description: `Agreement created and invite sent to ${inviteEmail}`,
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error sending invite:', error)
      toast({
        title: "Error",
        description: `Failed to send invite: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Draggable Variant Component
  const DraggableVariant = ({ 
    clauseName, 
    variant, 
    variantIndex, 
    isSelected, 
    status 
  }: {
    clauseName: string
    variant: ClauseVariant
    variantIndex: number
    isSelected: boolean
    status?: 'accepted' | 'rejected'
  }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'clause-variant',
      item: { clauseName, variantIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })

    return (
      <div
        className={`p-4 border rounded-lg transition-all ${
          isDragging ? 'opacity-50' : ''
        } ${
          isSelected 
            ? 'border-[#a16207] bg-[#a16207]/10' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <div ref={drag as any} className="cursor-move">
            <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{variant.variant_label}</h4>
            <p className="text-sm text-gray-600 mt-1">{variant.text}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={status === 'accepted' ? 'default' : 'outline'}
              onClick={() => handleClauseVariantSelect(clauseName, variant, 'accepted')}
              className="h-8 px-3"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={status === 'rejected' ? 'destructive' : 'outline'}
              onClick={() => handleClauseVariantSelect(clauseName, variant, 'rejected')}
              className="h-8 px-3"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Drop Target Component
  const DropTarget = ({ clauseName, index, children }: { clauseName: string; index: number; children: React.ReactNode }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'clause-variant',
      drop: (item: { clauseName: string; variantIndex: number }, monitor) => {
        const { clauseName: draggedClauseName, variantIndex: draggedIndex } = item
        
        if (clauseName === draggedClauseName && draggedIndex !== index) {
          handleDrop(clauseName, index, item)
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    })

    return (
      <div
        ref={drop as any}
        className={`${isOver ? 'bg-blue-100 border-2 border-blue-300' : ''} transition-colors`}
      >
        {children}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading template...</p>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'The template you are looking for does not exist or has been removed.'}
          </p>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{template.templatename}</h1>
            <p className="text-muted-foreground mt-2">{template.description}</p>
          </div>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <DndProvider backend={HTML5Backend}>
          <div className="space-y-8">
            {/* Global Questions */}
            {template.global_questions && template.global_questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Global Questions
                  </CardTitle>
                  <CardDescription>
                    Please answer these questions to customize your agreement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.global_questions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-sm font-medium">
                        {question.question}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Textarea
                        placeholder="Enter your answer..."
                        value={intakeAnswers[question.question] || ''}
                        onChange={(e) => handleGlobalQuestionChange(question.question, e.target.value)}
                        rows={3}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Clause Variants */}
            {template.clauses.map((clause) => (
              <Card key={clause._id}>
                <CardHeader className="bg-[#a16207] text-white">
                  <CardTitle className="text-xl">{clause.clause_name}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {clauseVariantsOrder[clause.clause_name]?.map((variant, index) => {
                      const selectedClause = selectedClauses.find(
                        sc => sc.clause_name === clause.clause_name && 
                        sc.variant.variant_label === variant.variant_label
                      )
                      
                      return (
                        <DropTarget
                          key={`${clause.clause_name}-${variant.variant_label}`}
                          clauseName={clause.clause_name}
                          index={index}
                        >
                          <DraggableVariant
                            clauseName={clause.clause_name}
                            variant={variant}
                            variantIndex={index}
                            isSelected={!!selectedClause}
                            status={selectedClause?.status}
                          />
                        </DropTarget>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Send Invite Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Invite
                </CardTitle>
                <CardDescription>
                  Enter the email address of the party you want to invite to this agreement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                
                {/* Progress Indicator */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Selection Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedClauses.length} of {template.clauses?.reduce((sum, clause) => sum + clause.variants.length, 0) || 0} clause variants selected
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(selectedClauses.length / (template.clauses?.reduce((sum, clause) => sum + clause.variants.length, 0) || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSendInvite}
                  className="w-full"
                  disabled={!inviteEmail.trim() || selectedClauses.length !== (template.clauses?.reduce((sum, clause) => sum + clause.variants.length, 0) || 0) || submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Send Invite
                </Button>
              </CardContent>
            </Card>
          </div>
        </DndProvider>
      </div>
    </div>
  )
}