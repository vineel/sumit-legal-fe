"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Clock,
  User,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PendingInvite {
  _id: string
  templateId: {
    _id: string
    templatename: string
    description: string
  }
  initiatorId: {
    _id: string
    name: string
    email: string
  }
  status: string
  createdAt: string
}

export function PendingInvites() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingInvites()
  }, [])

  const fetchPendingInvites = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('🔍 Fetching pending invites')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agreement/user/pending-invites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pending invites')
      }

      const data = await response.json()
      if (data.success) {
        console.log('✅ Pending invites fetched:', data.pendingInvites)
        setInvites(data.pendingInvites)
      } else {
        throw new Error(data.message || 'Failed to fetch pending invites')
      }
    } catch (error: any) {
      console.error('Error fetching pending invites:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = (agreementId: string) => {
    console.log('📝 Accepting invite for agreement:', agreementId)
    router.push(`/agreement-intake/${agreementId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pending Invites
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading invites...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pending Invites
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-2">Error loading invites</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (invites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pending Invites
          </CardTitle>
          <CardDescription>
            You have no pending agreement invites
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No pending invites at the moment</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Pending Invites ({invites.length})
        </CardTitle>
        <CardDescription>
          You have {invites.length} pending agreement invite{invites.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invites.map((invite) => (
          <div key={invite._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h4 className="font-medium">{invite.templateId.templatename}</h4>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {invite.templateId.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>From: {invite.initiatorId.name}</span>
                  </div>
                  <div>
                    <span>Invited: {formatDate(invite.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => handleAcceptInvite(invite._id)}
                size="sm"
                className="ml-4"
              >
                <Mail className="w-4 h-4 mr-2" />
                Complete Intake
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
