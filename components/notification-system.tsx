"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Users, 
  MessageSquare,
  Download,
  X,
  Eye
} from "lucide-react"

interface Notification {
  _id: string
  type: 'agreement_created' | 'agreement_updated' | 'message_received' | 'agreement_signed' | 'invitation_received'
  title: string
  message: string
  agreementId?: string
  senderId?: string
  senderName?: string
  isRead: boolean
  createdAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Notification) => void
  removeNotification: (notificationId: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)

  // Initialize Socket.io connection
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      transports: ['websocket', 'polling']
    })
    setSocket(newSocket)

    // Join user's notification room
    newSocket.emit('join-notifications', user.id)

    // Listen for notifications
    newSocket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
    })

    // Listen for agreement updates
    newSocket.on('agreement-updated', (data) => {
      const notification: Notification = {
        _id: `agreement-${data.agreementId}-${Date.now()}`,
        type: 'agreement_updated',
        title: 'Agreement Updated',
        message: `Agreement ${data.agreementId} has been updated`,
        agreementId: data.agreementId,
        isRead: false,
        createdAt: new Date().toISOString()
      }
      setNotifications(prev => [notification, ...prev])
    })

    // Listen for new messages
    newSocket.on('message-received', (data) => {
      const notification: Notification = {
        _id: `message-${data.messageId}-${Date.now()}`,
        type: 'message_received',
        title: 'New Message',
        message: `${data.senderName}: ${data.message}`,
        agreementId: data.agreementId,
        senderId: data.senderId,
        senderName: data.senderName,
        isRead: false,
        createdAt: new Date().toISOString()
      }
      setNotifications(prev => [notification, ...prev])
    })

    // Listen for agreement signed
    newSocket.on('agreement-signed', (data) => {
      const notification: Notification = {
        _id: `signed-${data.agreementId}-${Date.now()}`,
        type: 'agreement_signed',
        title: 'Agreement Signed',
        message: `Agreement ${data.agreementId} has been signed by all parties`,
        agreementId: data.agreementId,
        isRead: false,
        createdAt: new Date().toISOString()
      }
      setNotifications(prev => [notification, ...prev])
    })

    return () => {
      newSocket.disconnect()
    }
  }, [isAuthenticated, user])

  // Load existing notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return

        // In real implementation, this would call an API
        // For now, we'll use mock data
        const mockNotifications: Notification[] = [
          {
            _id: '1',
            type: 'agreement_created',
            title: 'New Agreement Created',
            message: 'You have created a new NDA agreement',
            agreementId: 'agreement-123',
            isRead: false,
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            type: 'invitation_received',
            title: 'Invitation Received',
            message: 'John Doe has invited you to collaborate on an agreement',
            agreementId: 'agreement-456',
            senderName: 'John Doe',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]

        setNotifications(mockNotifications)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    loadNotifications()
  }, [isAuthenticated, user])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
  }

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification._id !== notificationId)
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'agreement_created':
        return <FileText className="w-4 h-4" />
      case 'agreement_updated':
        return <AlertCircle className="w-4 h-4" />
      case 'message_received':
        return <MessageSquare className="w-4 h-4" />
      case 'agreement_signed':
        return <CheckCircle className="w-4 h-4" />
      case 'invitation_received':
        return <Users className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'agreement_created':
        return 'text-blue-600'
      case 'agreement_updated':
        return 'text-yellow-600'
      case 'message_received':
        return 'text-green-600'
      case 'agreement_signed':
        return 'text-green-600'
      case 'invitation_received':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Bell */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-12 h-12 rounded-full"
          size="icon"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-card border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  onClick={() => setShowNotifications(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification._id)
                    if (notification.agreementId) {
                      // Navigate to agreement
                      window.location.href = `/collaboration?agreementId=${notification.agreementId}`
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${getNotificationColor(notification.type)} mt-1`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification._id)
                      }}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}
