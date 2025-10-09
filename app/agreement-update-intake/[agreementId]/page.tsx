"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  GripVertical,
  Check,
  X,
  Save
} from "lucide-react"
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useToast } from "@/hooks/use-toast"

interface ClauseVariant {
  variant_label: string
  text: string
  best_used_when?: string
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

interface Agreement {
  _id: string
  templateId: Template
  initiatorId: {
    _id: string
    name: string
    email: string
  }
  invitedUserId: {
    _id: string
    name: string
    email: string
  }
  status: string
  initiatorData?: {
    intakeAnswers: Record<string, string>
    selectedClauses: any[]
    clauseVariantsOrder?: Record<string, any[]>
  }
  invitedUserData?: {
    intakeAnswers: Record<string, string>
    selectedClauses: any[]
    clauseVariantsOrder?: Record<string, any[]>
  }
}

interface SelectedClause {
  clause_name: string
  variant: ClauseVariant
  status: 'accepted' | 'rejected'
  order: number
}

export default function AgreementUpdateIntakePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({})
  const [selectedClauses, setSelectedClauses] = useState<SelectedClause[]>([])
  const [clauseVariantsOrder, setClauseVariantsOrder] = useState<Record<string, Array<ClauseVariant & { order: number }>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isPrefilling, setIsPrefilling] = useState(false)

  const agreementId = params.agreementId as string

  useEffect(() => {
    // Get current user ID from token first
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.id)
      } catch (error) {
        console.error('Error parsing token:', error)
      }
    }
    fetchAgreement()
  }, [agreementId])

  // Pre-fill data when both agreement and currentUserId are available
  useEffect(() => {
    if (agreement && currentUserId) {
      setIsPrefilling(true)
      prefillUserData(agreement)
      setIsPrefilling(false)
    }
  }, [agreement, currentUserId])

  const fetchAgreement = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('🔍 Fetching agreement for update:', agreementId)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreement/${agreementId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Failed to fetch agreement:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        console.log('✅ Agreement fetched successfully:', data.agreement)
        setAgreement(data.agreement)
        setTemplate(data.agreement.templateId)
      } else {
        throw new Error(data.message || 'Failed to fetch agreement')
      }
    } catch (error: any) {
      console.error('Error fetching agreement:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const prefillUserData = (agreement: Agreement) => {
    if (!currentUserId) {
      console.log('❌ No currentUserId available for pre-filling')
      return
    }

    console.log('🔄 Pre-filling user data for user:', currentUserId)
    
    // Determine which user's data to load
    const isInitiator = currentUserId === agreement.initiatorId._id
    const userData = isInitiator ? agreement.initiatorData : agreement.invitedUserData

    console.log('👤 User role:', isInitiator ? 'Initiator' : 'Invited User')
    console.log('📊 User data:', userData)

    if (userData) {
      // Pre-fill intake answers
      console.log('📝 Pre-filling intake answers:', userData.intakeAnswers)
      setIntakeAnswers(userData.intakeAnswers || {})
      
      // Pre-fill selected clauses (only rejected ones with new logic)
      console.log('📋 Pre-filling selected clauses:', userData.selectedClauses)
      console.log('📊 Pre-filled selected clauses with orders:', userData.selectedClauses?.map(sc => ({
        clause_name: sc.clause_name,
        variant: sc.variant.variant_label,
        status: sc.status,
        order: sc.order
      })))
      
      // With new toggleable reject logic, only rejected variants should be in selectedClauses
      const rejectedClauses = (userData.selectedClauses || []).filter(sc => sc.status === 'rejected')
      console.log('❌ Pre-filling only rejected clauses:', rejectedClauses)
      setSelectedClauses(rejectedClauses)
      
      // Pre-fill clause variants order or initialize default order
      if (userData.clauseVariantsOrder) {
        console.log('🔢 Pre-filling clause variants order:', userData.clauseVariantsOrder)
        console.log('🔢 Pre-filled order details:', Object.keys(userData.clauseVariantsOrder).map(clauseName => ({
          clause: clauseName,
          variants: userData.clauseVariantsOrder?.[clauseName]?.map(v => `${v.variant_label} (order: ${v.order})`)
        })))
        setClauseVariantsOrder(userData.clauseVariantsOrder)
      } else {
        console.log('🔢 Initializing default clause variants order')
        initializeClauseVariantsOrder(agreement.templateId.clauses)
      }
    } else {
      console.log('⚠️ No existing user data found, initializing with defaults')
      // Initialize with default order if no existing data
      initializeClauseVariantsOrder(agreement.templateId.clauses)
    }
    
    console.log('✅ Pre-filling completed successfully')
    
    // Show success message
    toast({
      title: "Form Loaded",
      description: "Your existing preferences have been loaded. All variants are auto-accepted by default. Click ❌ to reject specific variants.",
    })
  }

  const initializeClauseVariantsOrder = (clauses: Clause[]) => {
    const order: Record<string, Array<ClauseVariant & { order: number }>> = {}
    clauses.forEach(clause => {
      order[clause.clause_name] = clause.variants.map((variant, index) => ({
        ...variant,
        order: index + 1  // Start from 1, not 0
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
    console.log(`🎯 User ${status} clause: ${clauseName} - ${variant.variant_label}`)
    console.log(`🔢 Current order for this variant:`, clauseVariantsOrder[clauseName]?.find(v => v.variant_label === variant.variant_label)?.order || 1)
    
    setSelectedClauses(prev => {
      const existingClause = prev.find(sc => 
        sc.clause_name === clauseName && sc.variant.variant_label === variant.variant_label
      )
      
      if (existingClause) {
        // If already rejected, clicking X again should accept it (remove from rejected list)
        console.log(`✅ Toggling back to accepted: ${clauseName} - ${variant.variant_label}`)
        return prev.filter(sc => !(sc.clause_name === clauseName && sc.variant.variant_label === variant.variant_label))
      } else {
        // If not rejected yet, clicking X should reject it
        const newClause: SelectedClause = {
          clause_name: clauseName,
          variant,
          status: 'rejected' as const,
          order: clauseVariantsOrder[clauseName]?.find(v => v.variant_label === variant.variant_label)?.order || 1
        }
        
        console.log(`✅ Added clause with order:`, newClause.order)
        console.log(`📋 Updated selected clauses:`, [...prev, newClause].map(sc => ({
          clause_name: sc.clause_name,
          variant: sc.variant.variant_label,
          status: sc.status,
          order: sc.order
        })))
        
        return [...prev, newClause]
      }
    })
  }

  const handleDrop = (clauseName: string, targetIndex: number, draggedItem: any) => {
    const { clauseName: draggedClauseName, variantIndex: draggedIndex } = draggedItem

    console.log(`🔄 Drag & Drop: ${clauseName}`)
    console.log(`   Dragged from index: ${draggedIndex} to index: ${targetIndex}`)

    if (clauseName !== draggedClauseName || draggedIndex === targetIndex) {
      console.log(`   ❌ No change needed (same position)`)
      return
    }

    setClauseVariantsOrder(prev => {
      const newOrder = { ...prev }
      const variants = [...newOrder[clauseName]]

      console.log(`   📋 Before reorder:`, variants.map((v, i) => `${v.variant_label} (order: ${v.order})`))

      // Remove the dragged item from its current position
      const draggedVariant = variants.splice(draggedIndex, 1)[0]
      console.log(`   🎯 Dragged variant: ${draggedVariant.variant_label}`)
      
      // Insert it at the target position
      variants.splice(targetIndex, 0, draggedVariant)
      
      // Update order numbers (start from 1)
      const updatedVariants = variants.map((variant, index) => ({
        ...variant,
        order: index + 1
      }))

      console.log(`   📋 After reorder:`, updatedVariants.map((v, i) => `${v.variant_label} (order: ${v.order})`))

      newOrder[clauseName] = updatedVariants
      return newOrder
    })
  }

  const validateForm = () => {
    if (!template) {
      console.log('❌ Validation failed: No template')
      return false
    }

    console.log('🔍 Validating form...')
    console.log('📊 Template clauses:', template.clauses?.length || 0)
    console.log('📊 Selected clauses (rejected only):', selectedClauses.length)
    console.log('📊 Selected clauses details:', selectedClauses.map(sc => ({
      clause_name: sc.clause_name,
      variant: sc.variant.variant_label,
      status: sc.status
    })))

    // Check if all global questions are answered
    const requiredQuestions = template.global_questions.filter(q => q.required)
    for (const question of requiredQuestions) {
      if (!intakeAnswers[question.question]?.trim()) {
        console.log('❌ Validation failed: Missing required question:', question.question)
        toast({
          title: "Validation Error",
          description: `Please answer the required question: ${question.question}`,
          variant: "destructive"
        })
        return false
      }
    }

    // Check if all clause variants are processed
    // In agreement update intake, all variants are auto-accepted unless explicitly rejected
    // So we just need to ensure all variants have been processed (either auto-accepted or explicitly rejected)
    const totalVariants = template.clauses.reduce((sum, clause) => sum + clause.variants.length, 0)
    const processedVariants = selectedClauses.length // Only rejected variants are in selectedClauses
    const autoAcceptedVariants = totalVariants - processedVariants
    
    console.log('📊 Validation summary:', {
      totalVariants,
      processedVariants,
      autoAcceptedVariants
    })
    
    // All variants are either auto-accepted or explicitly rejected
    // No need to check if all are "selected" since auto-acceptance is the default

    console.log('✅ Validation passed')
    return true
  }

  const handleUpdateIntake = async () => {
    if (!validateForm()) return

    if (!agreement || !currentUserId) {
      toast({
        title: "Agreement Error",
        description: "Agreement not loaded. Please try again.",
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

      console.log('📝 Updating intake form for agreement:', agreementId)
      console.log('📊 Selected clauses with orders:', selectedClauses.map(sc => ({
        clause_name: sc.clause_name,
        variant: sc.variant.variant_label,
        status: sc.status,
        order: sc.order
      })))
      console.log('🔢 Clause variants order:', clauseVariantsOrder)
      console.log('🔢 Detailed clause variants order:', Object.keys(clauseVariantsOrder).map(clauseName => ({
        clause: clauseName,
        variants: clauseVariantsOrder[clauseName]?.map(v => `${v.variant_label} (order: ${v.order})`)
      })))

      const isInitiator = currentUserId === agreement.initiatorId._id
      
      // Prepare data: auto-accept all variants, then override with explicit rejections
      if (!template) {
        throw new Error('Template not loaded')
      }
      
      const allVariants = template.clauses.flatMap(clause => 
        clause.variants.map(variant => ({
          clause_name: clause.clause_name,
          variant,
          status: 'accepted' as const, // Default to accepted
          order: clauseVariantsOrder[clause.clause_name]?.find(v => v.variant_label === variant.variant_label)?.order || 1
        }))
      )
      
      // Override with explicit rejections
      const finalSelectedClauses = allVariants.map(variant => {
        const explicitRejection = selectedClauses.find(sc => 
          sc.clause_name === variant.clause_name && 
          sc.variant.variant_label === variant.variant.variant_label
        )
        return explicitRejection || variant
      })
      
      const updateData = {
        intakeAnswers,
        selectedClauses: finalSelectedClauses,
        clauseVariantsOrder
      }

      const requestBody = isInitiator 
        ? { initiatorData: updateData }
        : { invitedUserData: updateData }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreement/${agreementId}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Agreement update failed:', errorData)
        throw new Error(errorData.message || 'Failed to update intake form')
      }

      const result = await response.json()
      console.log('✅ Intake form updated successfully:', result)
      
      toast({
        title: "Intake Form Updated!",
        description: "Your preferences have been updated successfully.",
      })

      // Add a flag to indicate that data was updated
      localStorage.setItem(`agreement_${agreementId}_updated`, Date.now().toString())

      // Redirect back to agreement view
      router.push(`/agreement-view/${agreementId}`)
    } catch (error: any) {
      console.error('Error updating intake form:', error)
      toast({
        title: "Error",
        description: `Failed to update intake form: ${error.message}`,
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
    priorityNumber,
    isSelected, 
    status 
  }: {
    clauseName: string
    variant: ClauseVariant
    variantIndex: number
    priorityNumber: number | null
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
          {/* Priority Number - Only show for accepted variants */}
          {priorityNumber !== null && (
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
              {priorityNumber}
            </div>
          )}
          {priorityNumber === null && (
            <div className="w-8 h-8"></div>
          )}
          <div ref={drag as any} className="cursor-move">
            <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{variant.variant_label}</h4>
            
            {(variant.best_used_when && variant.best_used_when.trim()) && (
              <div className="mt-2 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700">Best Used When:</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-sm text-blue-800">{variant.best_used_when}</p>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-1">{variant.text}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={status === 'rejected' ? 'destructive' : 'outline'}
              onClick={() => handleClauseVariantSelect(clauseName, variant, 'rejected')}
              className="h-8 px-3"
            >
              {status === 'rejected' ? (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Rejected
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </>
              )}
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

  if (loading || isPrefilling) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{isPrefilling ? 'Loading your existing preferences...' : 'Loading agreement...'}</p>
        </div>
      </div>
    )
  }

  if (error || !agreement || !template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Agreement Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'The agreement you are looking for does not exist or you are not authorized to view it.'}
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
            <h1 className="text-3xl font-bold">Update Intake Form</h1>
            <p className="text-muted-foreground mt-2">{template.templatename}</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="outline">
                Agreement: {agreement.initiatorId.name} & {agreement.invitedUserId.name}
              </Badge>
              <Badge variant="secondary">
                Status: {agreement.status}
              </Badge>
              {selectedClauses.length > 0 && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Pre-filled with {selectedClauses.length} existing preferences
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={() => router.push(`/agreement-view/${agreementId}`)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agreement
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
                    {(() => {
                      const variants = clauseVariantsOrder[clause.clause_name] || []
                      
                      // Sort variants: accepted first, rejected at bottom
                      const sortedVariants = variants.sort((a, b) => {
                        const aRejected = selectedClauses.some(sc => 
                          sc.clause_name === clause.clause_name && 
                          sc.variant.variant_label === a.variant_label && 
                          sc.status === 'rejected'
                        )
                        const bRejected = selectedClauses.some(sc => 
                          sc.clause_name === clause.clause_name && 
                          sc.variant.variant_label === b.variant_label && 
                          sc.status === 'rejected'
                        )
                        
                        // Accepted variants first, rejected at bottom
                        if (aRejected && !bRejected) return 1
                        if (!aRejected && bRejected) return -1
                        return 0
                      })
                      
                      // Calculate priority numbers only for accepted variants
                      let acceptedIndex = 0
                      
                      return sortedVariants.map((variant, index) => {
                        const selectedClause = selectedClauses.find(
                          sc => sc.clause_name === clause.clause_name && 
                          sc.variant.variant_label === variant.variant_label
                        )
                        
                        const isRejected = selectedClause?.status === 'rejected'
                        const priorityNumber = isRejected ? null : ++acceptedIndex
                        
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
                              priorityNumber={priorityNumber}
                              isSelected={!!selectedClause}
                              status={selectedClause?.status}
                            />
                          </DropTarget>
                        )
                      })
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Update Intake Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Update Your Intake
                </CardTitle>
                <CardDescription>
                  Review your selections and update your intake form.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Indicator */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Selection Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {template.clauses?.reduce((sum, clause) => sum + clause.variants.length, 0) || 0} variants (auto-accepted), {selectedClauses.length} explicitly rejected
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `100%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    All variants are auto-accepted by default. Click ❌ to reject specific variants.
                  </p>
                  {selectedClauses.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      ✅ Form pre-filled with your existing preferences. You can drag to reorder and modify selections.
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleUpdateIntake}
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Update Intake Form
                </Button>
              </CardContent>
            </Card>
          </div>
        </DndProvider>
      </div>
    </div>
  )
}
