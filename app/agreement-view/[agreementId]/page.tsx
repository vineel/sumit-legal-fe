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
  Download,
  User,
  UserCheck,
  Calculator,
  Target,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AgreementChat } from "@/components/agreement-chat"
import { SignatureOverlay } from "@/components/signature-overlay"
import { getUserProfile } from "@/lib/user"
import { downloadAgreementPDF } from '@/lib/agreements'
import { io } from "socket.io-client"

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

interface Agreement {
  _id: string
  templateId: Template
  initiatorId: string
  invitedUserId: string
  initiatorData: {
    intakeAnswers: Record<string, string>
    selectedClauses: Array<{
      clause_name: string
      variant: ClauseVariant
      status: 'accepted' | 'rejected'
      order: number
    }>
    clauseVariantsOrder: Record<string, Array<ClauseVariant & { order: number }>>
  }
  invitedUserData: {
    intakeAnswers: Record<string, string>
    selectedClauses: Array<{
      clause_name: string
      variant: ClauseVariant
      status: 'accepted' | 'rejected'
      order: number
    }>
    clauseVariantsOrder: Record<string, Array<ClauseVariant & { order: number }>>
  }
  matchingResults: Array<{
    clause_name: string
    selectedVariant: ClauseVariant | null
    matchStatus: 'green' | 'red'
    reason: string
    score: number | null
    initiatorRank: number | null
    invitedUserRank: number | null
    mutuallyAcceptableVariants: Array<{
      variant: ClauseVariant
      initiatorRank: number
      invitedUserRank: number
    }>
    allVariants: {
      initiator: Array<{
        variant: ClauseVariant
        status: 'accepted' | 'rejected'
        order: number
      }>
      invitedUser: Array<{
        variant: ClauseVariant
        status: 'accepted' | 'rejected'
        order: number
      }>
    }
  }>
  status: 'pending' | 'active' | 'signed' | 'completed'
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

export default function AgreementViewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isInitiator, setIsInitiator] = useState(false)
  const [isInvitedUser, setIsInvitedUser] = useState(false)
  const [otherPartyName, setOtherPartyName] = useState<string>("")
  const [myName, setMyName] = useState<string>("")
  const [mySignature, setMySignature] = useState<string>("")
  const [showSignature, setShowSignature] = useState(false)
  const [socket, setSocket] = useState<any>(null)

  const agreementId = params.agreementId as string

  useEffect(() => {
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
    
    fetchAgreement()
  }, [agreementId])

  useEffect(() => {
    if (agreement && currentUserId) {
      console.log('🔍 PARTY IDENTIFICATION DEBUG:')
      console.log('Current User ID:', currentUserId)
      console.log('Initiator ID:', agreement.initiatorId)
      console.log('Invited User ID:', agreement.invitedUserId)
      console.log('Initiator ID type:', typeof agreement.initiatorId)
      console.log('Invited User ID type:', typeof agreement.invitedUserId)
      
      // Handle both string and object IDs
      const initiatorId = typeof agreement.initiatorId === 'object' && agreement.initiatorId ? 
        (agreement.initiatorId as any)._id : agreement.initiatorId
      const invitedUserId = typeof agreement.invitedUserId === 'object' && agreement.invitedUserId ? 
        (agreement.invitedUserId as any)._id : agreement.invitedUserId
      
      console.log('Processed Initiator ID:', initiatorId)
      console.log('Processed Invited User ID:', invitedUserId)
      
      const isInitiatorCheck = initiatorId === currentUserId
      const isInvitedCheck = invitedUserId === currentUserId
      
      console.log('Is Initiator Check:', isInitiatorCheck)
      console.log('Is Invited Check:', isInvitedCheck)
      
      setIsInitiator(isInitiatorCheck)
      setIsInvitedUser(isInvitedCheck)
      
      // Get user names from populated data or fetch them
      // Pass the role information directly to avoid state timing issues
      fetchUserNames(isInitiatorCheck, isInvitedCheck)
    }
  }, [agreement, currentUserId])

  const fetchUserNames = async (isInitiatorRole: boolean, isInvitedRole: boolean) => {
    if (!agreement) return
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      // Debug logging
      console.log('🔍 USER NAME FETCH DEBUG:')
      console.log('Agreement data:', agreement)
      console.log('Initiator ID:', agreement.initiatorId)
      console.log('Invited User ID:', agreement.invitedUserId)
      console.log('Current User ID:', currentUserId)
      console.log('Is Initiator (passed):', isInitiatorRole)
      console.log('Is Invited User (passed):', isInvitedRole)
      console.log('Is Initiator (state):', isInitiator)
      console.log('Is Invited User (state):', isInvitedUser)

      let myName = '';
      let otherPartyName = '';

      // Check if we have populated user data first
      if (agreement.initiatorId && typeof agreement.initiatorId === 'object' && (agreement.initiatorId as any).name) {
        // User data is already populated
        const initiatorName = (agreement.initiatorId as any).name
        const invitedUserName = agreement.invitedUserId && typeof agreement.invitedUserId === 'object' ? 
          (agreement.invitedUserId as any).name : 'Unknown User'
        
        console.log('Using populated data - Initiator:', initiatorName, 'Invited:', invitedUserName)
        
        console.log('🎯 POPULATED DATA BRANCH:')
        console.log('Is Initiator (passed):', isInitiatorRole)
        console.log('Initiator Name:', initiatorName)
        console.log('Invited Name:', invitedUserName)
        
        if (isInitiatorRole) {
          myName = initiatorName;
          otherPartyName = invitedUserName;
          console.log('✅ INITIATOR: My Name =', myName, 'Other =', otherPartyName)
        } else {
          myName = invitedUserName;
          otherPartyName = initiatorName;
          console.log('✅ INVITED USER: My Name =', myName, 'Other =', otherPartyName)
        }
        
        // Still need to fetch current user's signature
        try {
          const currentUserProfile = await getUserProfile(token)
          setMySignature(currentUserProfile.user.signature?.url || '')
        } catch (signatureError) {
          console.error('Error fetching signature in populated branch:', signatureError)
          setMySignature('')
        }
      } else {
        // Fallback: fetch user profiles if not populated
        console.log('Fetching user profiles...')
        
        try {
          // Since getUserProfile only gets current user, we'll use the populated data or fallback
          // Get current user's name and signature
          const currentUserProfile = await getUserProfile(token)
          const currentUserName = currentUserProfile.user.name
          const currentUserSignature = currentUserProfile.user.signature?.url || ''
          
          // Set the current user's signature
          setMySignature(currentUserSignature)
          
          // For now, we'll use generic names since we can't fetch other users' profiles
          const initiatorName = 'Initiator'
          const invitedUserName = 'Invited User'
          
          console.log('🎯 FETCHED PROFILES BRANCH:')
          console.log('Fetched profiles - Initiator:', initiatorName, 'Invited:', invitedUserName)
          console.log('Is Initiator (passed):', isInitiatorRole)
          
          if (isInitiatorRole) {
            myName = initiatorName;
            otherPartyName = invitedUserName;
            console.log('✅ INITIATOR: My Name =', myName, 'Other =', otherPartyName)
          } else {
            myName = invitedUserName;
            otherPartyName = initiatorName;
            console.log('✅ INVITED USER: My Name =', myName, 'Other =', otherPartyName)
          }
        } catch (profileError) {
          console.error('Error fetching profiles:', profileError)
          // Try to get current user's name from their own profile
          try {
            const currentUserProfile = await getUserProfile(token)
            myName = currentUserProfile.user.name
            setMySignature(currentUserProfile.user.signature?.url || '')
            otherPartyName = 'Other Party'
            console.log('Using current user profile:', myName)
          } catch (currentUserError) {
            console.error('Error fetching current user profile:', currentUserError)
            myName = 'You'
            otherPartyName = 'Other Party'
          }
        }
      }

      console.log('Final names - My Name:', myName, 'Other Party:', otherPartyName);
      setMyName(myName);
      setOtherPartyName(otherPartyName);
      
    } catch (error) {
      console.error('Error fetching user names:', error)
      // Fallback to generic names if names can't be fetched
      setMyName('You')
      setOtherPartyName('Other Party')
    }
  }

  const fetchAgreement = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError("No authentication token found. Please log in again.")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreement/${agreementId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setAgreement(data.agreement)
      } else {
        setError(data.message || "Failed to fetch agreement")
      }
    } catch (err: any) {
      console.error("Error fetching agreement:", err)
      setError(err.message || "Failed to fetch agreement")
    } finally {
      setLoading(false)
    }
  }

  const handleSignAgreement = () => {
    setShowSignature(true)
  }

  const handleDownloadPDF = async () => {
    try {
      if (!agreement) {
        toast({ title: "Error", description: "Agreement data not loaded.", variant: "destructive" });
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({ title: "Authentication Required", description: "Please log in to download the PDF.", variant: "destructive" });
        return;
      }

      toast({ title: "Downloading PDF", description: "Preparing your agreement PDF..." });

      await downloadAgreementPDF(token, agreement._id);
      
      toast({ title: "PDF Downloaded", description: "Your agreement PDF has been downloaded successfully." });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({ title: "Download Failed", description: error.message || "Failed to download the PDF. Please try again.", variant: "destructive" });
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'signed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchStatusIcon = (matchStatus: string) => {
    switch (matchStatus) {
      case 'green': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'red': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getMatchStatusColor = (matchStatus: string) => {
    switch (matchStatus) {
      case 'green': return 'bg-green-50 border-green-200'
      case 'red': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agreement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAgreement}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Agreement Not Found</h3>
          <p className="text-muted-foreground">The requested agreement could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex gap-2">
              {/* Only show Download PDF when both parties have signed */}
              {agreement.status === 'signed' && 
               agreement.signatures?.initiatorSignature?.signed && 
               agreement.signatures?.invitedUserSignature?.signed ? (
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-md">
                  <Download className="w-4 h-4" />
                  PDF available after both parties sign
                </div>
              )}
              {!(agreement.signatures?.initiatorSignature?.signed && agreement.signatures?.invitedUserSignature?.signed) && (
                <Button variant="outline" onClick={() => router.push(`/agreement-update-intake/${agreementId}`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Intake Form
                </Button>
              )}
              {agreement.status === 'active' && (
                <Button onClick={handleSignAgreement}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Agreement
                </Button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {agreement.templateId.templatename}
                </h1>
                <p className="text-gray-600 mb-4">{agreement.templateId.description}</p>
                
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(agreement.status)}>
                    {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Agreement between {myName} and {otherPartyName}</span>
              </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Created {new Date(agreement.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-700">Resolved Clauses</p>
                      <p className="text-2xl font-bold text-green-800">
                        {agreement.matchingResults?.filter(r => r.matchStatus === 'green').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-sm text-red-700">Red Light Clauses</p>
                      <p className="text-2xl font-bold text-red-800">
                        {agreement.matchingResults?.filter(r => r.matchStatus === 'red').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-700">Total Clauses</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {agreement.matchingResults?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Matching Results */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Agreement Matching Results
          </h2>

          {agreement.matchingResults?.map((result, index) => {
            // Debug logging
            console.log(`Result ${index}:`, result);
            console.log(`allVariants:`, result.allVariants);
            console.log(`initiator variants:`, result.allVariants?.initiator);
            console.log(`invitedUser variants:`, result.allVariants?.invitedUser);
            
            return (
            <Card key={index} className={`${getMatchStatusColor(result.matchStatus)}`}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMatchStatusIcon(result.matchStatus)}
                    <span>{result.clause_name}</span>
                  </div>
                  {result.score && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Score: {result.score}
                    </Badge>
                  )}
              </CardTitle>
              <CardDescription>
                  {result.reason}
              </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Selected Variant */}
                {result.selectedVariant && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      Selected Variant
                    </h4>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-800">{result.selectedVariant.variant_label}</p>
                      <p className="text-sm text-gray-600">{result.selectedVariant.text}</p>
                      {result.selectedVariant.best_used_when && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-blue-800">
                            <strong>Best Used When:</strong> {result.selectedVariant.best_used_when}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Ranking Info */}
                    <div className="mt-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700">My Rank: {isInitiator ? result.initiatorRank : result.invitedUserRank}</span>
                </div>
                  <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-green-700">Selected by matching algorithm</span>
                  </div>
                </div>
                  </div>
                )}

                {/* Red Light - No Selection */}
                {result.matchStatus === 'red' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Red Light - No Mutually Acceptable Variants
                    </h4>
                    <p className="text-sm text-red-700">
                      This clause requires escalation or renegotiation as there are no variants that both parties can accept.
                    </p>
                  </div>
                )}

                {/* My Selections Only - Privacy Focused */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    My Preferences ({myName})
                  </h4>
                  <div className="space-y-2">
                    {/* Show only current user's selections */}
                    {(isInitiator ? agreement.initiatorData?.selectedClauses?.filter(sc => sc.clause_name === result.clause_name) : 
                      agreement.invitedUserData?.selectedClauses?.filter(sc => sc.clause_name === result.clause_name)
                    )?.map((variant, idx) => (
                      <div key={idx} className={`p-2 rounded border ${
                        variant.status === 'accepted' 
                          ? 'bg-green-100 border-green-300' 
                          : 'bg-red-100 border-red-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{variant.variant.variant_label}</span>
                          <div className="flex items-center gap-2">
                            {variant.status === 'accepted' && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                Rank {variant.order}
                              </Badge>
                            )}
                            <Badge variant={variant.status === 'accepted' ? 'default' : 'destructive'} className="text-xs">
                              {variant.status === 'accepted' ? 'Accepted' : 'Rejected'}
                              </Badge>
                          </div>
                        </div>
                        {variant.variant.best_used_when && (
                          <div className="mt-1 text-xs text-gray-600">
                            <strong>Best Used When:</strong> {variant.variant.best_used_when}
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="text-sm text-gray-500 italic">No preferences recorded</div>
                    )}
                                </div>
                              </div>
                              
                {/* Mutually Acceptable Variants */}
                {result.mutuallyAcceptableVariants && result.mutuallyAcceptableVariants.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Mutually Acceptable Variants
                    </h4>
                                <div className="space-y-2">
                      {result.mutuallyAcceptableVariants.map((variant, idx) => (
                        <div key={idx} className="bg-white border border-yellow-300 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{variant.variant.variant_label}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                                My Rank: {isInitiator ? variant.initiatorRank : variant.invitedUserRank}
                                    </Badge>
                              <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                Mutually Accepted
                                    </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">{variant.variant.text}</p>
                        </div>
                      ))}
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
            );
          })}
        </div>

        {/* Chat Section */}
        <div className="mt-8">
          <AgreementChat agreementId={agreementId} currentUserId={currentUserId || ''} otherPartyName={otherPartyName} />
                  </div>
                </div>

      {/* Signature Modal */}
      {showSignature && (
        <SignatureOverlay
          isOpen={showSignature}
          agreementId={agreementId}
          userName={myName}
          userSignature={mySignature}
          onClose={() => setShowSignature(false)}
          onSignSuccess={() => {
            setShowSignature(false)
            fetchAgreement() // Refresh to show updated status
          }}
        />
      )}
    </div>
  )
}