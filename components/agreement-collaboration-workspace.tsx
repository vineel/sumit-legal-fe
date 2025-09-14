"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Send,
  Loader2,
  AlertCircle,
  Lightbulb,
  PenTool,
  Eye,
  EyeOff,
  Plus,
  Edit
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAgreementById, updateClausePreferences, sendChatMessage, getChatMessages, updateAgreementStatus, downloadAgreementPDF } from "@/lib/agreements"
import { useAuth } from "@/components/auth-provider"

interface AgreementCollaborationWorkspaceProps {
  agreementId: string
}

interface Clause {
  _id: string
  name: string
  description: string
  category: string
  required?: boolean
  status?: string
  partyAPreference?: string
  partyBPreference?: string
  aiSuggestion?: string
  isResolved?: boolean
  clauseId?: {
    name: string
    description: string
  }
}

interface ChatMessage {
  _id: string
  message: string
  senderName: string
  senderRole: 'partyA' | 'partyB'
  createdAt: string
}


export function AgreementCollaborationWorkspace({ agreementId }: AgreementCollaborationWorkspaceProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [agreement, setAgreement] = useState<any>(null)
  const [clauses, setClauses] = useState<Clause[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: string}>({})
  const [showSignatures, setShowSignatures] = useState(false)
  const [signature, setSignature] = useState("")
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const [newClauseData, setNewClauseData] = useState({
    name: "",
    description: "",
    category: ""
  })
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (agreementId) {
      fetchAgreementDetails()
      fetchChatMessages()
      initializeSocket()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [agreementId])

  const initializeSocket = () => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem("auth_token")
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server')
      setIsConnected(true)
      newSocket.emit('join-agreement', agreementId)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server')
      setIsConnected(false)
    })

    newSocket.on('clause-updated', (data) => {
      console.log('Clause updated:', data)
      if (data.agreementId === agreementId) {
        // Update clauses in real-time with the complete clauses array
        const transformedClauses = data.clauses?.map((clauseItem: any) => ({
          _id: clauseItem.clauseId._id,
          name: clauseItem.clauseId.name,
          description: clauseItem.clauseId.description,
          category: clauseItem.clauseId.category,
          required: clauseItem.clauseId.required,
          status: clauseItem.clauseId.status,
          partyAPreference: clauseItem.partyAPreference,
          partyBPreference: clauseItem.partyBPreference,
          isResolved: clauseItem.partyAPreference && clauseItem.partyBPreference && 
                     clauseItem.partyAPreference === clauseItem.partyBPreference
        })) || []
        
        setClauses(transformedClauses)
        
        // Show notification
        toast({
          title: "Clause Updated",
          description: "Clause preferences have been updated by another party",
          variant: "default"
        })
      }
    })

    newSocket.on('agreement-status-updated', (data) => {
      console.log('Agreement status updated:', data)
      if (data.agreementId === agreementId) {
        setAgreement((prev: any) => prev ? { ...prev, status: data.status } : null)
      }
    })

    newSocket.on('receive-message', (data) => {
      console.log('New chat message:', data)
      if (data.agreementId === agreementId) {
        setChatMessages(prev => [...prev, data.message])
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    })

    newSocket.on('agreement-signed', (data) => {
      console.log('Agreement signed:', data)
      if (data.agreementId === agreementId) {
        setAgreement((prev: any) => prev ? { 
          ...prev, 
          partyASignature: data.signedBy === 'partyA' ? 'signed' : prev.partyASignature,
          partyBSignature: data.signedBy === 'partyB' ? 'signed' : prev.partyBSignature,
          status: data.isComplete ? 'signed' : prev.status
        } : null)
      }
    })

    newSocket.on('custom-clause-added', (data) => {
      console.log('Custom clause added:', data)
      if (data.agreementId === agreementId) {
        setClauses(prev => [...prev, data.clause])
        toast({
          title: "New Clause Added",
          description: `${data.clause.name} has been added to the agreement`,
          variant: "default"
        })
      }
    })

    setSocket(newSocket)
  }

  const fetchAgreementDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const data = await getAgreementById(token, agreementId)
      setAgreement(data)
      
      // Transform clauses from nested structure to flat structure
      const transformedClauses = data.clauses?.map((clauseItem: any) => ({
        _id: clauseItem.clauseId._id,
        name: clauseItem.clauseId.name,
        description: clauseItem.clauseId.description,
        category: clauseItem.clauseId.category,
        required: clauseItem.clauseId.required,
        status: clauseItem.clauseId.status,
        partyAPreference: clauseItem.partyAPreference,
        partyBPreference: clauseItem.partyBPreference,
        isResolved: clauseItem.partyAPreference && clauseItem.partyBPreference && 
                   clauseItem.partyAPreference === clauseItem.partyBPreference
      })) || []
      
      setClauses(transformedClauses)
    } catch (err) {
      console.error("Error fetching agreement:", err)
      setError("Failed to load agreement details")
      toast({
        title: "Error",
        description: "Failed to load agreement details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchChatMessages = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const data = await getChatMessages(token, agreementId)
      setChatMessages(data.messages || [])
    } catch (err) {
      console.error("Error fetching chat messages:", err)
    }
  }

  const handleClauseUpdate = async (clauseId: string, preference: string) => {
    try {
      setSaving(true)
      
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Determine which party preference to update based on user role
      const isPartyA = agreement?.userid?.toString() === user?.id?.toString()
      const preferenceField = isPartyA ? 'partyAPreference' : 'partyBPreference'

      const updatedClauses = clauses.map(clause => 
        clause.clauseId._id === clauseId 
          ? { ...clause, [preferenceField]: preference }
          : clause
      )

      await updateClausePreferences(token, agreementId, updatedClauses.map(clause => ({
        clauseId: clause.clauseId._id,
        partyAPreference: clause.partyAPreference,
        partyBPreference: clause.partyBPreference
      })))
      setClauses(updatedClauses)

      // Emit real-time update
      if (socket) {
        socket.emit('update-clause', {
          agreementId,
          clauseId,
          preference,
          userRole: isPartyA ? 'partyA' : 'partyB',
          clauses: updatedClauses
        })
      }

      toast({
        title: "Clause Updated",
        description: "Your preference has been saved",
        variant: "default"
      })
    } catch (err) {
      console.error("Error updating clause:", err)
      toast({
        title: "Error",
        description: "Failed to update clause preference",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCustomClause = async () => {
    try {
      setSaving(true)
      
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Create custom clause in backend first
      const response = await fetch('/api/agreement/custom-clause', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agreementId,
          name: newClauseData.name,
          description: newClauseData.description,
          category: newClauseData.category
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create custom clause')
      }

      const result = await response.json()
      
      const newClause: Clause = {
        _id: result.clauseId,
        name: newClauseData.name,
        description: newClauseData.description,
        category: newClauseData.category,
        required: false,
        status: "active",
        partyAPreference: "",
        partyBPreference: "",
        isResolved: false
      }

      const updatedClauses = [...clauses, newClause]
      setClauses(updatedClauses)

      // Emit real-time update
      if (socket) {
        socket.emit('custom-clause-added', {
          agreementId,
          clause: newClause
        })
      }

      // Reset form
      setNewClauseData({ name: "", description: "", category: "" })
      setIsAddClauseDialogOpen(false)

      toast({
        title: "Custom Clause Added",
        description: "Your custom clause has been added to the agreement.",
      })
    } catch (err) {
      console.error("Error adding custom clause:", err)
      toast({
        title: "Error",
        description: "Failed to add custom clause.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Determine sender role based on agreement ownership
      const isPartyA = agreement?.userid?.toString() === user?.id?.toString()
      const senderRole = isPartyA ? 'partyA' : 'partyB'

      const result = await sendChatMessage(token, agreementId, newMessage, senderRole)
      
      // Create message object for real-time update
      const messageData: ChatMessage = {
            _id: result.chatMessage._id,
        message: newMessage,
        senderRole: senderRole as 'partyA' | 'partyB',
            senderName: user?.name || 'Unknown User',
            createdAt: new Date().toISOString()
          }

      // Add to local state immediately for better UX
      setChatMessages(prev => [...prev, messageData])
      
      // Emit real-time message
      if (socket) {
        socket.emit('send-message', {
          agreementId,
          message: messageData
        })
      }

      setNewMessage("")
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error("Error sending message:", err)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    }
  }

  const handleGenerateAISuggestion = async (clauseId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const clause = clauses.find(c => c._id === clauseId)
      if (!clause) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/generate-clause-suggestion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clauseName: clause.name,
          clauseDescription: clause.description,
          partyAPreference: clause.partyAPreference,
          partyBPreference: clause.partyBPreference,
          agreementType: agreement?.templateId?.templatename || 'Legal Agreement'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestion')
      }

      const data = await response.json()
      setAiSuggestions(prev => ({
        ...prev,
        [clauseId]: data.suggestion
      }))

      toast({
        title: "AI Suggestion Generated",
        description: "AI has provided a detailed suggestion for this clause",
        variant: "default"
      })
    } catch (err) {
      console.error("Error generating AI suggestion:", err)
      toast({
        title: "Error",
        description: "Failed to generate AI suggestion",
        variant: "destructive"
      })
    }
  }

  const handleSignatureUpload = async (file: File) => {
    try {
      setIsUploadingSignature(true)
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const formData = new FormData()
      formData.append('signature', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/upload-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload signature')
      }

      const result = await response.json()
      
      // Update user signature in local state
      if (user) {
        user.signature = { url: result.signatureUrl }
      }

      toast({
        title: "Signature Uploaded",
        description: "Your signature has been saved to your profile",
        variant: "default"
      })
    } catch (err) {
      console.error("Error uploading signature:", err)
      toast({
        title: "Error",
        description: "Failed to upload signature",
        variant: "destructive"
      })
    } finally {
      setIsUploadingSignature(false)
    }
  }

  const handleSignAgreement = async () => {
    if (!signature.trim() && !user?.signature?.url) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature or upload a signature image",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Determine which party is signing
      const isPartyA = agreement?.userid?.toString() === user?.id?.toString()
      const signedBy = isPartyA ? 'partyA' : 'partyB'

      // Use stored signature URL if available, otherwise use text signature
      const signatureData = user?.signature?.url || signature

      // Call sign agreement API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/agreement/${agreementId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signatureData: signatureData,
          signatureType: user?.signature?.url ? 'image' : 'text'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to sign agreement')
      }

      const result = await response.json()
      
      // Update local state
      setAgreement((prev: any) => prev ? {
        ...prev,
        partyASignature: isPartyA ? signatureData : prev.partyASignature,
        partyBSignature: !isPartyA ? signatureData : prev.partyBSignature,
        status: result.agreement.status
      } : null)

      // Emit real-time update
      if (socket) {
        socket.emit('agreement-signed', {
          agreementId,
          signedBy: signedBy,
          isComplete: result.agreement.status === 'signed'
        })
      }
      
      toast({
        title: "Agreement Signed",
        description: "Your signature has been recorded",
        variant: "default"
      })
    } catch (err) {
      console.error("Error signing agreement:", err)
      toast({
        title: "Error",
        description: "Failed to sign agreement",
        variant: "destructive"
      })
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Generate PDF first
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/agreement/${agreementId}/generate-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `agreement-${agreement.templateId?.templatename || 'agreement'}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: "Agreement PDF is being downloaded",
        variant: "default"
      })
    } catch (err) {
      console.error("Error downloading PDF:", err)
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive"
      })
    }
  }

  const handleDownloadDOC = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Generate DOC first
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/agreement/${agreementId}/generate-doc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate DOC')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `agreement-${agreement.templateId?.templatename || 'agreement'}-${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: "Agreement DOC is being downloaded",
        variant: "default"
      })
    } catch (err) {
      console.error("Error downloading DOC:", err)
      toast({
        title: "Error",
        description: "Failed to download DOC",
        variant: "destructive"
      })
    }
  }

  const allClausesAgreed = clauses.every(clause => 
    clause.partyAPreference && clause.partyBPreference && 
    clause.partyAPreference === clause.partyBPreference
  )

  const canDownloadPDF = agreement?.status === 'signed' && 
                        agreement?.partyASigned && 
                        agreement?.partyBSigned &&
                        allClausesAgreed

  const allClausesResolved = allClausesAgreed

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agreement details...</p>
        </div>
      </div>
    )
  }

  if (error || !agreement) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error || "Agreement not found"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{agreement.templateId?.templatename || 'Agreement'}</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">
                Status: <Badge className={agreement.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                  {agreement.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {canDownloadPDF && (
              <div className="flex gap-2">
                <Button onClick={handleDownloadPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                  PDF
              </Button>
                <Button onClick={handleDownloadDOC} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  DOC
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="clauses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clauses">Clauses</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="signatures">Signatures</TabsTrigger>
        </TabsList>

        {/* Clauses Tab */}
        <TabsContent value="clauses" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Agreement Clauses</h3>
            <Button onClick={() => setIsAddClauseDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Clause
            </Button>
          </div>
          <div className="grid gap-6">
            {clauses.map((clause) => {
              console.log('Clause data:', clause);
              return (
              <Card key={clause._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-gray-900">
                        {clause.clauseId?.name || clause.name || 'Clause'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Category: {clause.category || 'General'} | Status: {clause.status || 'Active'}
                      </span>
                    </div>
                    {clause.partyAPreference && clause.partyBPreference ? (
                      (clause.partyAPreference === 'preferred' && clause.partyBPreference === 'preferred') ||
                      (clause.partyAPreference === 'acceptable' && clause.partyBPreference === 'acceptable') ||
                      (clause.partyAPreference === 'preferred' && clause.partyBPreference === 'acceptable') ||
                      (clause.partyAPreference === 'acceptable' && clause.partyBPreference === 'preferred') ? (
                        <Badge className="bg-green-100 text-green-800 border border-green-300 font-semibold">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          BOTH AGREED
                        </Badge>
                      ) : (clause.partyAPreference === 'unacceptable' || clause.partyBPreference === 'unacceptable') ? (
                        <Badge className="bg-red-100 text-red-800 border border-red-300 font-semibold">
                          <XCircle className="w-4 h-4 mr-1" />
                          REJECTED
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold">
                          <Clock className="w-4 h-4 mr-1" />
                          IN DISCUSSION
                        </Badge>
                      )
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold">
                        <Clock className="w-4 h-4 mr-1" />
                        PENDING
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{clause.clauseId?.description || clause.description || 'No description available'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Party Preferences */}
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="flex items-center gap-2">
                          Party A {agreement?.userid?.toString() === user?.id?.toString() ? '(You)' : ''}
                          {clause.partyAPreference ? (
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              clause.partyAPreference === 'preferred' ? 'bg-green-100 text-green-800 border border-green-200' :
                              clause.partyAPreference === 'acceptable' ? 'bg-green-100 text-green-800 border border-green-200' :
                              clause.partyAPreference === 'unacceptable' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {clause.partyAPreference === 'preferred' ? '✓ ACCEPTED' :
                               clause.partyAPreference === 'acceptable' ? '✓ ACCEPTED' :
                               clause.partyAPreference === 'unacceptable' ? '✗ REJECTED' :
                               'Modified'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              No Decision
                            </span>
                          )}
                        </Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'preferred' ? 'default' : 'outline'}
                              className={clause.partyAPreference === 'preferred' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                              onClick={() => handleClauseUpdate(clause.clauseId._id, 'preferred')}
                              disabled={saving || agreement?.userid?.toString() !== user?.id?.toString()}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {clause.partyAPreference === 'preferred' ? '✓ Preferred' : 'Preferred'}
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'acceptable' ? 'default' : 'outline'}
                              className={clause.partyAPreference === 'acceptable' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                              onClick={() => handleClauseUpdate(clause.clauseId._id, 'acceptable')}
                              disabled={saving || agreement?.userid?.toString() !== user?.id?.toString()}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {clause.partyAPreference === 'acceptable' ? '✓ Acceptable' : 'Acceptable'}
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'unacceptable' ? 'destructive' : 'outline'}
                              className={clause.partyAPreference === 'unacceptable' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                              onClick={() => handleClauseUpdate(clause.clauseId._id, 'unacceptable')}
                              disabled={saving || agreement?.userid?.toString() !== user?.id?.toString()}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {clause.partyAPreference === 'unacceptable' ? '✗ Unacceptable' : 'Unacceptable'}
                            </Button>
                          </div>
                          {clause.partyAPreference && (
                            <div className={`p-3 rounded-lg ${
                              clause.partyAPreference === 'preferred' ? 'bg-green-50 border border-green-200' :
                              clause.partyAPreference === 'acceptable' ? 'bg-blue-50 border border-blue-200' :
                              'bg-red-50 border border-red-200'
                            }`}>
                              <p className="text-sm font-medium">
                                Party A: <span className="capitalize">{clause.partyAPreference}</span>
                                {clause.partyAPreference === 'preferred' && ' ✅'}
                                {clause.partyAPreference === 'acceptable' && ' ✓'}
                                {clause.partyAPreference === 'unacceptable' && ' ❌'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          Party B {agreement?.partyBUserId?.toString() === user?.id?.toString() ? '(You)' : ''}
                          {clause.partyBPreference ? (
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              clause.partyBPreference === 'preferred' ? 'bg-green-100 text-green-800 border border-green-200' :
                              clause.partyBPreference === 'acceptable' ? 'bg-green-100 text-green-800 border border-green-200' :
                              clause.partyBPreference === 'unacceptable' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {clause.partyBPreference === 'preferred' ? '✓ ACCEPTED' :
                               clause.partyBPreference === 'acceptable' ? '✓ ACCEPTED' :
                               clause.partyBPreference === 'unacceptable' ? '✗ REJECTED' :
                               'Modified'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              No Decision
                            </span>
                          )}
                        </Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'preferred' ? 'default' : 'outline'}
                              className={clause.partyBPreference === 'preferred' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'hover:bg-green-50 border-green-200'}
                              onClick={() => handleClauseUpdate(clause.clauseId._id, 'preferred')}
                              disabled={saving || agreement?.partyBUserId?.toString() !== user?.id?.toString()}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {clause.partyBPreference === 'preferred' ? '✓ Accepted' : 'Accept'}
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'acceptable' ? 'default' : 'outline'}
                              className={clause.partyBPreference === 'acceptable' ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'hover:bg-green-50 border-green-200'}
                              onClick={() => handleClauseUpdate(clause.clauseId._id, 'acceptable')}
                              disabled={saving || agreement?.partyBUserId?.toString() !== user?.id?.toString()}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {clause.partyBPreference === 'acceptable' ? '✓ Accepted' : 'Accept'}
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'unacceptable' ? 'destructive' : 'outline'}
                              className={clause.partyBPreference === 'unacceptable' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : 'hover:bg-red-50 border-red-200 text-red-600'}
                              onClick={() => handleClauseUpdate(clause.clauseId._id, 'unacceptable')}
                              disabled={saving || agreement?.partyBUserId?.toString() !== user?.id?.toString()}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {clause.partyBPreference === 'unacceptable' ? '✗ Rejected' : 'Reject'}
                            </Button>
                          </div>
                          {clause.partyBPreference && (
                            <div className={`p-3 rounded-lg ${
                              clause.partyBPreference === 'preferred' ? 'bg-green-50 border border-green-200' :
                              clause.partyBPreference === 'acceptable' ? 'bg-green-50 border border-green-200' :
                              'bg-red-50 border border-red-200'
                            }`}>
                              <p className="text-sm font-medium">
                                Party B: <span className="capitalize">
                                  {clause.partyBPreference === 'preferred' ? 'Accepted' :
                                   clause.partyBPreference === 'acceptable' ? 'Accepted' :
                                   'Rejected'}
                                </span>
                                {clause.partyBPreference === 'preferred' && ' ✅'}
                                {clause.partyBPreference === 'acceptable' && ' ✅'}
                                {clause.partyBPreference === 'unacceptable' && ' ❌'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        AI Suggestion
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateAISuggestion(clause._id)}
                        disabled={saving}
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        {aiSuggestions[clause._id] ? 'Regenerate' : 'Generate'} Suggestion
                      </Button>
                    </div>
                    {aiSuggestions[clause._id] && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-2">AI Recommendation</h4>
                            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                              {aiSuggestions[clause._id]}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Collaboration Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages */}
                <div className="h-96 overflow-y-auto space-y-4 border rounded-lg p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => {
                    const isPartyA = agreement?.userid?.toString() === user?.id?.toString()
                    const isMyMessage = (isPartyA && message.senderRole === 'partyA') || (!isPartyA && message.senderRole === 'partyB')
                      const isPartyAMessage = message.senderRole === 'partyA'
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            isMyMessage
                              ? 'bg-blue-500 text-white'
                                : isPartyAMessage
                                ? 'bg-green-100 text-green-900 border border-green-200'
                                : 'bg-gray-100 text-gray-900 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                isPartyAMessage ? 'bg-green-500' : 'bg-blue-500'
                              }`}></div>
                              <p className="text-sm font-medium">
                                {isPartyAMessage ? 'Party A' : 'Party B'} - {message.senderName}
                              </p>
                            </div>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                Digital Signatures
              </CardTitle>
              <CardDescription>
                Sign the agreement once all clauses are resolved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Signature Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${agreement.partyASignature ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Party A Signature: {agreement.partyASignature ? 'Signed' : 'Pending'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${agreement.partyBSignature ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Party B Signature: {agreement.partyBSignature ? 'Signed' : 'Pending'}</span>
                </div>
              </div>

              {/* Signature Input */}
              {(() => {
                const isPartyA = agreement?.userid?.toString() === user?.id?.toString()
                const signatureField = isPartyA ? 'partyASignature' : 'partyBSignature'
                return !agreement[signatureField]
              })() && (
                <div className="space-y-6">
                  {/* Stored Signature Display */}
                  {user?.signature?.url && (
                    <div className="space-y-2">
                      <Label>Your Stored Signature</Label>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <img 
                          src={user.signature.url} 
                          alt="Your signature" 
                          className="max-w-xs h-20 object-contain border rounded"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          This signature will be used for signing the agreement
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Signature Upload */}
                  <div className="space-y-2">
                    <Label>Upload Signature Image</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setSignatureFile(file)
                            handleSignatureUpload(file)
                          }
                        }}
                        className="hidden"
                        id="signature-upload"
                        disabled={isUploadingSignature}
                      />
                      <label
                        htmlFor="signature-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isUploadingSignature ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PenTool className="w-4 h-4" />
                        )}
                        {isUploadingSignature ? 'Uploading...' : 'Upload Signature Image'}
                      </label>
                      {signatureFile && (
                        <span className="text-sm text-green-600">
                          ✓ {signatureFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a PNG or JPG image of your signature (max 2MB)
                    </p>
                  </div>

                  {/* Text Signature Alternative */}
                  <div className="space-y-2">
                    <Label>Or Type Your Digital Signature</Label>
                    <div className="space-y-2">
                      <Textarea
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder="Type your full name as your digital signature..."
                        rows={3}
                        disabled={!!user?.signature?.url}
                      />
                      <p className="text-xs text-muted-foreground">
                        {user?.signature?.url 
                          ? "You have a stored signature image. Clear the image above to use text signature."
                          : "By typing your name above, you are providing your digital signature and agreeing to the terms of this agreement."
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Signature Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• All clauses must be agreed upon by both parties</li>
                      <li>• Your signature will be legally binding</li>
                      <li>• Both parties must sign before the agreement is complete</li>
                      <li>• You can use either a signature image or typed signature</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleSignAgreement}
                    disabled={(!signature.trim() && !user?.signature?.url) || !allClausesResolved}
                    className="w-full"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Sign Agreement
                  </Button>
                  
                  {!allClausesResolved && (
                    <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ All clauses must be resolved before signing
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Download Options */}
              {canDownloadPDF && (
                <div className="space-y-4">
                  <h4 className="font-medium text-center">Download Final Agreement</h4>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleDownloadPDF} size="lg" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    {/* <Button onClick={handleDownloadDOC} size="lg" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download DOC
                  </Button> */}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Choose your preferred format for the final agreement document
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Custom Clause Dialog */}
      {isAddClauseDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Add Custom Clause</CardTitle>
              <CardDescription>Add a new clause to this agreement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clause-name">Clause Name</Label>
                <Input
                  id="clause-name"
                  value={newClauseData.name}
                  onChange={(e) => setNewClauseData({ ...newClauseData, name: e.target.value })}
                  placeholder="Enter clause name"
                />
              </div>
              <div>
                <Label htmlFor="clause-description">Description</Label>
                <Textarea
                  id="clause-description"
                  value={newClauseData.description}
                  onChange={(e) => setNewClauseData({ ...newClauseData, description: e.target.value })}
                  placeholder="Enter clause description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="clause-category">Category</Label>
                <Input
                  id="clause-category"
                  value={newClauseData.category}
                  onChange={(e) => setNewClauseData({ ...newClauseData, category: e.target.value })}
                  placeholder="Enter category (e.g., Confidentiality, Liability)"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsAddClauseDialogOpen(false)
                    setNewClauseData({ name: "", description: "", category: "" })
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleAddCustomClause}
                  disabled={!newClauseData.name || !newClauseData.description || saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Clause
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
