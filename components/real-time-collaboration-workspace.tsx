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
import { getAgreementById, updateClausePreferences, updateSingleClausePreference, sendChatMessage, getChatMessages, updateAgreementStatus, downloadAgreementPDF } from "@/lib/agreements"
import { useAuth } from "@/components/auth-provider"

interface RealTimeCollaborationWorkspaceProps {
  agreementId: string
}

interface Clause {
  _id: string
  name?: string
  description?: string
  category?: string
  required?: boolean
  status?: string
  partyAPreference?: string
  partyBPreference?: string
  aiSuggestion?: string
  isResolved?: boolean
  clauseId?: {
    _id: string
    name: string
    category: string
    description: string
    required: boolean
    status: string
  }
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
  partyAEmail?: string
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
  agreementId?: string
  senderId: string
  senderName: string
  senderRole: 'partyA' | 'partyB' | 'system'
  message: string
  timestamp?: string
  createdAt?: string
  isAI?: boolean
  isSending?: boolean
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
  const [tempMessage, setTempMessage] = useState<ChatMessage | null>(null)
  const [isUpdatingClause, setIsUpdatingClause] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [customClauseText, setCustomClauseText] = useState("")
  const [customClauseName, setCustomClauseName] = useState("")
  const [showAddClause, setShowAddClause] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: string}>({})

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

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
      newSocket.emit('join-agreement', { 
        agreementId, 
        userId: user?.id,
        userName: user?.name || 'Unknown User'
      })
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
      
      // Increment unread count if chat is closed
      if (!isChatOpen) {
        setUnreadCount(prev => prev + 1)
      }
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

    // Typing indicators
    newSocket.on('user-typing', (data) => {
      if (String(data.userId) !== String(user?._id || user?.id)) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName]
          }
          return prev
        })
      }
    })

    newSocket.on('user-stopped-typing', (data) => {
      if (String(data.userId) !== String(user?._id || user?.id)) {
        setTypingUsers(prev => prev.filter(name => name !== data.userName))
      }
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
      // Stop typing before leaving
      if (isTyping) {
        newSocket.emit('typing-stop', { 
          agreementId, 
          userId: String(user?._id || user?.id || ''),
          userName: user?.name || 'Unknown User'
        })
      }
      
      // Leave the agreement room before closing
      newSocket.emit('leave-agreement', { 
        agreementId, 
        userId: user?.id,
        userName: user?.name || 'Unknown User'
      })
      newSocket.close()
    }
  }, [agreementId, user?.id, toast])

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0)
    }
  }, [isChatOpen])

  // Load chat messages when component mounts
  useEffect(() => {
    const loadChatMessages = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return

        const messages = await getChatMessages(token, agreementId)
        setChatMessages(messages)
      } catch (error) {
        console.error("Error loading chat messages:", error)
      }
    }

    if (agreementId) {
      loadChatMessages()
    }
  }, [agreementId])

  // Load agreement data
  useEffect(() => {
    console.log("=== COLLABORATION WORKSPACE EFFECT ===")
    console.log("Agreement ID:", agreementId)
    console.log("User from context:", user)
    console.log("User from localStorage:", localStorage.getItem('user'))
    
    const loadAgreement = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setError("No authentication token found")
          return
        }

        console.log("Loading agreement with ID:", agreementId)
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
  }, [agreementId, user]) // Add user as dependency

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  // Get user ID from multiple sources as fallback
  const storedUser = localStorage.getItem('user')
  const parsedUser = storedUser ? JSON.parse(storedUser) : null
  const userId = user?.id || parsedUser?._id || null
  const userIdStr = userId?.toString()
  
  // Check if user is party A or B - use string comparison for consistency
  const isPartyA = agreement?.userid?._id?.toString() === userIdStr
  const isPartyB = agreement?.partyBUserId?._id?.toString() === userIdStr
  const isAuthorized = isPartyA || isPartyB
  
  // Debug logging
  console.log('Debug - User ID:', userIdStr)
  console.log('Debug - Party A ID:', agreement?.userid?._id?.toString())
  console.log('Debug - Party B ID:', agreement?.partyBUserId?._id?.toString())
  console.log('Debug - isPartyA:', isPartyA)
  console.log('Debug - isPartyB:', isPartyB)
  console.log('Debug - isAuthorized:', isAuthorized)
  
  // If user is not loaded yet, show loading state
  if (!user && !parsedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading user information...</p>
        </div>
      </div>
    )
  }
  
  // If we still don't have a valid user ID, show error
  if (!userIdStr) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>Unable to load user information. Please try logging in again.</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // Debug authorization
  console.log("=== FRONTEND AUTHORIZATION DEBUG ===")
  console.log("Agreement exists:", !!agreement)
  console.log("User exists:", !!user)
  console.log("Agreement:", agreement)
  console.log("User:", user)
  console.log("Party A ID:", agreement?.userid?._id)
  console.log("Party B ID:", agreement?.partyBUserId?._id)
  console.log("Current User ID:", user?.id)
  console.log("User from localStorage:", localStorage.getItem('user'))
  console.log("Parsed user from localStorage:", parsedUser)
  console.log("Parsed user _id:", parsedUser?._id)
  console.log("User context id:", user?.id)
  console.log("Final User ID:", userId)
  console.log("Final User ID string:", userIdStr)
  console.log("Party A ID string:", agreement?.userid?._id?.toString())
  console.log("Party B ID string:", agreement?.partyBUserId?._id?.toString())
  console.log("String comparison Party A:", agreement?.userid?._id?.toString() === userIdStr)
  console.log("String comparison Party B:", agreement?.partyBUserId?._id?.toString() === userIdStr)
  console.log("Is Party A:", isPartyA)
  console.log("Is Party B:", isPartyB)
  console.log("Is Authorized:", isAuthorized)
  console.log("Party A ID type:", typeof agreement?.userid?._id)
  console.log("Party B ID type:", typeof agreement?.partyBUserId?._id)
  console.log("User ID type:", typeof user?.id)
  
  // Additional debugging for the specific case
  if (agreement && userId) {
    console.log("=== DETAILED COMPARISON ===")
    console.log("Party A ObjectId:", agreement.userid?._id)
    console.log("Party B ObjectId:", agreement.partyBUserId?._id)
    console.log("User ID from context:", user?.id)
    console.log("Final User ID:", userId)
    console.log("Direct comparison Party A:", agreement.userid?._id === userId)
    console.log("Direct comparison Party B:", agreement.partyBUserId?._id === userId)
    console.log("String comparison Party A:", agreement.userid?._id?.toString() === userIdStr)
    console.log("String comparison Party B:", agreement.partyBUserId?._id?.toString() === userIdStr)
  }

  // Handle clause preference update
  const handleClauseUpdate = async (clauseId: string, preference: string) => {
    if (!socket || !isAuthorized) return

    try {
      setIsUpdatingClause(clauseId)
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await updateSingleClausePreference(token, agreementId, clauseId, {
        [isPartyA ? 'partyAPreference' : 'partyBPreference']: preference
      })

      // Update local state immediately
      if (response && response.agreement) {
        setAgreement(response.agreement)
      } else {
        // Fallback: refresh agreement data if response doesn't contain updated agreement
        const updatedAgreement = await getAgreementById(token, agreementId)
        if (updatedAgreement) {
          setAgreement(updatedAgreement)
        }
      }

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

  // Handle typing indicator with debouncing
  const handleTyping = () => {
    if (!socket || !isAuthorized) return
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // If not currently typing, start typing
    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing-start', { 
        agreementId, 
        userId: String(user?._id || user?.id || ''), 
        userName: user?.name || (isPartyA ? (agreement?.userid?.name || 'Unknown') : (agreement?.partyBUserId?.name || 'Unknown'))
      })
    }
    
    // Set new timeout to stop typing (debounced)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('typing-stop', { 
        agreementId, 
        userId: String(user?._id || user?.id || ''),
        userName: user?.name || (isPartyA ? (agreement?.userid?.name || 'Unknown') : (agreement?.partyBUserId?.name || 'Unknown'))
      })
    }, 1500) // 1.5 seconds after last keystroke
  }

  // Stop typing indicator
  const stopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false)
      socket.emit('typing-stop', { 
        agreementId, 
        userId: String(user?._id || user?.id || ''),
        userName: user?.name || (isPartyA ? (agreement?.userid?.name || 'Unknown') : (agreement?.partyBUserId?.name || 'Unknown'))
      })
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = undefined
    }
  }

  // Handle chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socket || !isAuthorized) return

    // Stop typing when sending message
    stopTyping()

    const messageText = newMessage.trim()
    const tempMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      agreementId: agreementId,
      message: messageText,
      senderId: String(user?._id || user?.id || ''),
      senderName: user?.name || (isPartyA ? (agreement?.userid?.name || 'You') : (agreement?.partyBUserId?.name || 'You')),
      senderRole: isPartyA ? 'partyA' : 'partyB',
      createdAt: new Date().toISOString(),
      isSending: true
    }

    try {
      setSendingMessage(true)
      setTempMessage(tempMsg)
      setNewMessage("")
      
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const messageData = await sendChatMessage(
        token, 
        agreementId, 
        messageText, 
        isPartyA ? 'partyA' : 'partyB'
      )

      // Emit real-time message
      socket.emit('send-message', {
        agreementId,
        message: messageData.message,
        senderId: String(user?._id || user?.id || ''),
        senderName: user?.name || (isPartyA ? (agreement?.userid?.name || 'Unknown') : (agreement?.partyBUserId?.name || 'Unknown')),
        senderRole: isPartyA ? 'partyA' : 'partyB'
      })

      // Remove temp message
      setTempMessage(null)
    } catch (err: any) {
      console.error("Error sending message:", err)
      setTempMessage(null)
      setNewMessage(messageText) // Restore message on error
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
    if (!customClauseName.trim() || !customClauseText.trim() || !socket || !isAuthorized) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Call backend API to add custom clause
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/custom-clause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agreementId,
          name: customClauseName.trim(),
          description: customClauseText.trim(),
          category: "Custom"
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add custom clause')
      }

      const result = await response.json()
      console.log("Custom clause added:", result)

      setCustomClauseText("")
      setCustomClauseName("")
      setShowAddClause(false)
      
      // Refresh agreement data to get the new clause
      if (agreement) {
        const updatedAgreement = await getAgreementById(token, agreementId)
        setAgreement(updatedAgreement)
      }

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

  // Only show authorization error if we have both agreement and user data
  if (agreement && userIdStr && !isAuthorized) {
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
              {(isChatOpen ? chatMessages.length : unreadCount) > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {isChatOpen ? chatMessages.length : unreadCount}
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
            {/* Agreement Status and Party Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Badge 
                  variant={agreement.status === 'signed' ? 'default' : 'secondary'}
                  className="text-lg px-4 py-2"
                >
                  {agreement.status.toUpperCase()}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(agreement.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              {/* Party Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Agreement Parties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Party A (Creator):</span>
                    <p className="text-sm text-muted-foreground">
                      {agreement.userid?.name || 'Unknown'} ({agreement.userid?.email || 'No email'})
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Party B (Collaborator):</span>
                    <p className="text-sm text-muted-foreground">
                      {agreement.partyBUserId?.name || agreement.partyBEmail || 'Not yet joined'}
                    </p>
                  </div>
                </div>
              </div>
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
                      <div>
                        <Label htmlFor="custom-clause-name">Clause Name</Label>
                        <Input
                          id="custom-clause-name"
                          placeholder="Enter clause name..."
                          value={customClauseName}
                          onChange={(e) => setCustomClauseName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom-clause">Clause Description</Label>
                        <Textarea
                          id="custom-clause"
                          placeholder="Enter your custom clause description..."
                          value={customClauseText}
                          onChange={(e) => setCustomClauseText(e.target.value)}
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddCustomClause}
                          disabled={!customClauseName.trim() || !customClauseText.trim()}
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
              {agreement.clauses.map((clause: any, index) => {
  console.log("Clause:", index, clause); // ✅ now works correctly

  return (
    <Card key={clause._id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {clause.clauseId?.name || clause.name || 'Clause'}
              </CardTitle>
              <Badge variant={clause.clauseId?.required ? "destructive" : "secondary"}>
                {clause.clauseId?.required ? "Required" : "Optional"}
              </Badge>
            </div>
            <CardDescription className="mt-2 text-sm">
              {clause.clauseId?.description || clause.description || 'No description available'}
            </CardDescription>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Category: {clause.clauseId?.category || clause.category || 'General'}</span>
              <span>Status: {clause.clauseId?.status || clause.status || "Pending"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="outline">{clause.clauseId?.category || clause.category || 'General'}</Badge>
            {clause.partyAPreference && clause.partyBPreference ? (
              (clause.partyAPreference === 'acceptable' && clause.partyBPreference === 'acceptable') ? (
                <Badge className="bg-green-100 text-green-800 border border-green-300 font-semibold">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  BOTH AGREED
                </Badge>
              ) : (clause.partyAPreference === 'unacceptable' || clause.partyBPreference === 'unacceptable') ? (
                <Badge className="bg-red-100 text-red-800 border border-red-300 font-semibold">
                  <XCircle className="w-3 h-3 mr-1" />
                  REJECTED
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold">
                  <Clock className="w-3 h-3 mr-1" />
                  IN DISCUSSION
                </Badge>
              )
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold">
                <Clock className="w-3 h-3 mr-1" />
                PENDING
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Party Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                Party A {isPartyA ? "(You)" : ""}
                {clause.partyAPreference ? (
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    clause.partyAPreference === 'acceptable' ? 'bg-green-100 text-green-800 border border-green-200' :
                    clause.partyAPreference === 'unacceptable' ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {clause.partyAPreference === 'acceptable' ? '✓ ACCEPTED' :
                     clause.partyAPreference === 'unacceptable' ? '✗ REJECTED' :
                     'No Decision'}
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    No Decision
                  </span>
                )}
              </Label>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant={
                    clause.partyAPreference === "acceptable" ? "default" : "outline"
                  }
                  className={clause.partyAPreference === "acceptable" ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'hover:bg-green-50 border-green-200'}
                  onClick={() => handleClauseUpdate(clause.clauseId?._id || clause.clauseId, "acceptable")}
                  disabled={isUpdatingClause === (clause.clauseId?._id || clause.clauseId) || !isPartyA}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {clause.partyAPreference === "acceptable" ? '✓ Accepted' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant={
                    clause.partyAPreference === "unacceptable"
                      ? "destructive"
                      : "outline"
                  }
                  className={clause.partyAPreference === "unacceptable" ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : 'hover:bg-red-50 border-red-200 text-red-600'}
                  onClick={() => handleClauseUpdate(clause.clauseId?._id || clause.clauseId, "unacceptable")}
                  disabled={isUpdatingClause === (clause.clauseId?._id || clause.clauseId) || !isPartyA}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {clause.partyAPreference === "unacceptable" ? '✗ Rejected' : 'Reject'}
                </Button>
                {/* Modify button commented out - not needed */}
                {/* <Button
                  size="sm"
                  variant={
                    clause.partyAPreference === "modify"
                      ? "secondary"
                      : "outline"
                  }
                  onClick={() => handleClauseUpdate(clause.clauseId?._id || clause.clauseId, "modify")}
                  disabled={isUpdatingClause === (clause.clauseId?._id || clause.clauseId) || !isPartyA}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modify
                </Button> */}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                Party B {isPartyB ? "(You)" : ""}
                {clause.partyBPreference ? (
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    clause.partyBPreference === 'acceptable' ? 'bg-green-100 text-green-800 border border-green-200' :
                    clause.partyBPreference === 'unacceptable' ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {clause.partyBPreference === 'acceptable' ? '✓ ACCEPTED' :
                     clause.partyBPreference === 'unacceptable' ? '✗ REJECTED' :
                     'No Decision'}
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    No Decision
                  </span>
                )}
              </Label>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant={
                    clause.partyBPreference === "acceptable" ? "default" : "outline"
                  }
                  className={clause.partyBPreference === "acceptable" ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'hover:bg-green-50 border-green-200'}
                  onClick={() => handleClauseUpdate(clause.clauseId?._id || clause.clauseId, "acceptable")}
                  disabled={isUpdatingClause === (clause.clauseId?._id || clause.clauseId) || !isPartyB}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {clause.partyBPreference === "acceptable" ? '✓ Accepted' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant={
                    clause.partyBPreference === "unacceptable"
                      ? "destructive"
                      : "outline"
                  }
                  className={clause.partyBPreference === "unacceptable" ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : 'hover:bg-red-50 border-red-200 text-red-600'}
                  onClick={() => handleClauseUpdate(clause.clauseId?._id || clause.clauseId, "unacceptable")}
                  disabled={isUpdatingClause === (clause.clauseId?._id || clause.clauseId) || !isPartyB}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {clause.partyBPreference === "unacceptable" ? '✗ Rejected' : 'Reject'}
                </Button>
                {/* Modify button commented out - not needed */}
                {/* <Button
                  size="sm"
                  variant={
                    clause.partyBPreference === "modify"
                      ? "secondary"
                      : "outline"
                  }
                  onClick={() => handleClauseUpdate(clause.clauseId?._id || clause.clauseId, "modify")}
                  disabled={isUpdatingClause === (clause.clauseId?._id || clause.clauseId) || !isPartyB}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modify
                </Button> */}
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
  );
})}

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
                        disabled={Boolean(isPartyA && agreement.partyASignature) || Boolean(isPartyB && agreement.partyBSignature)}
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
              {/* Show loading state if user not loaded */}
              {!user && (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                  <p className="text-sm">Loading messages...</p>
                </div>
              )}
              
              {/* Show temporary message while sending */}
              {tempMessage && (
                <div className="w-full flex justify-end mb-3">
                  <div className="max-w-xs px-4 py-3 rounded-2xl bg-blue-500 text-white rounded-br-md opacity-70">
                    <p className="text-sm leading-relaxed">{tempMessage.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs opacity-70">Sending...</p>
                      <div className="flex items-center ml-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {user && Array.isArray(chatMessages) && chatMessages.map((message) => {
                // Ensure user ID is loaded before determining alignment
                const currentUserId = String(user?._id || user?.id || '')
                const messageSenderId = String(message.senderId || '')
                const isOwnMessage = currentUserId && messageSenderId && currentUserId === messageSenderId
                const messageTime = message.createdAt || message.timestamp
                const isPartyA = message.senderRole === 'partyA'
                
                
                // Get real names from agreement
                const getSenderName = () => {
                  if (message.senderName) return message.senderName
                  if (isPartyA) return agreement?.userid?.name || 'Party A'
                  return agreement?.partyBUserId?.name || 'Party B'
                }
                
                
                return (
                  <div
                    key={message._id}
                    className={`w-full flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div 
                      className={`max-w-xs px-4 py-3 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : message.senderRole === 'system'
                          ? 'bg-gray-200 text-gray-800 rounded-bl-md'
                          : isPartyA
                          ? 'bg-gray-100 text-gray-800 rounded-bl-md'
                          : 'bg-blue-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="flex items-center gap-2 mb-2">
                          {message.isAI ? (
                            <Bot className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          <span className="text-xs font-semibold">
                            {getSenderName()}
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-70">
                          {messageTime ? new Date(messageTime).toLocaleTimeString() : 'Just now'}
                        </p>
                        {isOwnMessage && (
                          <div className="flex items-center ml-2">
                            {message.isSending ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <CheckCircle className="w-3 h-3 text-green-300" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="w-full flex justify-start mb-3">
                  <div className="max-w-xs px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
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
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
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
