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
  Edit
} from "lucide-react"
import { SendInviteDialog } from "./send-invite-dialog"

interface Agreement {
  _id: string
  templateId: {
    templatename: string
    description?: string
  }
  partyBEmail?: string
  partyBUserId?: string
  status: string
  effectiveDate?: string
  termDuration?: string
  jurisdiction?: string
  partyASignature?: string
  partyBSignature?: string
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
  const [showInviteDialog, setShowInviteDialog] = useState(false)

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
  const canStartAgreement = agreement.status === 'accepted'
  const canDownloadPDF = agreement.status === 'signed' && 
                       agreement.partyASignature && 
                       agreement.partyBSignature

  // Debug logging
  console.log("Agreement Card Debug:", {
    agreementId: agreement._id,
    partyBUserId: agreement.partyBUserId,
    partyBEmail: agreement.partyBEmail,
    status: agreement.status,
    canSendInvite,
    canStartAgreement,
    canDownloadPDF
  })

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
                {agreement.partyBEmail || 'No collaborator yet'}
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

            {/* Start Agreement Button */}
            {canStartAgreement && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => router.push(`/collaboration?agreementId=${agreement._id}`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Start Collaboration
              </Button>
            )}

            {/* View/Edit Buttons */}
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

            {/* Download PDF Button */}
            {canDownloadPDF && (
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
            )}

            {/* Status Message */}
            {!canDownloadPDF && agreement.status !== 'signed' && (
              <div className="text-xs text-muted-foreground text-center p-2 bg-muted rounded">
                PDF available after both parties sign
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
    </>
  )
}
