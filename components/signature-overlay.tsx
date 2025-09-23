"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PenTool, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X,
  User,
  Calendar
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { signAgreement } from "@/lib/agreements"

interface SignatureOverlayProps {
  isOpen: boolean
  onClose: () => void
  agreementId: string
  userSignature?: string
  userName: string
  onSignSuccess: () => void
}

export function SignatureOverlay({ 
  isOpen, 
  onClose, 
  agreementId, 
  userSignature, 
  userName,
  onSignSuccess 
}: SignatureOverlayProps) {
  const [isSigning, setIsSigning] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (isOpen && userSignature) {
      // Show signature after a brief delay for effect
      const timer = setTimeout(() => {
        setShowSignature(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen, userSignature])

  const handleSignAgreement = async () => {
    if (!userSignature) {
      toast({
        title: "No Signature Found",
        description: "Please upload a signature in your profile first.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSigning(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await signAgreement(token, agreementId)
      
      toast({
        title: "Agreement Signed!",
        description: response.message,
      })

      onSignSuccess()
      onClose()
      
    } catch (error: any) {
      console.error('Error signing agreement:', error)
      
      if (error.message.includes('upload a signature first')) {
        toast({
          title: "Signature Required",
          description: "Please upload a signature in your profile first.",
          variant: "destructive",
        })
        router.push('/profile')
      } else {
        toast({
          title: "Signing Failed",
          description: error.message || "Failed to sign agreement",
          variant: "destructive",
        })
      }
    } finally {
      setIsSigning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <PenTool className="w-6 h-6 text-primary" />
              Sign Agreement
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Review your signature and confirm to sign the agreement
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-sm text-muted-foreground">Signing as party to this agreement</p>
            </div>
          </div>

          {/* Signature Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Digital Signature</h3>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 bg-muted/30">
              {userSignature ? (
                <div className="space-y-4">
                  {showSignature ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-64 h-32 border border-muted-foreground/20 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-sm">
                        <img 
                          src={userSignature} 
                          alt="Your Signature" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-700">Signature Ready</p>
                        <p className="text-xs text-muted-foreground">This signature will be applied to the agreement</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">No Signature Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to upload a signature in your profile before signing agreements.
                  </p>
                  <Button 
                    onClick={() => {
                      onClose()
                      router.push('/profile')
                    }}
                    className="w-full"
                  >
                    Go to Profile to Upload Signature
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Agreement Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Important Notice</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• By signing, you agree to all terms and conditions in this agreement</li>
                  <li>• Your signature will be legally binding and cannot be undone</li>
                  <li>• Both parties must sign for the agreement to be complete</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isSigning}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSignAgreement}
              disabled={!userSignature || isSigning}
              className="flex-1"
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Agreement
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
