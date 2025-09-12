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
  Edit,
  ChevronRight,
  ChevronLeft,
  User,
  Bot
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAgreementById, updateClausePreferences, sendChatMessage, getChatMessages, updateAgreementStatus, downloadAgreementPDF } from "@/lib/agreements"
import { useAuth } from "@/components/auth-provider"

interface RealTimeCollaborationWorkspaceProps {
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

interface Agreement {
  _id: string
  templateId: {
    _id: string
    templatename: string
    description: string
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
  partyAEmail: string
  partyBEmail?: string
  status: string
  clauses: Clause[]
  partyASignature?: string
  partyBSignature?: string
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  _id: string
  agreementId: string
  senderId: string
  senderName: string
  senderRole: 'partyA' | 'partyB' | 'system'
  message: string
  timestamp: string
  isAI?: boolean
}

export function RealTimeCollaborationWorkspace({ agreementId }: RealTimeCollaborationWorkspaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isUpdatingClause, setIsUpdatingClause] = useState<string | null>(null)
  const [customClauseText, setCustomClauseText] = useState("")
  const [showAddClause, setShowAddClause] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: string}>({})

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'
    console.log("Connecting to socket:", socketUrl)
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log("✅ Socket connected:", newSocket.id)
      setIsConnected(true)
      
      // Join the agreement room
      newSocket.emit('join-agreement', { agreementId, userId: user?.id })
    })

    newSocket.on('disconnect', () => {
      console.log("❌ Socket disconnected")
      setIsConnected(false)
    })

    newSocket.on('user-joined', (data) => {
      console.log("User joined:", data)
      setOnlineUsers(prev => [...prev.filter(id => id !== data.userId), data.userId])
      toast({
        title: "User Joined",
        description: `${data.userName} joined the collaboration`,
        variant: "default"
      })
    })

    newSocket.on('user-left', (data) => {
      console.log("User left:", data)
      setOnlineUsers(prev => prev.filter(id => id !== data.userId))
      toast({
        title: "User Left",
        description: `${data.userName} left the collaboration`,
        variant: "default"
      })
    })

    newSocket.on('message', (message: ChatMessage) => {
      console.log("New message received:", message)
      setChatMessages(prev => [...prev, message])
    })

    newSocket.on('clause-updated', (data) => {
      console.log("Clause updated:", data)
      setAgreement(prev => {
        if (!prev) return prev
        return {
          ...prev,
          clauses: prev.clauses.map(clause => 
            clause._id === data.clauseId 
              ? { ...clause, ...data.updates }
              : clause
          )
        }
      })
    })

    newSocket.on('agreement-status-change', (data) => {
      console.log("Agreement status changed:", data)
      setAgreement(prev => prev ? { ...prev, status: data.status } : null)
      toast({
        title: "Agreement Status Updated",
        description: `Status changed to: ${data.status}`,
        variant: "default"
      })
    })

    newSocket.on('agreement-signed', (data) => {
      console.log("Agreement signed:", data)
      setAgreement(prev => prev ? { 
        ...prev, 
        partyASignature: data.partyASignature || prev.partyASignature,
        partyBSignature: data.partyBSignature || prev.partyBSignature
      } : null)
      toast({
        title: "Agreement Signed",
        description: "The agreement has been signed by both parties",
        variant: "default"
      })
    })

    newSocket.on('custom-clause-added', (data) => {
      console.log("Custom clause added:", data)
      setAgreement(prev => prev ? {
        ...prev,
        clauses: [...prev.clauses, data.clause]
      } : null)
      toast({
        title: "Custom Clause Added",
        description: "A new clause has been added to the agreement",
        variant: "default"
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [agreementId, user?.id, toast])

  // Load agreement data
  useEffect(() => {
    const loadAgreement = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setError("No authentication token found")
          return
        }

        const agreementData = await getAgreementById(token, agreementId)
        console.log("Agreement loaded:", agreementData)
        setAgreement(agreementData)

        // Load chat messages
        try {
          const messagesData = await getChatMessages(token, agreementId)
          console.log("Chat messages data:", messagesData)
          setChatMessages(Array.isArray(messagesData.messages) ? messagesData.messages : [])
        } catch (chatError) {
          console.error("Error loading chat messages:", chatError)
          setChatMessages([]) // Set empty array as fallback
        }
      } catch (err: any) {
        console.error("Error loading agreement:", err)
        setError(err.message || "Failed to load agreement")
      } finally {
        setLoading(false)
      }
    }

    if (agreementId) {
      loadAgreement()
    }
  }, [agreementId])

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  // Check if user is party A or B
  const isPartyA = agreement?.userid?._id === user?.id
  const isPartyB = agreement?.partyBUserId?._id === user?.id
  const isAuthorized = isPartyA || isPartyB

  // Handle clause preference update
  const handleClauseUpdate = async (clauseId: string, preference: string) => {
    if (!socket || !isAuthorized) return

    try {
      setIsUpdatingClause(clauseId)
      const token = localStorage.getItem("auth_token")
      if (!token) return

      await updateClausePreferences(token, agreementId, clauseId, {
        [isPartyA ? 'partyAPreference' : 'partyBPreference']: preference
      })

      // Emit real-time update
      socket.emit('update-clause', {
        agreementId,
        clauseId,
        updates: {
          [isPartyA ? 'partyAPreference' : 'partyBPreference']: preference
        }
      })

      toast({
        title: "Preference Updated",
        description: "Your preference has been saved",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error updating clause:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update preference",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingClause(null)
    }
  }

  // Handle chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socket || !isAuthorized) return

    try {
      setSendingMessage(true)
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const messageData = await sendChatMessage(token, agreementId, {
        message: newMessage.trim(),
        senderRole: isPartyA ? 'partyA' : 'partyB'
      })

      // Emit real-time message
      socket.emit('send-message', {
        agreementId,
        message: messageData.message,
        senderId: user?.id,
        senderName: user?.name || 'Unknown',
        senderRole: isPartyA ? 'partyA' : 'partyB'
      })

      setNewMessage("")
    } catch (err: any) {
      console.error("Error sending message:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle agreement signing
  const handleSignAgreement = async () => {
    if (!socket || !isAuthorized) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      await updateAgreementStatus(token, agreementId, 'signed')

      // Emit real-time signature
      socket.emit('agreement-signed', {
        agreementId,
        [isPartyA ? 'partyASignature' : 'partyBSignature']: new Date().toISOString()
      })

      toast({
        title: "Agreement Signed",
        description: "Your signature has been recorded",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error signing agreement:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to sign agreement",
        variant: "destructive"
      })
    }
  }

  // Handle custom clause addition
  const handleAddCustomClause = async () => {
    if (!customClauseText.trim() || !socket || !isAuthorized) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const newClause = {
        _id: `custom_${Date.now()}`,
        name: "Custom Clause",
        description: customClauseText.trim(),
        category: "Custom",
        required: false,
        status: "pending",
        partyAPreference: "pending",
        partyBPreference: "pending"
      }

      // Emit real-time custom clause
      socket.emit('custom-clause-added', {
        agreementId,
        clause: newClause
      })

      setCustomClauseText("")
      setShowAddClause(false)
      toast({
        title: "Custom Clause Added",
        description: "A new clause has been added to the agreement",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error adding custom clause:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to add custom clause",
        variant: "destructive"
      })
    }
  }

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      await downloadAgreementPDF(token, agreementId)
      toast({
        title: "PDF Downloaded",
        description: "The agreement PDF has been downloaded",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error downloading PDF:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to download PDF",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading agreement...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>Agreement not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>You are not authorized to view this agreement</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{agreement.templateId.templatename}</h1>
              <p className="text-gray-600">{agreement.templateId.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Online Users */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {onlineUsers.length + 1} online
              </span>
            </div>

            {/* Chat Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="relative"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
              {chatMessages.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {chatMessages.length}
                </span>
              )}
            </Button>

            {/* Download PDF */}
            {agreement.status === 'signed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-80' : 'mr-0'}`}>
          <div className="p-6 max-w-4xl mx-auto">
            {/* Agreement Status */}
            <div className="mb-6">
              <Badge 
                variant={agreement.status === 'signed' ? 'default' : 'secondary'}
                className="text-lg px-4 py-2"
              >
                {agreement.status.toUpperCase()}
              </Badge>
            </div>

            {/* Clauses */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Agreement Clauses</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddClause(!showAddClause)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Clause
                </Button>
              </div>

              {/* Add Custom Clause */}
              {showAddClause && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Label htmlFor="custom-clause">Custom Clause</Label>
                      <Textarea
                        id="custom-clause"
                        placeholder="Enter your custom clause..."
                        value={customClauseText}
                        onChange={(e) => setCustomClauseText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddCustomClause}
                          disabled={!customClauseText.trim()}
                        >
                          Add Clause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddClause(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clauses List */}
              {agreement.clauses.map((clause, index) => (
                <Card key={clause._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{clause.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {clause.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{clause.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Party Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Party A {isPartyA ? '(You)' : ''}
                          </Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'accepted' ? 'default' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'accepted')}
                              disabled={isUpdatingClause === clause._id || !isPartyA}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'rejected' ? 'destructive' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'rejected')}
                              disabled={isUpdatingClause === clause._id || !isPartyA}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyAPreference === 'modify' ? 'secondary' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'modify')}
                              disabled={isUpdatingClause === clause._id || !isPartyA}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Modify
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Party B {isPartyB ? '(You)' : ''}
                          </Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'accepted' ? 'default' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'accepted')}
                              disabled={isUpdatingClause === clause._id || !isPartyB}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'rejected' ? 'destructive' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'rejected')}
                              disabled={isUpdatingClause === clause._id || !isPartyB}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant={clause.partyBPreference === 'modify' ? 'secondary' : 'outline'}
                              onClick={() => handleClauseUpdate(clause._id, 'modify')}
                              disabled={isUpdatingClause === clause._id || !isPartyB}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Modify
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* AI Suggestions */}
                      {aiSuggestions[clause._id] && (
                        <Alert>
                          <Lightbulb className="w-4 h-4" />
                          <AlertDescription>
                            <strong>AI Suggestion:</strong> {aiSuggestions[clause._id]}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sign Agreement */}
            {agreement.status === 'accepted' && (
              <div className="mt-8">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Ready to Sign?</h3>
                      <p className="text-gray-600 mb-4">
                        Both parties have accepted the agreement. You can now sign it.
                      </p>
                      <Button
                        onClick={handleSignAgreement}
                        disabled={isPartyA && agreement.partyASignature || isPartyB && agreement.partyBSignature}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        Sign Agreement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Animated Chat Sidebar */}
        <div className={`fixed right-0 top-20 bottom-0 w-80 bg-white border-l shadow-lg transform transition-transform duration-300 ease-in-out ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Collaboration Chat</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatOpen(false)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {onlineUsers.length + 1} user{onlineUsers.length + 1 !== 1 ? 's' : ''} online
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Array.isArray(chatMessages) && chatMessages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === user?.id
                      ? 'bg-blue-500 text-white'
                      : message.senderRole === 'system'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {message.isAI ? (
                        <Bot className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      <span className="text-xs font-medium">
                        {message.senderName}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* No messages state */}
              {Array.isArray(chatMessages) && chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={sendingMessage}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  size="sm"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
