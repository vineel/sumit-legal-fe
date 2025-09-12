"use client"

import { useState } from "react"
import { useNotifications } from "@/components/notification-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  MessageSquare,
  X,
  Eye,
  CheckCheck,
  UserPlus,
  UserCheck,
  UserX,
  FileEdit,
  Trash2
} from "lucide-react"

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications, removeNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
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
      case 'user_registered':
        return <UserPlus className="w-4 h-4" />
      case 'user_approved':
        return <UserCheck className="w-4 h-4" />
      case 'user_rejected':
        return <UserX className="w-4 h-4" />
      case 'template_created':
        return <FileEdit className="w-4 h-4" />
      case 'clause_created':
        return <FileText className="w-4 h-4" />
      case 'system_alert':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationColor = (type: string) => {
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
      case 'user_registered':
        return 'text-orange-600'
      case 'user_approved':
        return 'text-green-600'
      case 'user_rejected':
        return 'text-red-600'
      case 'template_created':
        return 'text-indigo-600'
      case 'clause_created':
        return 'text-blue-600'
      case 'system_alert':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button
                  onClick={clearAllNotifications}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer group ${
                    !notification.isRead ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => markAsRead(notification._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      getNotificationColor(notification.type)
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification._id)
                            }}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {notification.agreementId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Navigate to agreement
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Agreement
                          </Button>
                        )}
                        {notification.userId && (notification.type === 'user_registered') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Navigate to user management
                              window.location.href = '/admin?tab=users'
                            }}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Manage User
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
