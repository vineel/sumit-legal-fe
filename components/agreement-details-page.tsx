"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  ArrowLeft,
  Download,
  Edit,
  Share2,
  Copy
} from "lucide-react"
import { getAgreementById, Agreement } from "@/lib/agreements"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface AgreementDetails {
  _id: string
  status: string
  effectiveDate: string
  termDuration: string
  jurisdiction: string
  signedDate: string
  partyAName?: string
  partyBName?: string
  clauses?: any[]
  createdAt?: string
  updatedAt?: string
  partyAEmail?: string
  partyBEmail?: string
  partyAAddress?: string
  partyBAddress?: string
  partyAPhone?: string
  partyBPhone?: string
  description?: string
  terms?: string
  conditions?: string
  attachments?: any[]
}

interface AgreementDetailsPageProps {
  agreementId: string
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-800", icon: FileText },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  exported: { label: "Exported", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
  signed: { label: "Signed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
}

export function AgreementDetailsPage({ agreementId }: AgreementDetailsPageProps) {
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (agreementId) {
      fetchAgreementDetails()
    }
  }, [agreementId])

  const fetchAgreementDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found")
        return
      }

      const data = await getAgreementById(token, agreementId)
      setAgreement(data)
    } catch (err) {
      console.error("Error fetching agreement details:", err)
      setError("Failed to load agreement details")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-4 text-lg">Loading agreement details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Agreement</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={fetchAgreementDetails}>Try Again</Button>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Agreement Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested agreement could not be found.</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Agreement Details</h1>
                <p className="text-sm text-muted-foreground">ID: {agreement._id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Agreement Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">
                  {agreement.initiatorId.name || "Agreement"}
                  {agreement.invitedUserId.email && ` with ${agreement.invitedUserId.email}`}
                </CardTitle>
                <CardDescription className="text-lg">
                  {typeof agreement.templateId === 'object' ? agreement.templateId.templatename : "Legal agreement between parties"}
                </CardDescription>
                <div className="flex items-center gap-4 mt-4">
                  <Badge className={getStatusConfig(agreement.status || 'draft').color} variant="secondary">
                    {getStatusConfig(agreement.status || 'draft').label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created: {formatDate(agreement.createdAt || "")}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="clauses">Clauses</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timeline & Duration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created Date:</span>
                      <span className="font-medium">{formatDate(agreement.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">{agreement.status || "Draft"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signed Date:</span>
                      <span className="font-medium">{agreement.signatures?.initiatorSignature?.signedAt ? formatDate(agreement.signatures.initiatorSignature.signedAt) : "Not signed"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">{formatDate(agreement.updatedAt || "")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Legal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="font-medium">{typeof agreement.templateId === 'object' ? agreement.templateId.templatename : "Legal Agreement"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getStatusConfig(agreement.status || 'draft').color} variant="secondary">
                        {getStatusConfig(agreement.status || 'draft').label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agreement ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{agreement._id}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(agreement._id)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agreement Information */}
            <Card>
              <CardHeader>
                <CardTitle>Agreement Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This agreement is based on the template: {typeof agreement.templateId === 'object' ? agreement.templateId.templatename : "Legal Agreement"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {agreement.status || "Draft"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parties Tab */}
          <TabsContent value="parties" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Party A
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{agreement.initiatorId.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{agreement.initiatorId.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User ID:</span>
                    <p className="font-medium">{agreement.initiatorId._id}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Party B
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{agreement.invitedUserId.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{agreement.invitedUserId.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User ID:</span>
                    <p className="font-medium">{agreement.invitedUserId._id}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clauses Tab */}
          <TabsContent value="clauses" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Agreement Details</h3>
                <p className="text-muted-foreground mb-4">
                  This agreement is based on the template: {typeof agreement.templateId === 'object' ? agreement.templateId.templatename : "Legal Agreement"}
                </p>
                <p className="text-muted-foreground mb-4">
                  Status: {agreement.status || "Draft"}
                </p>
                <p className="text-muted-foreground">
                  Created: {formatDate(agreement.createdAt)}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                <p className="text-muted-foreground mb-4">No attachments have been uploaded for this agreement.</p>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
