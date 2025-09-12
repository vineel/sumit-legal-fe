"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "@/components/auth-provider"

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

  // Initialize Socket.io connection
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      transports: ['websocket', 'polling']
    })
    setSocket(newSocket)

    // Join user's notification room
    newSocket.emit('join-notifications', user.id)

    // Listen for notifications based on user role
    newSocket.on('notification', (notification: Notification) => {
      // Only show notifications relevant to this user
      if (notification.userId === user.id || notification.role === user.role || notification.role === 'all') {
        setNotifications(prev => [notification, ...prev])
      }
    })

    // Role-based notifications
    if (user.role === 'admin') {
      // Admin notifications
      newSocket.on('user-registered', (data) => {
        const notification: Notification = {
          _id: `user-reg-${data.userId}-${Date.now()}`,
          type: 'agreement_created',
          title: 'New User Registration',
          message: `${data.userName} (${data.userEmail}) has registered and needs approval`,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })

      newSocket.on('agreement-created', (data) => {
        const notification: Notification = {
          _id: `agreement-created-${data.agreementId}-${Date.now()}`,
          type: 'agreement_created',
          title: 'New Agreement Created',
          message: `A new agreement has been created by ${data.userName}`,
          agreementId: data.agreementId,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })
    } else {
      // User notifications
      newSocket.on('invitation-received', (data) => {
        const notification: Notification = {
          _id: `invitation-${data.agreementId}-${Date.now()}`,
          type: 'invitation_received',
          title: 'New Invitation',
          message: `${data.senderName} has invited you to collaborate on an agreement`,
          agreementId: data.agreementId,
          senderId: data.senderId,
          senderName: data.senderName,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })

      newSocket.on('agreement-updated', (data) => {
        const notification: Notification = {
          _id: `agreement-updated-${data.agreementId}-${Date.now()}`,
          type: 'agreement_updated',
          title: 'Agreement Updated',
          message: `The agreement has been updated by ${data.updatedBy}`,
          agreementId: data.agreementId,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })

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

      newSocket.on('agreement-signed', (data) => {
        const notification: Notification = {
          _id: `agreement-signed-${data.agreementId}-${Date.now()}`,
          type: 'agreement_signed',
          title: 'Agreement Signed',
          message: `The agreement has been signed by ${data.signedBy}`,
          agreementId: data.agreementId,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })
    }

    return () => {
      newSocket.disconnect()
    }
  }, [isAuthenticated, user])

  // Reset notifications when user logs out
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([])
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }
  }, [isAuthenticated, user, socket])

  // Load existing notifications
  useEffect(() => {
    if (!isAuthenticated || !user || typeof window === 'undefined') return

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

  const contextValue: NotificationContextType = {
    notifications: isAuthenticated && user ? notifications : [],
    unreadCount: isAuthenticated && user ? unreadCount : 0,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}