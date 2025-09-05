"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Edit,
  Search,
  Download,
  Upload,
  BarChart3,
  Settings,
  Eye,
  Copy,
  Archive,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { createClause, getClauses, Clause } from "@/lib/clause";

const mockClauses = [
  {
    id: "1",
    type: "Nature of NDA (Mutual vs. Unilateral)",
    category: "Core Structure",
    description: "Defines whether both parties or only one party will be sharing confidential information",
    variants: [
      {
        id: "1a",
        name: "Standard Mutual",
        text: "Both parties may disclose confidential information under the same terms and conditions...",
        status: "active",
        riskLevel: "low",
        usageCount: 45,
        lastUsed: "2024-01-15",
        approvedBy: "Legal Team",
        version: "2.1",
      },
      {
        id: "1b",
        name: "Flexible Mutual with Carveouts",
        text: "Both parties may disclose with specific exceptions and carveouts as defined...",
        status: "active",
        riskLevel: "medium",
        usageCount: 23,
        lastUsed: "2024-01-12",
        approvedBy: "Legal Team",
        version: "1.8",
      },
      {
        id: "1c",
        name: "Unilateral Discloser-Only",
        text: "Only one party discloses confidential information to the receiving party...",
        status: "active",
        riskLevel: "high",
        usageCount: 12,
        lastUsed: "2024-01-10",
        approvedBy: "Legal Team",
        version: "1.5",
      },
    ],
    required: true,
    lastModified: "2024-01-15",
    totalUsage: 80,
    conflictRate: 15,
    averageRanking: 1.2,
  },
  {
    id: "2",
    type: "Definitions",
    category: "Legal Framework",
    description: "Defines what constitutes 'Confidential Information' under the agreement",
    variants: [
      {
        id: "2a",
        name: "Comprehensive",
        text: "Confidential Information means all information, whether written, oral, electronic...",
        status: "active",
        riskLevel: "low",
        usageCount: 67,
        lastUsed: "2024-01-14",
        approvedBy: "Legal Team",
        version: "3.0",
      },
      {
        id: "2b",
        name: "Lean Definitions",
        text: "Confidential Information refers to information marked as confidential...",
        status: "active",
        riskLevel: "medium",
        usageCount: 34,
        lastUsed: "2024-01-13",
        approvedBy: "Legal Team",
        version: "2.2",
      },
      {
        id: "2c",
        name: "Minimal Definitions",
        text: "Confidential Information means information specifically marked as 'Confidential'...",
        status: "draft",
        riskLevel: "high",
        usageCount: 5,
        lastUsed: "2024-01-08",
        approvedBy: "Pending Review",
        version: "1.0",
      },
    ],
    required: true,
    lastModified: "2024-01-12",
    totalUsage: 106,
    conflictRate: 8,
    averageRanking: 1.4,
  },
]

export function ClauseManagement() {
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClause, setSelectedClause] = useState<any>(null)
  const [isAddingClause, setIsAddingClause] = useState(false)
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [activeTab, setActiveTab] = useState("clauses")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
   const [clauses, setClauses] = useState<Clause[]>([]);

  const filteredClauses = mockClauses.filter((clause) => {
    const matchesSearch =
      clause.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || clause.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200"
      case "draft":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "deprecated":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600"
      case "medium":
        return "text-yellow-600"
      case "high":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const totalClauses = mockClauses.length
  const totalVariants = mockClauses.reduce((sum, clause) => sum + clause.variants.length, 0)
  const activeVariants = mockClauses.reduce(
    (sum, clause) => sum + clause.variants.filter((v) => v.status === "active").length,
    0,
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
              <h1 className="text-xl font-heading font-semibold">Clause Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-2">Clause Bank Management</h2>
              <p className="text-muted-foreground">
                Comprehensive clause library with intelligent matching and analytics
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export Bank
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Upload className="w-4 h-4" />
                Import Clauses
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalClauses}</p>
                    <p className="text-sm text-muted-foreground">Clause Types</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Copy className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalVariants}</p>
                    <p className="text-sm text-muted-foreground">Total Variants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeVariants}</p>
                    <p className="text-sm text-muted-foreground">Active Variants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(mockClauses.reduce((sum, c) => sum + c.totalUsage, 0) / mockClauses.length)}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Usage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="clauses">Clause Library</TabsTrigger>
            <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
            <TabsTrigger value="settings">Bank Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="clauses" className="space-y-6">
            {/* Enhanced Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search clause types and descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Core Structure">Core Structure</SelectItem>
                  <SelectItem value="Legal Framework">Legal Framework</SelectItem>
                  <SelectItem value="Obligations">Obligations</SelectItem>
                  <SelectItem value="Restrictions">Restrictions</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddingClause} onOpenChange={setIsAddingClause}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Clause
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Clause</DialogTitle>
                    <DialogDescription>Create a new clause type with comprehensive metadata</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clauseType">Clause Type Name</Label>
                        <Input id="clauseType" placeholder="e.g., Governing Law" />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="core">Core Structure</SelectItem>
                            <SelectItem value="legal">Legal Framework</SelectItem>
                            <SelectItem value="obligations">Obligations</SelectItem>
                            <SelectItem value="restrictions">Restrictions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Detailed description of this clause type and its purpose..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="required" />
                      <Label htmlFor="required">Required for all NDAs</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setIsAddingClause(false)}>Create Clause Type</Button>
                      <Button variant="outline" onClick={() => setIsAddingClause(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Enhanced Clauses List */}
            <div className="space-y-6">
              {filteredClauses.map((clause) => (
                <Card key={clause.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl font-heading">{clause.type}</CardTitle>
                          {clause.required && <Badge variant="secondary">Required</Badge>}
                          <Badge variant="outline">{clause.category}</Badge>
                        </div>
                        <CardDescription className="text-base mb-3">{clause.description}</CardDescription>

                        {/* Usage Statistics */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Usage:</span>
                            <p className="font-medium text-primary">{clause.totalUsage}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Conflict Rate:</span>
                            <p className="font-medium text-red-600">{clause.conflictRate}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Ranking:</span>
                            <p className="font-medium text-green-600">{clause.averageRanking}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Modified:</span>
                            <p className="font-medium">{clause.lastModified}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Eye className="w-4 h-4" />
                          Preview
                        </Button>
                        <Dialog open={isAddingVariant} onOpenChange={setIsAddingVariant}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                              <Plus className="w-4 h-4" />
                              Add Variant
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Add Clause Variant</DialogTitle>
                              <DialogDescription>Add a new variant for {clause.type}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="variantName">Variant Name</Label>
                                  <Input id="variantName" placeholder="e.g., Enhanced Protection" />
                                </div>
                                <div>
                                  <Label htmlFor="riskLevel">Risk Level</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select risk level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low Risk</SelectItem>
                                      <SelectItem value="medium">Medium Risk</SelectItem>
                                      <SelectItem value="high">High Risk</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="variantText">Legal Text</Label>
                                <Textarea
                                  id="variantText"
                                  placeholder="Enter the complete legal text for this variant..."
                                  rows={8}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="status">Status</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="draft">Draft</SelectItem>
                                      <SelectItem value="deprecated">Deprecated</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="version">Version</Label>
                                  <Input id="version" placeholder="e.g., 1.0" />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => setIsAddingVariant(false)}>Add Variant</Button>
                                <Button variant="outline" onClick={() => setIsAddingVariant(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clause.variants.map((variant) => (
                        <div key={variant.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-lg">{variant.name}</h4>
                              <Badge variant="outline" className={getStatusColor(variant.status)}>
                                {variant.status.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getRiskColor(variant.riskLevel)}`}>
                                {variant.riskLevel.toUpperCase()} RISK
                              </Badge>
                              <span className="text-xs text-muted-foreground">v{variant.version}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Archive className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground mb-3">
                            <div>Used: {variant.usageCount} times</div>
                            <div>Last used: {variant.lastUsed}</div>
                            <div>Approved by: {variant.approvedBy}</div>
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  variant.status === "active"
                                    ? "bg-green-500"
                                    : variant.status === "draft"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                              />
                              {variant.status}
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded">
                            {variant.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Clause Usage Analytics
                </CardTitle>
                <CardDescription>Performance metrics and usage patterns for your clause bank</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {mockClauses.map((clause) => (
                  <div key={clause.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{clause.type}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Usage: {clause.totalUsage}</span>
                        <span>Conflicts: {clause.conflictRate}%</span>
                        <span>Avg Rank: {clause.averageRanking}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage Rate</span>
                        <span>{clause.totalUsage}/100</span>
                      </div>
                      <Progress value={clause.totalUsage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Conflict Rate</span>
                        <span className="text-red-600">{clause.conflictRate}%</span>
                      </div>
                      <Progress value={clause.conflictRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clause Bank Settings</CardTitle>
                <CardDescription>Configure clause management and resolution settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-approval for low-risk variants</h4>
                      <p className="text-sm text-muted-foreground">Automatically approve variants marked as low-risk</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Conflict resolution priority</h4>
                      <p className="text-sm text-muted-foreground">Prioritize variants with higher usage rates</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Version control</h4>
                      <p className="text-sm text-muted-foreground">Track all changes to clause variants</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
