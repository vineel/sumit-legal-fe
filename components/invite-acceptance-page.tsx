"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Calendar,
  FileText,
  ArrowRight,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { acceptInvitation, updateAgreementStatus } from "@/lib/agreements"

interface InviteAcceptancePageProps {
  inviteToken: string
}

interface InviteDetails {
  agreementId: string
  inviterName: string
  inviterEmail: string
  templateName: string
  effectiveDate: string
  status: string
}

export function InviteAcceptancePage({ inviteToken }: InviteAcceptancePageProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchInviteDetails()
  }, [inviteToken])

  const fetchInviteDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/agreement/invite/${inviteToken}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch invite details")
      }
      
      setInviteDetails(data.invite)
    } catch (err) {
      console.error("Error fetching invite details:", err)
      setError(err instanceof Error ? err.message : "Failed to load invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!user || !isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?returnUrl=/invite/${inviteToken}`)
      return
    }

    try {
      setAccepting(true)
      setError(null)

      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const result = await acceptInvitation(token, inviteToken)
      
      // Update agreement status to 'accepted'
      await updateAgreementStatus(token, result.agreement._id, 'accepted')
      
      toast({
        title: "Invitation Accepted",
        description: "You have successfully joined the agreement collaboration.",
        variant: "default"
      })
      
      // Redirect to collaboration workspace
      router.push(`/collaboration?agreementId=${result.agreement._id}`)
    } catch (err) {
      console.error("Error accepting invitation:", err)
      setError("Failed to accept invitation. Please try again.")
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive"
      })
    } finally {
      setAccepting(false)
    }
  }

  const handleLogin = () => {
    router.push(`/login?returnUrl=/invite/${inviteToken}`)
  }

  const handleSignup = () => {
    router.push(`/signup?returnUrl=/invite/${inviteToken}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation details...</p>
        </div>
      </div>
    )
  }

  if (error && !inviteDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">You're Invited to Collaborate!</h1>
          <p className="text-muted-foreground">
            You've been invited to participate in a legal agreement negotiation
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Invitation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Agreement Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Invited by</p>
                  <p className="text-sm text-muted-foreground">
                    {inviteDetails?.inviterName} ({inviteDetails?.inviterEmail})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Template</p>
                  <p className="text-sm text-muted-foreground">
                    {inviteDetails?.templateName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Effective Date</p>
                  <p className="text-sm text-muted-foreground">
                    {inviteDetails?.effectiveDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-fit">
                  {inviteDetails?.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Accept Invitation</CardTitle>
              <CardDescription>
                Join the collaboration to negotiate and finalize this agreement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You need to be logged in to accept this invitation.
                  </p>
                  <div className="space-y-2">
                    <Button onClick={handleLogin} className="w-full">
                      Login to Existing Account
                    </Button>
                    <Button onClick={handleSignup} variant="outline" className="w-full">
                      Create New Account
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Logged in as {user?.name}</span>
                  </div>
                  
                  <Button 
                    onClick={handleAcceptInvitation} 
                    disabled={accepting}
                    className="w-full"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Accepting Invitation...
                      </>
                    ) : (
                      <>
                        Accept Invitation
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* What happens next */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                  1
                </div>
                <h3 className="font-medium mb-1">Complete Intake</h3>
                <p className="text-sm text-muted-foreground">
                  Rank your clause preferences in a simple wizard
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                  2
                </div>
                <h3 className="font-medium mb-1">Collaborate</h3>
                <p className="text-sm text-muted-foreground">
                  Negotiate clauses in real-time with AI assistance
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                  3
                </div>
                <h3 className="font-medium mb-1">Sign & Download</h3>
                <p className="text-sm text-muted-foreground">
                  Sign the final agreement and download the PDF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
