"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  // Trash2 // Removed - delete functionality disabled
} from "lucide-react"
import { SendInviteDialog } from "./send-invite-dialog"
// import { deleteAgreement } from "@/lib/agreements" // Removed - delete functionality disabled
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Agreement {
  _id: string
  templateId: {
    templatename: string
    description?: string
  }
  userid: {
    _id: string
    name: string
    email: string
  }
  partyBUserId?: {
    _id: string
    name: string
    email: string
  }
  partyBEmail?: string
  status: string
  effectiveDate?: string
  termDuration?: string
  jurisdiction?: string
  partyASignature?: string
  partyBSignature?: string
  partyASigned?: boolean
  partyBSigned?: boolean
  createdAt: string
  updatedAt: string
}

interface AgreementCardProps {
  agreement: Agreement
  onStatusUpdate: (agreementId: string, newStatus: string) => Promise<void>
  onDownloadPDF: (agreementId: string) => Promise<void>
  actionLoading: string | null
}

export function AgreementCard({ 
  agreement, 
  onStatusUpdate, 
  onDownloadPDF,
  actionLoading
}: AgreementCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  // const [showDeleteDialog, setShowDeleteDialog] = useState(false) // Removed - delete functionality disabled
  // const [deleting, setDeleting] = useState(false) // Removed - delete functionality disabled
  const { toast } = useToast()

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
      default: return <Clock className="w-4 h-4" />
    }
  }

  const canSendInvite = !agreement.partyBUserId
  const canView = true // Always allow viewing agreements
  
  // Show download options when agreement is signed (both parties accepted all clauses)
  const agreementIsSigned = agreement.status === 'signed'
  
  // For better signature handling, check if both parties have actually signed
  const bothPartiesSigned = agreementIsSigned && 
                           agreement.partyASigned && 
                           agreement.partyBSigned
  
  const canDownloadPDF = bothPartiesSigned
  const canDownloadDOC = bothPartiesSigned
  // const canDelete = agreementIsSigned // Removed - delete functionality disabled
  // const isPartyA = agreement.userid?._id === user?.id // Removed - delete functionality disabled

  // Handle delete agreement - REMOVED
  // const handleDeleteAgreement = async () => { ... } // Removed - delete functionality disabled

  // Debug logging - simplified
  console.log("=== AGREEMENT CARD DEBUG ===")
  console.log("Agreement ID:", agreement._id)
  console.log("Agreement Status:", agreement.status)
  console.log("Both Parties Signed:", bothPartiesSigned)
  console.log("Can Download PDF:", canDownloadPDF)

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {agreement.templateId?.templatename || 'Custom Agreement'}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="text-sm">
                    <strong>Party A:</strong> {agreement.userid?.name || 'Unknown'}
                  </span>
                  <span className="text-sm">
                    <strong>Party B:</strong> {agreement.partyBUserId?.name || agreement.partyBEmail || 'No collaborator yet'}
                  </span>
                </div>
              </CardDescription>
            </div>
            <Badge className={`${getStatusColor(agreement.status)} flex items-center gap-1`}>
              {getStatusIcon(agreement.status)}
              {agreement.status.replace('-', ' ').toUpperCase()}
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
            {/* Send Invite Button */}
            {canSendInvite && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  console.log("=== SEND INVITE BUTTON CLICKED ===")
                  console.log("Agreement ID:", agreement._id)
                  console.log("Agreement name:", agreement.templateId?.templatename)
                  console.log("Can send invite:", canSendInvite)
                  setShowInviteDialog(true)
                  console.log("Dialog should be open now")
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                {agreement.partyBEmail ? 'Resend Invite' : 'Send Invite'}
              </Button>
            )}

            {/* View Agreement Button - Both parties can view until signed */}
            {canView && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  console.log("=== VIEW AGREEMENT BUTTON CLICKED ===")
                  console.log("Agreement ID:", agreement._id)
                  console.log("Agreement status:", agreement.status)
                  console.log("Can view:", canView)
                  console.log("Navigating to:", `/collaboration?agreementId=${agreement._id}`)
                  router.push(`/collaboration?agreementId=${agreement._id}`)
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Agreement
              </Button>
            )}


            {/* Download Buttons - Only show when both parties have signed */}
            {canDownloadPDF && (
              <div className="space-y-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onDownloadPDF(agreement._id)}
                  disabled={actionLoading === agreement._id}
                >
                  {actionLoading === agreement._id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download PDF
                </Button>
                {/*  */}
              </div>
            )}

            {/* Delete Button - REMOVED - delete functionality disabled */}

            {/* Status Message */}
            {!bothPartiesSigned && (
              <div className="text-xs text-muted-foreground text-center p-2 bg-muted rounded">
                {agreementIsSigned 
                  ? 'Download options available after both parties sign the agreement'
                  : 'Download options available after both parties accept all clauses and sign'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send Invite Dialog */}
      <SendInviteDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        agreementId={agreement._id}
        agreementName={agreement.templateId?.templatename || 'Agreement'}
        onInviteSent={() => {
          // Refresh the page or update the agreement list
          window.location.reload()
        }}
      />

      {/* Delete Confirmation Dialog - REMOVED - delete functionality disabled */}
      {/* {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Agreement</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete this agreement?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-sm">{agreement.templateId?.templatename}</p>
                <p className="text-xs text-gray-500">Agreement ID: {agreement._id}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAgreement}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )} */}
    </>
  )
}