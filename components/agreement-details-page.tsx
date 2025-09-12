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
import { getAgreementById } from "@/lib/user"
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
  const [agreement, setAgreement] = useState<AgreementDetails | null>(null)
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
                  {agreement.partyAName || "Agreement"} 
                  {agreement.partyBName && ` with ${agreement.partyBName}`}
                </CardTitle>
                <CardDescription className="text-lg">
                  {agreement.description || "Legal agreement between parties"}
                </CardDescription>
                <div className="flex items-center gap-4 mt-4">
                  <Badge className={getStatusConfig(agreement.status).color} variant="secondary" size="lg">
                    {getStatusConfig(agreement.status).label}
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
                      <span className="text-muted-foreground">Effective Date:</span>
                      <span className="font-medium">{formatDate(agreement.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Term Duration:</span>
                      <span className="font-medium">{agreement.termDuration || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signed Date:</span>
                      <span className="font-medium">{formatDate(agreement.signedDate)}</span>
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
                      <span className="text-muted-foreground">Jurisdiction:</span>
                      <span className="font-medium">{agreement.jurisdiction || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getStatusConfig(agreement.status).color} variant="secondary">
                        {getStatusConfig(agreement.status).label}
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

            {/* Terms and Conditions */}
            {(agreement.terms || agreement.conditions) && (
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agreement.terms && (
                    <div>
                      <h4 className="font-medium mb-2">Terms</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{agreement.terms}</p>
                    </div>
                  )}
                  {agreement.conditions && (
                    <div>
                      <h4 className="font-medium mb-2">Conditions</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{agreement.conditions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                    <p className="font-medium">{agreement.partyAName || "Not specified"}</p>
                  </div>
                  {agreement.partyAEmail && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{agreement.partyAEmail}</p>
                    </div>
                  )}
                  {agreement.partyAPhone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{agreement.partyAPhone}</p>
                    </div>
                  )}
                  {agreement.partyAAddress && (
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <p className="font-medium whitespace-pre-wrap">{agreement.partyAAddress}</p>
                    </div>
                  )}
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
                    <p className="font-medium">{agreement.partyBName || "Not specified"}</p>
                  </div>
                  {agreement.partyBEmail && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{agreement.partyBEmail}</p>
                    </div>
                  )}
                  {agreement.partyBPhone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{agreement.partyBPhone}</p>
                    </div>
                  )}
                  {agreement.partyBAddress && (
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <p className="font-medium whitespace-pre-wrap">{agreement.partyBAddress}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clauses Tab */}
          <TabsContent value="clauses" className="space-y-6">
            {agreement.clauses && agreement.clauses.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Clauses ({agreement.clauses.length})</h3>
                  <Button size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Clauses
                  </Button>
                </div>
                {agreement.clauses.map((clause, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{clause.name || `Clause ${index + 1}`}</CardTitle>
                          {clause.description && (
                            <CardDescription className="mt-1">{clause.description}</CardDescription>
                          )}
                        </div>
                        {clause.status && (
                          <Badge 
                            variant="secondary" 
                            className={
                              clause.status === "resolved" 
                                ? "bg-green-100 text-green-800"
                                : clause.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : clause.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {clause.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    {clause.legalText && (
                      <CardContent>
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Legal Text:</h4>
                          <p className="whitespace-pre-wrap">{clause.legalText}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Clauses</h3>
                  <p className="text-muted-foreground mb-4">This agreement doesn't have any clauses yet.</p>
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Add Clauses
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {agreement.attachments && agreement.attachments.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Attachments ({agreement.attachments.length})</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agreement.attachments.map((attachment, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{attachment.name || `Document ${index + 1}`}</p>
                            <p className="text-sm text-muted-foreground">{attachment.type || "Unknown type"}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
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
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
