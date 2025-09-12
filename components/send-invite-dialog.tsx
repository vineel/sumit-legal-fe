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

  const handleSendInvite = async () => {
    // Reset error
    setError("")
    
    // Validate email
    if (!email.trim()) {
      setError("Please enter an email address")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      setLoading(true)
      
      // Get auth token
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("Please log in to send invitations")
        return
      }

      console.log("Sending invite to:", email)
      console.log("Agreement ID:", agreementId)

      // Make API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/send`, {
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation')
      }

      console.log("Invite sent successfully:", data)

      toast({
        title: "Invitation Sent!",
        description: `Invitation sent to ${data.inviteeName || email}. They will receive an email to start collaboration.`,
        variant: "default"
      })

      // Reset form and close dialog
      setEmail("")
      onInviteSent()
      onClose()

    } catch (err: any) {
      console.error("Error sending invite:", err)
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
            onClick={handleSendInvite}
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
