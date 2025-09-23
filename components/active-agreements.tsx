"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  Download,
  Trash2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { downloadAgreementPDF } from "@/lib/agreements"

interface Agreement {
  _id: string
  templateId: {
    _id: string
    templatename: string
    description: string
  }
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
    selectedClauses: any[]
  }
  invitedUserData?: {
    selectedClauses: any[]
  }
  matchingResults?: Array<{
    matchStatus: 'green' | 'yellow' | 'red'
  }>
  signatures?: {
    initiatorSignature: {
      signed: boolean
      signedAt?: string
      signatureUrl?: string
    }
    invitedUserSignature: {
      signed: boolean
      signedAt?: string
      signatureUrl?: string
    }
  }
  createdAt: string
  updatedAt: string
}

export function ActiveAgreements() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchAgreements()
    // Get current user ID from token
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.id)
      } catch (error) {
        console.error('Error parsing token:', error)
      }
    }
  }, [])

  const fetchAgreements = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('🔍 Fetching user agreements')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreement/user/agreements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch agreements')
      }

      const data = await response.json()
      if (data.success) {
        console.log('✅ Agreements fetched:', data.agreements)
        setAgreements(data.agreements)
      } else {
        throw new Error(data.message || 'Failed to fetch agreements')
      }
    } catch (error: any) {
      console.error('Error fetching agreements:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAgreement = (agreementId: string, agreement: Agreement) => {
    // Check if both parties have completed their intake
    const initiatorCompleted = (agreement.initiatorData?.selectedClauses?.length || 0) > 0
    const invitedUserCompleted = (agreement.invitedUserData?.selectedClauses?.length || 0) > 0
    
    if (!initiatorCompleted || !invitedUserCompleted) {
      toast({
        title: "Agreement Not Ready",
        description: "Both parties must complete their intake forms before viewing the agreement.",
        variant: "destructive"
      })
      return
    }

    console.log('👁️ Viewing agreement:', agreementId)
    router.push(`/agreement-view/${agreementId}`)
  }

  const handleDownloadPDF = async (agreementId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to download the PDF.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Downloading PDF",
        description: "Preparing your agreement PDF...",
      })

      await downloadAgreementPDF(token, agreementId)
      
      toast({
        title: "PDF Downloaded",
        description: "Your agreement PDF has been downloaded successfully.",
      })
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download the PDF. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteAgreement = async (agreementId: string, agreementName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the agreement "${agreementName}"?\n\nThis action cannot be undone and will permanently remove the agreement for both parties.`
    )
    
    if (!confirmed) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to delete the agreement.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Deleting Agreement",
        description: "Removing the agreement...",
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreement/${agreementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete agreement')
      }

      // Remove the agreement from the local state
      setAgreements(prev => prev.filter(agreement => agreement._id !== agreementId))
      
      toast({
        title: "Agreement Deleted",
        description: "The agreement has been successfully deleted.",
      })
    } catch (error: any) {
      console.error('Error deleting agreement:', error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete the agreement. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTrafficLightSummary = (agreement: Agreement) => {
    if (!agreement.matchingResults || agreement.matchingResults.length === 0) {
      return null
    }

    const greenCount = agreement.matchingResults.filter(r => r.matchStatus === 'green').length
    const yellowCount = agreement.matchingResults.filter(r => r.matchStatus === 'yellow').length
    const redCount = agreement.matchingResults.filter(r => r.matchStatus === 'red').length

    return { greenCount, yellowCount, redCount }
  }

  const isAgreementReady = (agreement: Agreement) => {
    const initiatorCompleted = (agreement.initiatorData?.selectedClauses?.length || 0) > 0
    const invitedUserCompleted = (agreement.invitedUserData?.selectedClauses?.length || 0) > 0
    return initiatorCompleted && invitedUserCompleted
  }

  const isAgreementFullySigned = (agreement: Agreement) => {
    return agreement.status === 'signed' && 
           agreement.signatures?.initiatorSignature?.signed && 
           agreement.signatures?.invitedUserSignature?.signed
  }

  const isUserInitiator = (agreement: Agreement) => {
    return currentUserId && agreement.initiatorId._id === currentUserId
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            My Agreements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading agreements...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            My Agreements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-2">Error loading agreements</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (agreements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            My Agreements
          </CardTitle>
          <CardDescription>
            You have no agreements yet
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No agreements found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          My Agreements ({agreements.length})
        </CardTitle>
        <CardDescription>
          View and manage your agreements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {agreements.map((agreement) => {
          const trafficLight = getTrafficLightSummary(agreement)
          
          return (
            <div key={agreement._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">{agreement.templateId.templatename}</h4>
                    <Badge variant="outline" className={getStatusColor(agreement.status)}>
                      {getStatusIcon(agreement.status)}
                      <span className="ml-1 capitalize">{agreement.status}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {agreement.templateId.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{agreement.initiatorId.name} & {agreement.invitedUserId.name}</span>
                    </div>
                    <div>
                      <span>Created: {formatDate(agreement.createdAt)}</span>
                    </div>
                    {agreement.updatedAt !== agreement.createdAt && (
                      <div>
                        <span>Updated: {formatDate(agreement.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Traffic Light Summary */}
                  {trafficLight && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{trafficLight.greenCount} Perfect</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>{trafficLight.yellowCount} Partial</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>{trafficLight.redCount} Conflicts</span>
                      </div>
                    </div>
                  )}

                  {/* Agreement Status */}
                  {!isAgreementReady(agreement) && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>Waiting for both parties to complete intake</span>
                    </div>
                  )}
                  
                  {/* Signed Status */}
                  {isAgreementFullySigned(agreement) && (
                    <div className="flex items-center gap-2 text-xs text-green-600 mt-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>Agreement fully signed by both parties - Cannot be deleted</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    onClick={() => handleViewAgreement(agreement._id, agreement)}
                    size="sm"
                    disabled={!isAgreementReady(agreement)}
                    variant={isAgreementReady(agreement) ? "default" : "outline"}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isAgreementReady(agreement) ? "View Agreement" : "Not Ready"}
                  </Button>
                  
                  {/* PDF Download Button - Only show for fully signed agreements */}
                  {isAgreementFullySigned(agreement) && (
                    <Button 
                      onClick={() => handleDownloadPDF(agreement._id)}
                      size="sm"
                      variant="outline"
                      className="bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  )}
                  
                  {/* Delete Button - Only show for initiator and only if not signed */}
                  {isUserInitiator(agreement) && !isAgreementFullySigned(agreement) && (
                    <Button 
                      onClick={() => handleDeleteAgreement(agreement._id, agreement.templateId.templatename)}
                      size="sm"
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
