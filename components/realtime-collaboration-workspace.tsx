"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Send,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react"
import { 
  getAgreementById, 
  updateClausePreferences, 
  sendChatMessage, 
  getChatMessages,
  downloadAgreementPDF,
  updateAgreementStatus
} from "@/lib/agreements"
import { io, Socket } from "socket.io-client"

interface Clause {
  _id: string
  title: string
  description: string
  partyAPreference: string
  partyBPreference: string
  status: 'agreed' | 'negotiating' | 'conflict'
}

interface ChatMessage {
  _id: string
  message: string
  senderId: string
  senderName: string
  senderRole: 'partyA' | 'partyB'
  createdAt: string
  isAI?: boolean
}

interface Agreement {
  _id: string
  status: string
  partyAName: string
  partyBName: string
  partyAEmail: string
  partyBEmail: string
  clauses: Clause[]
  effectiveDate: string
  termDuration: string
  jurisdiction: string
}

export function RealtimeCollaborationWorkspace() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const agreementId = searchParams.get("agreementId")
  
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [clauses, setClauses] = useState<Clause[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize Socket.io connection
  useEffect(() => {
    if (!agreementId) return

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      transports: ['websocket', 'polling']
    })
    setSocket(newSocket)

    // Join agreement room
    newSocket.emit('join-agreement', agreementId)

    // Listen for real-time updates
    newSocket.on('clause-updated', (data) => {
      if (data.agreementId === agreementId) {
        setClauses(data.clauses)
      }
    })

    newSocket.on('receive-message', (data) => {
      if (data.agreementId === agreementId) {
        setMessages(prev => [...prev, data])
        scrollToBottom()
      }
    })

    newSocket.on('agreement-status-updated', (data) => {
      if (data.agreementId === agreementId) {
        setAgreement(prev => prev ? { ...prev, status: data.status } : null)
      }
    })

    newSocket.on('user-typing', (data) => {
      if (data.agreementId === agreementId) {
        setTypingUsers(data.users)
      }
    })

    newSocket.on('user-stopped-typing', (data) => {
      if (data.agreementId === agreementId) {
        setTypingUsers(prev => prev.filter(user => user !== data.userId))
      }
    })

    return () => {
      newSocket.emit('leave-agreement', agreementId)
      newSocket.disconnect()
    }
  }, [agreementId])

  // Load agreement data
  useEffect(() => {
    if (!agreementId) return

    const loadAgreement = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setError("No authentication token found")
          return
        }

        const [agreementData, messagesData] = await Promise.all([
          getAgreementById(token, agreementId),
          getChatMessages(token, agreementId)
        ])

        setAgreement(agreementData)
        setClauses(agreementData.clauses || [])
        setMessages(messagesData.messages || [])
      } catch (err) {
        console.error("Error loading agreement:", err)
        setError("Failed to load agreement data")
      } finally {
        setLoading(false)
      }
    }

    loadAgreement()
  }, [agreementId])

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !agreementId) return

    setIsTyping(true)
    socket.emit('user-typing', { agreementId, userId: user?.id })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('user-stopped-typing', { agreementId, userId: user?.id })
    }, 1000)
  }

  // Send chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socket || !agreementId) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Determine sender role
      const isPartyA = agreement?.partyAEmail === user?.email
      const senderRole = isPartyA ? 'partyA' : 'partyB'

      await sendChatMessage(token, agreementId, newMessage, senderRole)
      
      // Emit real-time message
      socket.emit('send-message', {
        agreementId,
        message: newMessage,
        senderId: user?.id,
        senderName: user?.name,
        senderRole,
        timestamp: new Date().toISOString()
      })

      setNewMessage("")
      setIsTyping(false)
      socket.emit('user-stopped-typing', { agreementId, userId: user?.id })
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }

  // Update clause preference
  const handleClauseUpdate = async (clauseId: string, preference: string) => {
    if (!agreementId) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const isPartyA = agreement?.partyAEmail === user?.email
      const updatedClauses = clauses.map(clause => {
        if (clause._id === clauseId) {
          return {
            ...clause,
            [isPartyA ? 'partyAPreference' : 'partyBPreference']: preference
          }
        }
        return clause
      })

      await updateClausePreferences(token, agreementId, updatedClauses.map(clause => ({
        clauseId: clause._id,
        partyAPreference: clause.partyAPreference,
        partyBPreference: clause.partyBPreference
      })))

      // Emit real-time update
      if (socket) {
        socket.emit('update-clause', {
          agreementId,
          clauses: updatedClauses,
          updatedBy: user?.id
        })
      }
    } catch (err) {
      console.error("Error updating clause:", err)
    }
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!agreementId) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const downloadUrl = await downloadAgreementPDF(token, agreementId)
      window.open(downloadUrl, '_blank')
    } catch (err) {
      console.error("Error downloading PDF:", err)
    }
  }

  // Check if all clauses are agreed
  const allClausesAgreed = clauses.every(clause => 
    clause.partyAPreference === clause.partyBPreference && 
    clause.partyAPreference === 'preferred'
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading collaboration workspace...</p>
        </div>
      </div>
    )
  }

  if (error || !agreement) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
            <CardDescription>
              {error || "Agreement not found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold">Agreement Collaboration</h1>
              <p className="text-sm text-muted-foreground">
                {agreement.partyAName} ↔ {agreement.partyBName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  {onlineUsers.length} online
                </span>
              </div>
              <Button onClick={handleDownloadPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="clauses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clauses">Clauses</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* Clauses Tab */}
          <TabsContent value="clauses" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Clauses List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Clause Negotiation</h3>
                {clauses.map((clause, index) => {
                  const isAgreed = clause.partyAPreference === clause.partyBPreference
                  const status = isAgreed ? 'agreed' : 'negotiating'
                  
                  return (
                    <Card key={clause._id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{clause.title}</CardTitle>
                          <Badge 
                            variant={status === 'agreed' ? 'default' : 'secondary'}
                            className={
                              status === 'agreed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {status === 'agreed' ? 'Agreed' : 'Negotiating'}
                          </Badge>
                        </div>
                        <CardDescription>{clause.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Your Preference</label>
                          <select
                            value={agreement.partyAEmail === user?.email ? clause.partyAPreference : clause.partyBPreference}
                            onChange={(e) => handleClauseUpdate(clause._id, e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="preferred">Preferred</option>
                            <option value="acceptable">Acceptable</option>
                            <option value="unacceptable">Unacceptable</option>
                          </select>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Party A: {clause.partyAPreference}</p>
                          <p>Party B: {clause.partyBPreference}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Agreement Status */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Agreement Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge variant="outline">{agreement.status}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Effective Date</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(agreement.effectiveDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Term Duration</span>
                      <span className="text-sm text-muted-foreground">
                        {agreement.termDuration || 'Not specified'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Jurisdiction</span>
                      <span className="text-sm text-muted-foreground">
                        {agreement.jurisdiction || 'Not specified'}
                      </span>
                    </div>

                    {allClausesAgreed && (
                      <Alert>
                        <CheckCircle className="w-4 h-4" />
                        <AlertDescription>
                          All clauses have been agreed! You can now sign and download the final agreement.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Real-time Chat
                </CardTitle>
                <CardDescription>
                  Discuss clauses and negotiate terms with AI assistance
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName}
                          </span>
                          {message.isAI && (
                            <Badge variant="secondary" className="text-xs">
                              AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="flex-1"
                    rows={2}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
