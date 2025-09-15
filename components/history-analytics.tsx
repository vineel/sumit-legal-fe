"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  TrendingUp,
  BarChart3,
  PieChart
} from "lucide-react"
import { getAgreements, downloadAgreementPDF, Agreement } from "@/lib/agreements"

interface AgreementHistory {
  _id: string
  status: string
  partyAName: string
  partyBName: string
  effectiveDate: string
  termDuration: string
  jurisdiction: string
  signedDate?: string
  createdAt: string
  updatedAt: string
  clauses: Array<{
    title: string
    partyAPreference: string
    partyBPreference: string
  }>
}

interface Analytics {
  totalAgreements: number
  completedAgreements: number
  inProgressAgreements: number
  averageNegotiationTime: number
  mostCommonConflicts: Array<{
    clause: string
    count: number
  }>
  monthlyStats: Array<{
    month: string
    agreements: number
    completed: number
  }>
}

export function HistoryAnalytics() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("history")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const agreementsData = await getAgreements(token)
      setAgreements(agreementsData)

      // Calculate analytics
      const analyticsData: Analytics = {
        totalAgreements: agreementsData.length,
        completedAgreements: agreementsData.filter(a => a.status === 'signed').length,
        inProgressAgreements: agreementsData.filter(a => a.status && ['pending', 'in-progress'].includes(a.status)).length,
        averageNegotiationTime: calculateAverageNegotiationTime(agreementsData),
        mostCommonConflicts: calculateMostCommonConflicts(agreementsData),
        monthlyStats: calculateMonthlyStats(agreementsData)
      }
      setAnalytics(analyticsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAverageNegotiationTime = (agreements: Agreement[]): number => {
    const completedAgreements = agreements.filter(a => a.status === 'signed' && a.signedDate)
    if (completedAgreements.length === 0) return 0

    const totalTime = completedAgreements.reduce((total, agreement) => {
      const created = new Date(agreement.createdAt).getTime()
      const signed = new Date(agreement.signedDate!).getTime()
      return total + (signed - created)
    }, 0)

    return totalTime / completedAgreements.length / (1000 * 60 * 60 * 24) // Convert to days
  }

  const calculateMostCommonConflicts = (agreements: Agreement[]): Array<{ clause: string; count: number }> => {
    const conflictCount: Record<string, number> = {}
    
    agreements.forEach(agreement => {
      agreement.clauses.forEach(clause => {
        if (clause.partyAPreference !== clause.partyBPreference) {
          conflictCount[clause.clauseId] = (conflictCount[clause.clauseId] || 0) + 1
        }
      })
    })

    return Object.entries(conflictCount)
      .map(([clause, count]) => ({ clause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  const calculateMonthlyStats = (agreements: Agreement[]): Array<{ month: string; agreements: number; completed: number }> => {
    const monthlyData: Record<string, { agreements: number; completed: number }> = {}
    
    agreements.forEach(agreement => {
      const month = new Date(agreement.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyData[month]) {
        monthlyData[month] = { agreements: 0, completed: 0 }
      }
      monthlyData[month].agreements++
      if (agreement.status === 'signed') {
        monthlyData[month].completed++
      }
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDownloadPDF = async (agreementId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      await downloadAgreementPDF(token, agreementId)
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading history and analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">History & Analytics</h1>
          <p className="text-muted-foreground">
            Track your agreement history and view detailed analytics
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Agreement History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="grid gap-6">
              {agreements.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Agreements Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't created or participated in any agreements yet.
                    </p>
                    <Button onClick={() => window.location.href = '/select-template'}>
                      Create Your First Agreement
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                agreements.map((agreement) => (
                  <Card key={agreement._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {agreement.partyAName} ↔ {agreement.partyBEmail || 'Email Invite'}
                          </CardTitle>
                          <CardDescription>
                            Agreement ID: {agreement._id}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(agreement.status || 'draft')}>
                            {agreement.status || 'draft'}
                          </Badge>
                          <Button
                            onClick={() => handleDownloadPDF(agreement._id)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Effective Date</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(agreement.effectiveDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Term Duration</p>
                            <p className="text-sm text-muted-foreground">
                              {agreement.termDuration || 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Clauses</p>
                            <p className="text-sm text-muted-foreground">
                              {agreement.clauses.length} clauses
                            </p>
                          </div>
                        </div>
                      </div>

                      {agreement.signedDate && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">
                            Signed on {new Date(agreement.signedDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(agreement.createdAt).toLocaleDateString()} • 
                        Updated: {new Date(agreement.updatedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <div className="grid gap-6">
                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Agreements</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalAgreements}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.completedAgreements}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.inProgressAgreements}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics.averageNegotiationTime.toFixed(1)} days
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Most Common Conflicts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Most Common Conflicts
                    </CardTitle>
                    <CardDescription>
                      Clauses that cause the most disagreements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.mostCommonConflicts.length === 0 ? (
                      <p className="text-muted-foreground">No conflicts recorded yet</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.mostCommonConflicts.map((conflict, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{conflict.clause}</span>
                            <Badge variant="secondary">{conflict.count} conflicts</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Monthly Statistics
                    </CardTitle>
                    <CardDescription>
                      Agreement creation and completion by month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.monthlyStats.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{stat.month}</span>
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                              {stat.agreements} created
                            </div>
                            <div className="text-sm text-green-600">
                              {stat.completed} completed
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
