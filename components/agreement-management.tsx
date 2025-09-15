"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download,
  Send,
  Users,
  Calendar,
  MapPin,
  Loader2,
  Eye,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateAgreementStatus, downloadAgreementPDF, generateAgreementPDF, sendInvite, getAgreements, Agreement, AgreementStatus } from "@/lib/agreements"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AgreementManagementProps {
  userRole: 'admin' | 'party'
}

export function AgreementManagement({ userRole }: AgreementManagementProps) {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [sendingInvite, setSendingInvite] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchAgreements()
  }, [])

  const fetchAgreements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const data = await getAgreements(token)
      setAgreements(data || [])
    } catch (err) {
      console.error("Error fetching agreements:", err)
      setError("Failed to load agreements")
      toast({
        title: "Error",
        description: "Failed to load agreements. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (agreementId: string, newStatus: string) => {
    try {
      setActionLoading(agreementId)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive"
        })
        return
      }

      await updateAgreementStatus(token, agreementId, newStatus)
      
      // Update local state
      setAgreements(prev => 
        prev.map(agreement => 
          agreement._id === agreementId 
            ? { ...agreement, status: newStatus as AgreementStatus }
            : agreement
        )
      )

      toast({
        title: "Status Updated",
        description: `Agreement status updated to ${newStatus}`,
        variant: "default"
      })
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Error",
        description: "Failed to update agreement status",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPDF = async (agreementId: string) => {
    try {
      setActionLoading(agreementId)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive"
        })
        return
      }

      // Use different PDF function based on user role
      if (userRole === 'admin') {
        await downloadAgreementPDF(token, agreementId)
      } else {
        await generateAgreementPDF(token, agreementId)
      }

      toast({
        title: "Download Started",
        description: "Agreement PDF is being downloaded",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error downloading PDF:", err)
      const errorMessage = err.response?.data?.message || "Failed to download PDF"
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendInvite = async () => {
    console.log("=== SEND INVITE DEBUG ===")
    console.log("Selected agreement:", selectedAgreement)
    console.log("Invite email:", inviteEmail)
    console.log("Dialog open:", inviteDialogOpen)
    console.log("Sending invite state:", sendingInvite)
    
    if (!selectedAgreement || !inviteEmail.trim()) {
      console.log("Missing data - selectedAgreement:", !!selectedAgreement, "inviteEmail:", inviteEmail)
      toast({
        title: "Missing Information",
        description: "Please select an agreement and enter an email address.",
        variant: "destructive"
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      console.log("Invalid email format:", inviteEmail)
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }

    try {
      setSendingInvite(true)
      const token = localStorage.getItem("auth_token")
      console.log("Auth token exists:", !!token)
      
      if (!token) {
        console.log("No auth token found")
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive"
        })
        return
      }

      console.log("Calling sendInvite API with:", {
        agreementId: selectedAgreement._id,
        inviteeEmail: inviteEmail
      })
      
      const result = await sendInvite(token, selectedAgreement._id, inviteEmail)
      console.log("Send invite result:", result)
      
      toast({
        title: "Invite Sent Successfully",
        description: `Invitation sent to ${result.inviteeName} (${inviteEmail}). They will receive an email to start collaboration.`,
        variant: "default"
      })
      
      // Close dialog and reset form
      setInviteDialogOpen(false)
      setSelectedAgreement(null)
      setInviteEmail("")
      
    } catch (err: any) {
      console.error("Error sending invite:", err)
      const errorMessage = err.response?.data?.message || "Failed to send invitation. Please try again."
      toast({
        title: "Error Sending Invite",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSendingInvite(false)
    }
  }

  const openInviteDialog = (agreement: Agreement) => {
    console.log("=== OPEN INVITE DIALOG ===")
    console.log("Agreement:", agreement)
    setSelectedAgreement(agreement)
    setInviteEmail("")
    setInviteDialogOpen(true)
    console.log("Dialog should be open now")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invited': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'signed': return 'bg-emerald-100 text-emerald-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'invited': return <Mail className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'in-progress': return <Clock className="w-4 h-4" />
      case 'completed': return <FileText className="w-4 h-4" />
      case 'signed': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const canDownloadPDF = (agreement: Agreement) => {
    return agreement.status === 'signed' && 
           agreement.partyASignature && 
           agreement.partyBSignature
  }

  const canStartAgreement = (agreement: Agreement) => {
    return agreement.status === 'accepted'
  }

  const canEndInvite = (agreement: Agreement) => {
    return agreement.status === 'invited'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agreements...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (agreements.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Agreements Found</h3>
          <p className="text-muted-foreground mb-4">
            {userRole === 'admin' 
              ? "No agreements have been created yet." 
              : "You haven't created or been invited to any agreements yet."
            }
          </p>
          {userRole === 'party' && (
            <Button onClick={() => router.push('/select-template')}>
              Create New Agreement
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agreement Management</h2>
          <p className="text-muted-foreground">
            {userRole === 'admin' 
              ? "Manage all agreements in the system" 
              : "Manage your agreements and invitations"
            }
          </p>
        </div>
        {userRole === 'party' && (
          <Button onClick={() => router.push('/select-template')}>
            <Send className="w-4 h-4 mr-2" />
            Create New Agreement
          </Button>
        )}
      </div>

      {userRole === 'admin' ? (
        // Admin Table View
        <Card>
          <CardHeader>
            <CardTitle>All Agreements</CardTitle>
            <CardDescription>
              Complete list of all agreements in the system with party details and PDF download options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Party A</TableHead>
                  <TableHead>Party B</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((agreement) => (
                  <TableRow key={agreement._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {typeof agreement.templateId === 'object' ? agreement.templateId.templatename : 'Custom Agreement'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {agreement._id.slice(-8)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {agreement.partyAName || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          User ID: {agreement.userid}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {agreement.partyBUserId ? 'Registered User' : 'Email Invite'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agreement.partyBEmail || 'Not set'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(agreement.status || 'draft')} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(agreement.status || 'draft')}
                        {(agreement.status || 'draft').replace('-', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agreement.effectiveDate ? new Date(agreement.effectiveDate).toLocaleDateString() : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 ${agreement.partyASignature ? 'text-green-600' : 'text-gray-400'}`}>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">A</span>
                        </div>
                        <div className={`flex items-center gap-1 ${agreement.partyBSignature ? 'text-green-600' : 'text-gray-400'}`}>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">B</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/collaboration?agreementId=${agreement._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button> */}
                        {agreement.status === 'signed' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleDownloadPDF(agreement._id)}
                            disabled={actionLoading === agreement._id}
                          >
                            {actionLoading === agreement._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Party Card View
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agreements.map((agreement) => (
            <Card key={agreement._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {typeof agreement.templateId === 'object' ? agreement.templateId.templatename : 'Custom Agreement'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {agreement.partyBEmail || 'No email provided'}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(agreement.status || 'draft')} flex items-center gap-1`}>
                    {getStatusIcon(agreement.status || 'draft')}
                    {(agreement.status || 'draft').replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Agreement Details */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {agreement.effectiveDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Effective: {new Date(agreement.effectiveDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {agreement.jurisdiction && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{agreement.jurisdiction}</span>
                    </div>
                  )}
                  {agreement.termDuration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Duration: {agreement.termDuration}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Status-based actions */}
                  {canEndInvite(agreement) && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleStatusUpdate(agreement._id, 'rejected')}
                      disabled={actionLoading === agreement._id}
                    >
                      {actionLoading === agreement._id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      End Invite
                    </Button>
                  )}

                  {canStartAgreement(agreement) && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => router.push(`/collaboration?agreementId=${agreement._id}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Start Agreement
                    </Button>
                  )}

                  {/* Send Invite button - show when no party B is set */}
                  {!agreement.partyBUserId && !agreement.partyBEmail && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openInviteDialog(agreement)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Invite
                    </Button>
                  )}

                  {/* View/Edit actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/collaboration?agreementId=${agreement._id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    
                    {agreement.status === 'in-progress' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/collaboration?agreementId=${agreement._id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {/* Download PDF */}
                  {agreement.status === 'signed' && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleDownloadPDF(agreement._id)}
                      disabled={actionLoading === agreement._id}
                    >
                      {actionLoading === agreement._id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download PDF
                    </Button>
                  )}

                  {/* Show message if PDF not ready */}
                  {agreement.status !== 'signed' && (
                    <div className="text-xs text-muted-foreground text-center p-2 bg-muted rounded">
                      PDF available after both parties sign
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Send Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on this agreement. The user must be registered and approved on the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedAgreement && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Agreement Details:</h4>
                <p className="text-sm text-muted-foreground">
                  Template: {typeof selectedAgreement.templateId === 'object' ? selectedAgreement.templateId.templatename : 'Custom Agreement'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {selectedAgreement.status}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                The user must be registered and approved on the platform to receive the invitation.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setInviteDialogOpen(false)}
              disabled={sendingInvite}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log("=== SEND BUTTON CLICKED ===")
                console.log("Sending invite:", sendingInvite)
                console.log("Email:", inviteEmail)
                console.log("Selected agreement:", selectedAgreement)
                handleSendInvite()
              }}
              disabled={sendingInvite || !inviteEmail.trim()}
            >
              {sendingInvite ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
