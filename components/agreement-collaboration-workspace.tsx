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
  required: boolean
  status: string
  partyAPreference?: string
  partyBPreference?: string
  aiSuggestion?: string
  isResolved?: boolean
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
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false)
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
        // Update clauses in real-time
        setClauses(prev => prev.map(clause => {
          const updatedClause = data.clauses.find((c: any) => c.clauseId.toString() === clause._id)
          return updatedClause ? { ...clause, ...updatedClause } : clause
        }))
      }
    })

    newSocket.on('agreement-status-updated', (data) => {
      console.log('Agreement status updated:', data)
      if (data.agreementId === agreementId) {
        setAgreement((prev: any) => prev ? { ...prev, status: data.status } : null)
      }
    })

    newSocket.on('new-chat-message', (data) => {
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

      const updatedClauses = clauses.map(clause => 
        clause._id === clauseId 
          ? { ...clause, [user?.role === 'admin' ? 'partyAPreference' : 'partyBPreference']: preference }
          : clause
      )

      await updateClausePreferences(token, agreementId, updatedClauses.map(clause => ({
        clauseId: clause._id,
        partyAPreference: clause.partyAPreference,
        partyBPreference: clause.partyBPreference
      })))
      setClauses(updatedClauses)

      // Emit real-time update
      if (socket) {
        socket.emit('clause-update', {
          agreementId,
          clauseId,
          preference,
          userRole: user?.role === 'admin' ? 'partyA' : 'partyB'
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

      const result = await sendChatMessage(token, agreementId, newMessage, user?.role === 'admin' ? 'partyA' : 'partyB')
      
      // Emit real-time message
      if (socket) {
        socket.emit('send-chat-message', {
          agreementId,
          message: newMessage,
          senderRole: user?.role === 'admin' ? 'partyA' : 'partyB',
          senderName: user?.name || 'Unknown User'
        })
      }

      setNewMessage("")
      fetchChatMessages()
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

      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Generate an AI suggestion for resolving this clause conflict. The clause is about: ${clauses.find(c => c._id === clauseId)?.name}`
        })
      })

      const data = await response.json()
      setAiSuggestions(prev => ({
        ...prev,
        [clauseId]: data.response
      }))

      toast({
        title: "AI Suggestion Generated",
        description: "AI has provided a suggestion for this clause",
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

  const handleSignAgreement = async () => {
    if (!signature.trim()) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Call sign agreement API
      const response = await fetch(`/api/agreement/${agreementId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signatureData: signature
        })
      })

      if (!response.ok) {
        throw new Error('Failed to sign agreement')
      }

      const result = await response.json()
      
      // Update local state
      setAgreement((prev: any) => prev ? {
        ...prev,
        partyASignature: user?.role === 'admin' ? signature : prev.partyASignature,
        partyBSignature: user?.role === 'admin' ? prev.partyBSignature : signature,
        status: result.agreement.status
      } : null)

      // Emit real-time update
      if (socket) {
        socket.emit('agreement-signed', {
          agreementId,
          signedBy: user?.role === 'admin' ? 'partyA' : 'partyB',
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
      const response = await fetch(`/api/agreement/${agreementId}/generate-pdf`, {
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

  const allClausesAgreed = clauses.every(clause => 
    clause.partyAPreference && clause.partyBPreference && 
    clause.partyAPreference === clause.partyBPreference
  )

  const canDownloadPDF = agreement?.status === 'signed' && 
                        agreement?.partyASignature && 
                        agreement?.partyBSignature &&
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
              <Button onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
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
            {clauses.map((clause) => (
              <Card key={clause._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{clause.name}</span>
                    {clause.partyAPreference && clause.partyBPreference && clause.partyAPreference === clause.partyBPreference ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Agreed
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending Agreement
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{clause.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Party Preferences */}
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Party A (You)</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'agree' ? 'default' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'agree')}
                              disabled={saving}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Agree
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'disagree' ? 'destructive' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'disagree')}
                              disabled={saving}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Disagree
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'modify' ? 'secondary' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'modify')}
                              disabled={saving}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Modify
                            </Button>
                          </div>
                          {clause.partyAPreference === 'modify' && (
                            <Textarea
                              value={clause.partyAPreference || ''}
                              onChange={(e) => handleClauseUpdate(clause._id, e.target.value)}
                              placeholder="Enter your modification..."
                              disabled={saving}
                              rows={3}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Party B</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'agree' ? 'default' : 'outline'}
                              disabled
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Agree
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'disagree' ? 'destructive' : 'outline'}
                              disabled
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Disagree
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'modify' ? 'secondary' : 'outline'}
                              disabled
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Modify
                            </Button>
                          </div>
                          {clause.partyBPreference && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">{clause.partyBPreference}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>AI Suggestion</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateAISuggestion(clause._id)}
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Generate Suggestion
                      </Button>
                    </div>
                    {aiSuggestions[clause._id] && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm">{aiSuggestions[clause._id]}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  {chatMessages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.senderRole === (user?.role === 'admin' ? 'partyA' : 'partyB') ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          message.senderRole === (user?.role === 'admin' ? 'partyA' : 'partyB')
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm font-medium">{message.senderName}</p>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
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
              {!agreement[user?.role === 'admin' ? 'partyASignature' : 'partyBSignature'] && (
                <div className="space-y-4">
                  <div>
                    <Label>Your Digital Signature</Label>
                    <div className="space-y-2">
                      <Textarea
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder="Type your full name as your digital signature..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        By typing your name above, you are providing your digital signature and agreeing to the terms of this agreement.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Signature Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• All clauses must be agreed upon by both parties</li>
                      <li>• Your signature will be legally binding</li>
                      <li>• Both parties must sign before the agreement is complete</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleSignAgreement}
                    disabled={!signature.trim() || !allClausesResolved}
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

              {/* Download PDF */}
              {canDownloadPDF && (
                <div className="text-center">
                  <Button onClick={handleDownloadPDF} size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download Final Agreement PDF
                  </Button>
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
