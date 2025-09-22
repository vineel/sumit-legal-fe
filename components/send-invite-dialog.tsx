"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Send, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SendInviteDialogProps {
  isOpen: boolean
  onClose: () => void
  agreementId: string
  agreementName: string
  onInviteSent: () => void
}

export function SendInviteDialog({ 
  isOpen, 
  onClose, 
  agreementId, 
  agreementName, 
  onInviteSent 
}: SendInviteDialogProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  console.log("SendInviteDialog rendered - isOpen:", isOpen, "agreementId:", agreementId)

  const handleSendInvite = async () => {
    console.log("=== SEND INVITE DIALOG DEBUG ===")
    console.log("Email:", email)
    console.log("Agreement ID:", agreementId)
    console.log("Dialog open:", isOpen)
    
    // Reset error
    setError("")
    
    // Show initial toast
    toast({
      title: "Starting...",
      description: "Preparing to send invitation...",
      variant: "default"
    })
    
    // Validate email
    if (!email.trim()) {
      console.log("❌ No email provided")
      setError("Please enter an email address")
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive"
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email)
      setError("Please enter a valid email address")
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return
    }

    try {
      console.log("✅ Starting API call...")
      setLoading(true)
      
      // Get auth token
      const token = localStorage.getItem("auth_token")
      console.log("Auth token exists:", !!token)
      
      if (!token) {
        console.log("❌ No auth token found")
        setError("Please log in to send invitations")
        toast({
          title: "Authentication Error",
          description: "Please log in to send invitations",
          variant: "destructive"
        })
        return
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/agreement/send`
      console.log("API URL:", apiUrl)
      console.log("Request payload:", { agreementId, inviteeEmail: email })

      toast({
        title: "Sending...",
        description: "Sending invitation to server...",
        variant: "default"
      })

      // Make API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agreementId,
          inviteeEmail: email
        })
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation')
      }

      console.log("✅ Invite sent successfully:", data)

      toast({
        title: data.isResend ? "Invitation Resent!" : "Invitation Sent!",
        description: `Invitation ${data.isResend ? 'resent' : 'sent'} to ${data.inviteeName || email}. They will receive an email to start collaboration.`,
        variant: "default"
      })

      // Reset form and close dialog
      setEmail("")
      onInviteSent()
      onClose()

    } catch (err: any) {
      console.error("❌ Error sending invite:", err)
      setError(err.message || "Failed to send invitation. Please try again.")
      
      toast({
        title: "Error",
        description: err.message || "Failed to send invitation. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEmail("")
      setError("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Invitation
          </DialogTitle>
          <DialogDescription>
            Invite a registered user to collaborate on "{agreementName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The user must be registered and approved on the platform.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              console.log("=== SEND BUTTON CLICKED ===")
              console.log("Button clicked, email:", email)
              console.log("Loading state:", loading)
              handleSendInvite()
            }}
            disabled={loading || !email.trim()}
          >
            {loading ? (
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
  )
}
