"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Users,
  Mail,
  Edit,
  RefreshCw,
  PenTool,
  Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AgreementChat } from "@/components/agreement-chat"
import { SignatureOverlay } from "@/components/signature-overlay"
import { getUserProfile } from "@/lib/user"
import { downloadAgreementPDF } from "@/lib/agreements"
import { io } from "socket.io-client"

interface ClauseVariant {
  variant_label: string
  text: string
}

interface Clause {
  _id: string
  clause_name: string
  variants: ClauseVariant[]
}

interface Template {
  _id: string
  templatename: string
  description: string
  clauses: Clause[]
  global_questions?: Array<{
    question: string
    required: boolean
  }>
}

interface MatchingResult {
  clause_name: string
  variant: ClauseVariant
  initiatorStatus: 'accepted' | 'rejected'
  invitedUserStatus: 'accepted' | 'rejected'
  initiatorOrder: number
  invitedUserOrder: number
  matchStatus: 'green' | 'red' | 'yellow'
  reason: string
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
  initiatorData: {
    intakeAnswers: Record<string, string>
    selectedClauses: any[]
    clauseVariantsOrder?: Record<string, any[]>
  }
  invitedUserData: {
    intakeAnswers: Record<string, string>
    selectedClauses: any[]
    clauseVariantsOrder?: Record<string, any[]>
  }
  matchingResults: MatchingResult[]
  updatedAt?: string
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
}

export default function AgreementViewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showSignatureOverlay, setShowSignatureOverlay] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userSignature, setUserSignature] = useState<string | null>(null)
  const [socket, setSocket] = useState<any>(null)

  const agreementId = params.agreementId as string

  useEffect(() => {
    fetchAgreement()
    loadUserProfile()
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
  }, [agreementId])

  // Socket connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      }
    })

    setSocket(socketInstance)

    // Join agreement room
    socketInstance.emit('join-agreement-chat', { agreementId })

    // Listen for signature updates
    socketInstance.on('signature-updated', (data) => {
      console.log('📝 Signature update received:', data)
      toast({
        title: "Agreement Updated",
        description: `${data.userName} has signed the agreement`,
      })
      // Refresh agreement data
      fetchAgreement()
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [agreementId])

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await getUserProfile(token)
      setUserProfile(response.user)
      setUserSignature(response.user.signature?.url || null)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  // Refresh agreement data when page becomes visible (e.g., returning from update intake)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing agreement data...')
        fetchAgreement()
      }
    }

    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing agreement data...')
      fetchAgreement()
    }

    // Check if agreement was updated from another page
    const checkForUpdates = () => {
      const updateFlag = localStorage.getItem(`agreement_${agreementId}_updated`)
      if (updateFlag) {
        console.log('🔄 Agreement was updated, refreshing data...')
        fetchAgreement()
        localStorage.removeItem(`agreement_${agreementId}_updated`)
      }
    }

    // Check immediately when component mounts
    checkForUpdates()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [agreementId])

  const fetchAgreement = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('🔍 Fetching agreement:', agreementId)

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
        
        // Show success message if this was a refresh (not initial load)
        if (agreement) {
          toast({
            title: "Agreement Updated",
            description: "Matching results have been refreshed with the latest data.",
          })
        }
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

  const getAgreementStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'yellow':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'red':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getAgreementStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'red':
        return 'bg-red-100 border-red-300 text-red-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'green':
        return 'Agreement Match'
      case 'yellow':
        return 'Partial Match'
      case 'red':
        return 'Conflict'
      default:
        return 'Unknown'
    }
  }

  const handleSignAgreement = () => {
    if (!userSignature) {
      toast({
        title: "No Signature Found",
        description: "Please upload a signature in your profile first.",
        variant: "destructive",
      })
      router.push('/profile')
      return
    }
    setShowSignatureOverlay(true)
  }

  const handleSignSuccess = () => {
    // Refresh agreement data to show updated status
    fetchAgreement()
    toast({
      title: "Agreement Signed!",
      description: "Your signature has been recorded successfully.",
    })
  }

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      toast({
        title: "Downloading PDF...",
        description: "Generating agreement PDF with agreed clauses only.",
      })

      await downloadAgreementPDF(token, agreementId)
      
      toast({
        title: "PDF Downloaded!",
        description: "Agreement PDF has been downloaded successfully.",
      })
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download agreement PDF",
        variant: "destructive",
      })
    }
  }

  const isUserInitiator = currentUserId === agreement?.initiatorId._id
  const isUserInvited = currentUserId === agreement?.invitedUserId._id
  const isUserPartOfAgreement = isUserInitiator || isUserInvited
  
  // Check if user has already signed
  const hasUserSigned = isUserInitiator 
    ? agreement?.signatures?.initiatorSignature?.signed 
    : agreement?.signatures?.invitedUserSignature?.signed
  
  const isAgreementFullySigned = agreement?.status === 'signed'


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading agreement...</p>
        </div>
      </div>
    )
  }

  if (error || !agreement) {
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

  const template = agreement.templateId
  const matchingResults = agreement.matchingResults || []
  const greenCount = matchingResults.filter(r => r.matchStatus === 'green').length
  const yellowCount = matchingResults.filter(r => r.matchStatus === 'yellow').length
  const redCount = matchingResults.filter(r => r.matchStatus === 'red').length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{template.templatename}</h1>
            <p className="text-muted-foreground mt-2">{template.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="outline">
                <Users className="w-4 h-4 mr-1" />
                {agreement.initiatorId.name} & {agreement.invitedUserId.name}
              </Badge>
              <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'}>
                Status: {agreement.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Sign Agreement Button - only show if user is part of agreement and hasn't signed */}
            {isUserPartOfAgreement && !hasUserSigned && !isAgreementFullySigned && (
              <Button onClick={handleSignAgreement} variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
                <PenTool className="w-4 h-4" />
                Sign Agreement
              </Button>
            )}
            
            {/* Show signed status if user has signed */}
            {isUserPartOfAgreement && hasUserSigned && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-md border border-green-200">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">You have signed this agreement</span>
              </div>
            )}
            
            {/* Show fully signed status and PDF download button */}
            {isAgreementFullySigned && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Agreement fully signed by both parties</span>
                </div>
                <Button 
                  onClick={handleDownloadPDF} 
                  variant="default" 
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            )}
            
            {/* Update Intake Form Button - hide if agreement is signed */}
            {!isAgreementFullySigned && (
              <Button onClick={() => router.push(`/agreement-update-intake/${agreementId}`)} variant="default" className="gap-2">
                <Edit className="w-4 h-4" />
                Update Intake Form
              </Button>
            )}
            
            <Button onClick={fetchAgreement} variant="outline" className="gap-2" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Agreement Compatibility Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Agreement Compatibility Analysis
              </CardTitle>
              <CardDescription>
                Analysis of how well both parties' preferences align
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700">{greenCount}</div>
                  <div className="text-sm text-green-600">Agreement Matches</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-700">{yellowCount}</div>
                  <div className="text-sm text-yellow-600">Partial Matches</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-700">{redCount}</div>
                  <div className="text-sm text-red-600">Conflicts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agreement Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Agreement Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Initiator</span>
                  <Badge variant="outline">{agreement.initiatorId.name}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Invited User</span>
                  <Badge variant="outline">{agreement.invitedUserId.name}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'}>
                    {agreement.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matching Results */}
        {matchingResults.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detailed Matching Results
              </CardTitle>
              <CardDescription>
                See how your preferences align with the other party's choices
                {agreement.updatedAt && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(agreement.updatedAt).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Updating matching results...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchingResults.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getAgreementStatusColor(result.matchStatus)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getAgreementStatusIcon(result.matchStatus)}
                          <h4 className="font-medium">{result.clause_name}</h4>
                          <Badge variant="outline" className={getAgreementStatusColor(result.matchStatus)}>
                            {getStatusText(result.matchStatus)}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{result.variant.variant_label}</p>
                        <p className="text-xs text-muted-foreground mb-3">{result.variant.text}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Initiator ({agreement.initiatorId.name}):</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={result.initiatorStatus === 'accepted' ? 'default' : 'destructive'}>
                                {result.initiatorStatus}
                              </Badge>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Priority: {result.initiatorOrder}</span>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Invited User ({agreement.invitedUserId.name}):</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={result.invitedUserStatus === 'accepted' ? 'default' : 'destructive'}>
                                {result.invitedUserStatus}
                              </Badge>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Priority: {result.invitedUserOrder}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs mt-2 italic">{result.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PDF Download Section - Only show when fully signed */}
        {isAgreementFullySigned && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Agreement
              </CardTitle>
              <CardDescription>
                Download the final agreement PDF containing only the clauses that both parties have agreed upon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">Agreement Ready for Download</h4>
                    <p className="text-sm text-green-700">
                      This PDF contains only the clauses where both parties agreed (green status).
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleDownloadPDF} 
                  variant="default" 
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Component - Floating */}
        {currentUserId && agreement && (
          <AgreementChat 
            agreementId={agreementId}
            currentUserId={currentUserId}
            otherPartyName={
              currentUserId === agreement.initiatorId._id 
                ? agreement.invitedUserId.name 
                : agreement.initiatorId.name
            }
          />
        )}

        {/* Signature Overlay */}
        <SignatureOverlay
          isOpen={showSignatureOverlay}
          onClose={() => setShowSignatureOverlay(false)}
          agreementId={agreementId}
          userSignature={userSignature || undefined}
          userName={userProfile?.name || 'User'}
          onSignSuccess={handleSignSuccess}
        />

      </div>
    </div>
  )
}
