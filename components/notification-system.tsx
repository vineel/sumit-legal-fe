"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "@/components/auth-provider"

interface Notification {
  _id: string
  type: 'agreement_created' | 'agreement_updated' | 'message_received' | 'agreement_signed' | 'invitation_received' | 'user_registered' | 'user_approved' | 'user_rejected' | 'template_created' | 'clause_created' | 'system_alert'
  title: string
  message: string
  agreementId?: string
  senderId?: string
  senderName?: string
  userId?: string
  userName?: string
  userEmail?: string
  isRead: boolean
  createdAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearAllNotifications: () => void
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
  const { user } = useAuth()
  const isAuthenticated = !!user
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)

  // Initialize Socket.io connection
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ['websocket', 'polling']
    })
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    // Join user's notification room
    newSocket.emit('join-notifications', user.id)
    console.log('Emitted join-notifications for user:', user.id)

    // Listen for notifications based on user role
    newSocket.on('notification', (notification: Notification) => {
      // Only show notifications relevant to this user
      if (notification.userId === user.id || !notification.userId) {
        setNotifications(prev => [notification, ...prev])
      }
    })

    // Role-based notifications
    if (user.role === 'admin') {
      console.log('Setting up admin notifications for user:', user.id)
      
      // Admin notifications
      newSocket.on('user-registered', (data) => {
        console.log('Received user-registered notification:', data)
        const notification: Notification = {
          _id: `user-reg-${data.userId}-${Date.now()}`,
          type: 'user_registered',
          title: 'New User Registration',
          message: `${data.userName} (${data.userEmail}) has registered and needs approval`,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })

      newSocket.on('user-approved', (data) => {
        const notification: Notification = {
          _id: `user-approved-${data.userId}-${Date.now()}`,
          type: 'user_approved',
          title: 'User Approved',
          message: `${data.userName} has been approved and can now access the platform`,
          userId: data.userId,
          userName: data.userName,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })

      newSocket.on('user-rejected', (data) => {
        const notification: Notification = {
          _id: `user-rejected-${data.userId}-${Date.now()}`,
          type: 'user_rejected',
          title: 'User Rejected',
          message: `${data.userName} has been rejected`,
          userId: data.userId,
          userName: data.userName,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })

      newSocket.on('template-created', (data) => {
        const notification: Notification = {
          _id: `template-created-${data.templateId}-${Date.now()}`,
          type: 'template_created',
          title: 'New Template Created',
          message: `A new template "${data.templateName}" has been created`,
          isRead: false,
          createdAt: new Date().toISOString()
        }
        setNotifications(prev => [notification, ...prev])
      })

      newSocket.on('clause-created', (data) => {
        const notification: Notification = {
          _id: `clause-created-${data.clauseId}-${Date.now()}`,
          type: 'clause_created',
          title: 'New Clause Created',
          message: `A new clause "${data.clauseName}" has been created`,
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
        // For now, we'll use mock data based on user role
        let mockNotifications: Notification[] = []
        
        if (user.role === 'admin') {
          mockNotifications = [
            {
              _id: '1',
              type: 'user_registered',
              title: 'New User Registration',
              message: 'John Smith (john@example.com) has registered and needs approval',
              userId: 'user-123',
              userName: 'John Smith',
              userEmail: 'john@example.com',
              isRead: false,
              createdAt: new Date(Date.now() - 1800000).toISOString()
            },
            {
              _id: '2',
              type: 'user_registered',
              title: 'New User Registration',
              message: 'Sarah Johnson (sarah@example.com) has registered and needs approval',
              userId: 'user-124',
              userName: 'Sarah Johnson',
              userEmail: 'sarah@example.com',
              isRead: false,
              createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              _id: '3',
              type: 'template_created',
              title: 'New Template Created',
              message: 'A new template "Standard NDA" has been created',
              isRead: false,
              createdAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
              _id: '4',
              type: 'agreement_created',
              title: 'New Agreement Created',
              message: 'A new agreement has been created by Mike Wilson',
              agreementId: 'agreement-123',
              isRead: true,
              createdAt: new Date(Date.now() - 10800000).toISOString()
            }
          ]
        } else {
          mockNotifications = [
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
        }

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

  const clearAllNotifications = () => {
    setNotifications([])
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
    clearAllNotifications,
    addNotification,
    removeNotification
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}