"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Send,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AgreementCard } from "./agreement-card"
import { downloadAgreementPDF } from "@/lib/agreements"

interface Agreement {
  _id: string
  templateId: {
    templatename: string
    description?: string
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
  partyBEmail?: string
  status: string
  effectiveDate?: string
  termDuration?: string
  jurisdiction?: string
  partyASignature?: string
  partyBSignature?: string
  createdAt: string
  updatedAt: string
}

interface SimpleAgreementManagementProps {
  userRole: 'admin' | 'party'
}

export function SimpleAgreementManagement({ userRole }: SimpleAgreementManagementProps) {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchAgreements()
  }, [])

  const fetchAgreements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      console.log("Fetching agreements...")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/allagrements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch agreements')
      }

      const data = await response.json()
      console.log("=== FRONTEND AGREEMENTS DEBUG ===")
      console.log("Response status:", response.status)
      console.log("Agreements fetched:", data)
      console.log("Number of agreements:", data?.length || 0)
      
      if (Array.isArray(data)) {
        data.forEach((agreement, index) => {
          console.log(`Frontend Agreement ${index + 1}:`)
          console.log(`  - ID: ${agreement._id}`)
          console.log(`  - Party A: ${agreement.userid}`)
          console.log(`  - Party B: ${agreement.partyBUserId}`)
          console.log(`  - Status: ${agreement.status}`)
          console.log(`  - Template: ${agreement.templateId?.templatename}`)
        })
      }
      
      setAgreements(data || [])
    } catch (err) {
      console.error("Error fetching agreements:", err)
      setError("Failed to load agreements")
      toast({
        title: "Error",
        description: "Failed to load agreements. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (agreementId: string, newStatus: string) => {
    try {
      setActionLoading(agreementId)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/${agreementId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Update local state
      setAgreements(prev => 
        prev.map(agreement => 
          agreement._id === agreementId 
            ? { ...agreement, status: newStatus }
            : agreement
        )
      )

      toast({
        title: "Status Updated",
        description: `Agreement status updated to ${newStatus}`,
        variant: "default"
      })
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Error",
        description: "Failed to update agreement status",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPDF = async (agreementId: string) => {
    try {
      setActionLoading(agreementId)
      
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agreement/${agreementId}/generate-pdf`, {
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
      link.download = `agreement-${agreementId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: "Agreement PDF is being downloaded",
        variant: "default"
      })
    } catch (err: any) {
      console.error("Error downloading PDF:", err)
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download PDF",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agreements...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (agreements.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Agreements Found</h3>
          <p className="text-muted-foreground mb-4">
            {userRole === 'admin' 
              ? "No agreements have been created yet." 
              : "You haven't created or been invited to any agreements yet."
            }
          </p>
          {userRole === 'party' && (
            <Button onClick={() => router.push('/select-template')}>
              Create New Agreement
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agreement Management</h2>
          <p className="text-muted-foreground">
            {userRole === 'admin' 
              ? "Manage all agreements in the system" 
              : "Manage your agreements and invitations"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgreements}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          {userRole === 'party' && (
            <Button onClick={() => router.push('/select-template')}>
              <Send className="w-4 h-4 mr-2" />
              Create New Agreement
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agreements.map((agreement) => (
          <AgreementCard
            key={agreement._id}
            agreement={agreement}
            onStatusUpdate={handleStatusUpdate}
            onDownloadPDF={handleDownloadPDF}
            actionLoading={actionLoading}
          />
        ))}
      </div>
    </div>
  )
}
