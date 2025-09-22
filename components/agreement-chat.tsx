"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Send, 
  Loader2,
  AlertCircle,
  Minimize2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { io, Socket } from 'socket.io-client'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
  isOwn: boolean
}

interface AgreementChatProps {
  agreementId: string
  currentUserId: string
  otherPartyName: string
}

export function AgreementChat({ agreementId, currentUserId, otherPartyName }: AgreementChatProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize socket connection
  useEffect(() => {
    if (!agreementId || !currentUserId) return

    console.log('🔌 Initializing socket connection for agreement:', agreementId)
    
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: {
        token: localStorage.getItem('auth_token'),
        agreementId: agreementId,
        userId: currentUserId
      },
      transports: ['websocket', 'polling']
    })

    setSocket(newSocket)

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server')
      setIsConnected(true)
      setError(null)
      newSocket.emit('join-agreement-chat', { agreementId })
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
      setError('Failed to connect to chat server')
      setIsConnected(false)
    })

    // Chat events
    newSocket.on('message-received', (message: ChatMessage) => {
      console.log('📨 Message received:', message)
      const messageWithOwnership = {
        ...message,
        isOwn: message.senderId === currentUserId
      }
      setMessages(prev => [...prev, messageWithOwnership])
      
      if (!isOpen && message.senderId !== currentUserId) {
        setUnreadCount(prev => prev + 1)
      }
    })

    newSocket.on('chat-history', (history: ChatMessage[]) => {
      console.log('📚 Chat history loaded:', history.length, 'messages')
      const historyWithOwnership = history.map(message => ({
        ...message,
        isOwn: message.senderId === currentUserId
      }))
      setMessages(historyWithOwnership)
      setIsLoading(false)
    })

    newSocket.on('user-joined', (data: { userId: string, userName: string }) => {
      console.log('👤 User joined chat:', data.userName)
      toast({
        title: "User Joined",
        description: `${data.userName} joined the chat`,
        duration: 3000
      })
    })

    newSocket.on('user-left', (data: { userId: string, userName: string }) => {
      console.log('👤 User left chat:', data.userName)
      toast({
        title: "User Left",
        description: `${data.userName} left the chat`,
        duration: 3000
      })
    })

    return () => {
      console.log('🔌 Cleaning up socket connection')
      newSocket.disconnect()
    }
  }, [agreementId, currentUserId, toast])

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !isConnected) return

    const messageData = {
      agreementId,
      message: newMessage.trim(),
      timestamp: new Date()
    }

    try {
      socket.emit('send-message', messageData)
      setNewMessage('')
    } catch (error) {
      console.error('❌ Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setUnreadCount(0)
    }
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Chat Button */}
      <Button
        onClick={toggleChat}
        className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Agreement Chat</h3>
                <p className="text-xs text-primary-foreground/70">with {otherPartyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-primary-foreground/70">
                  {isConnected ? "Online" : "Offline"}
                </span>
              </div>
              <Button
                onClick={toggleChat}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {error ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-600 mb-1">Chat Unavailable</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 min-h-0 bg-gray-50">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="text-center">
                        <MessageCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No messages yet</p>
                        <p className="text-xs text-muted-foreground">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((message) => {
                        const isMyMessage = message.senderId === currentUserId
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                isMyMessage
                                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                                  : 'bg-muted text-muted-foreground rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                              <p className={`text-xs mt-1 ${isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t p-3 flex-shrink-0 bg-white">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={!isConnected}
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Connecting to chat server...
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
