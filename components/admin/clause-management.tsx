"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Pagination as Pager, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
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
import { createClause, getClauses, Clause, updateClause, deleteClause, createClauseVariant, updateClauseVariant, deleteClauseVariant } from "@/lib/clause";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog"

// const mockClauses = [...] // Mock data commented as per instruction

export function ClauseManagement() {
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null)
  const [isAddingClause, setIsAddingClause] = useState(false)
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [activeTab, setActiveTab] = useState("clauses")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [clauses, setClauses] = useState<Clause[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalClausesCount, setTotalClausesCount] = useState(0)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    description: "",
    required: false as boolean,
    status: "active" as "active" | "inactive",
  })
  const [addForm, setAddForm] = useState({
    name: "",
    category: "",
    description: "",
    required: false as boolean,
    status: "active" as "active" | "inactive",
  })
  const isAddValid = addForm.name.trim().length > 0 && addForm.category.trim().length > 0 && addForm.description.trim().length > 0
  const [variantForm, setVariantForm] = useState({
    name: "",
    riskLevel: "low" as "low" | "medium" | "high",
    legalText: "",
    status: "active" as "active" | "inactive",
    version: 1 as number,
  })
  const [variantEditOpen, setVariantEditOpen] = useState(false)
  const [variantDeleteOpen, setVariantDeleteOpen] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [clausePreviewOpen, setClausePreviewOpen] = useState(false)
  const [variantPreviewOpen, setVariantPreviewOpen] = useState(false)
  const [previewClause, setPreviewClause] = useState<Clause | null>(null)
  const [previewVariant, setPreviewVariant] = useState<Clause["variants"][number] | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const { clauses: list, pagination } = await getClauses(page, limit)
        setClauses(list)
        setTotalPages(pagination.totalPages)
        setTotalClausesCount(pagination.totalClauses)
        setError(null)
      } catch (e: any) {
        setError(e?.message || "Failed to load clauses")
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [page, limit])

  const filteredClauses = useMemo(() => {
    const lower = searchTerm.toLowerCase()
    return clauses.filter((clause) => {
      const matchesSearch =
        clause.name.toLowerCase().includes(lower) || clause.description.toLowerCase().includes(lower)
      const matchesCategory = categoryFilter === "all" || clause.category === categoryFilter
      const matchesStatus = statusFilter === "all" || clause.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [clauses, searchTerm, categoryFilter, statusFilter])

  const onOpenEdit = (clause: Clause) => {
    setSelectedClause(clause)
    setEditForm({
      name: clause.name,
      category: clause.category,
      description: clause.description,
      required: !!clause.required,
      status: (clause.status as any) || "active",
    })
    setIsEditOpen(true)
  }

  const onSubmitEdit = async () => {
    if (!selectedClause) return
    try {
      setLoading(true)
      await updateClause(selectedClause._id, editForm)
      const { clauses: list, pagination } = await getClauses(page, limit)
      setClauses(list)
      setTotalPages(pagination.totalPages)
      setTotalClausesCount(pagination.totalClauses)
      setIsEditOpen(false)
    } catch (e) {
      // no-op minimal error handling for now
    } finally {
      setLoading(false)
    }
  }

  const onConfirmDelete = async () => {
    if (!selectedClause) return
    try {
      setLoading(true)
      await deleteClause(selectedClause._id)
      const { clauses: list, pagination } = await getClauses(page, limit)
      setClauses(list)
      setTotalPages(pagination.totalPages)
      setTotalClausesCount(pagination.totalClauses)
      setIsDeleteOpen(false)
      setSelectedClause(null)
    } catch (e) {
      // no-op minimal error handling for now
    } finally {
      setLoading(false)
    }
  }

  const onSubmitAddClause = async () => {
    if (!isAddValid) return
    try {
      setLoading(true)
      await createClause(addForm)
      const { clauses: list, pagination } = await getClauses(page, limit)
      setClauses(list)
      setTotalPages(pagination.totalPages)
      setTotalClausesCount(pagination.totalClauses)
      setIsAddingClause(false)
      setAddForm({ name: "", category: "", description: "", required: false, status: "active" })
    } catch (e) {
      // handle error minimally
    } finally {
      setLoading(false)
    }
  }

  const onOpenAddVariant = (clause: Clause) => {
    setSelectedClause(clause)
    setVariantForm({ name: "", riskLevel: "low", legalText: "", status: "active", version: 1 })
    setIsAddingVariant(true)
  }

  const isVariantValid = variantForm.name.trim() && variantForm.legalText.trim()

  const onSubmitAddVariant = async () => {
    if (!selectedClause || !isVariantValid) return
    try {
      setLoading(true)
      await createClauseVariant(selectedClause._id, {
        name: variantForm.name,
        riskLevel: variantForm.riskLevel,
        legalText: variantForm.legalText,
        status: variantForm.status,
        version: Number(variantForm.version) || 1,
        _id: undefined as never,
      } as any)
      const { clauses: list, pagination } = await getClauses(page, limit)
      setClauses(list)
      setTotalPages(pagination.totalPages)
      setTotalClausesCount(pagination.totalClauses)
      setIsAddingVariant(false)
    } catch (e) {
      // minimal error handling
    } finally {
      setLoading(false)
    }
  }

  const onOpenEditVariant = (clause: Clause, variantId: string) => {
    const variant = clause.variants?.find(v => v._id === variantId)
    if (!variant) return
    setSelectedClause(clause)
    setSelectedVariantId(variantId)
    setVariantForm({
      name: variant.name,
      riskLevel: variant.riskLevel,
      legalText: variant.legalText,
      status: variant.status,
      version: variant.version,
    })
    setVariantEditOpen(true)
  }

  const onSubmitEditVariant = async () => {
    if (!selectedClause || !selectedVariantId) return
    try {
      setLoading(true)
      await updateClauseVariant(selectedClause._id, selectedVariantId, {
        name: variantForm.name,
        riskLevel: variantForm.riskLevel,
        legalText: variantForm.legalText,
        status: variantForm.status,
        version: Number(variantForm.version) || 1,
      } as any)
      const { clauses: list, pagination } = await getClauses(page, limit)
      setClauses(list)
      setTotalPages(pagination.totalPages)
      setTotalClausesCount(pagination.totalClauses)
      setVariantEditOpen(false)
      setSelectedVariantId(null)
    } catch (e) {
      // minimal
    } finally {
      setLoading(false)
    }
  }

  const onOpenDeleteVariant = (clause: Clause, variantId: string) => {
    setSelectedClause(clause)
    setSelectedVariantId(variantId)
    setVariantDeleteOpen(true)
  }

  const onConfirmDeleteVariant = async () => {
    if (!selectedVariantId) return
    try {
      setLoading(true)
      await deleteClauseVariant(selectedVariantId)
      const { clauses: list, pagination } = await getClauses(page, limit)
      setClauses(list)
      setTotalPages(pagination.totalPages)
      setTotalClausesCount(pagination.totalClauses)
      setVariantDeleteOpen(false)
      setSelectedVariantId(null)
    } catch (e) {
      // minimal
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200"
      case "inactive":
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

  const totalClauses = 0 // keep dashboard stats unchanged per instruction (Clause Library only)
  const totalVariants = 0
  const activeVariants = 0
    

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
                    <p className="text-2xl font-bold">{totalClausesCount}</p>
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
                    <p className="text-2xl font-bold">{clauses.reduce((s, c) => s + (c.variants?.length || 0), 0)}</p>
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
                    <p className="text-2xl font-bold">{clauses.reduce((s, c) => s + (c.variants?.filter(v => v.status === "active").length || 0), 0)}</p>
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
                    <p className="text-2xl font-bold">0</p>
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
                  <SelectItem value="inactive">Inactive</SelectItem>
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
                        <Input id="clauseType" placeholder="e.g., Governing Law" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Core Structure">Core Structure</SelectItem>
                            <SelectItem value="Legal Framework">Legal Framework</SelectItem>
                            <SelectItem value="Obligations">Obligations</SelectItem>
                            <SelectItem value="Restrictions">Restrictions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Detailed description of this clause type and its purpose..." value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="required" checked={addForm.required} onChange={(e) => setAddForm({ ...addForm, required: e.target.checked })} />
                      <Label htmlFor="required">Required for all NDAs</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={onSubmitAddClause} disabled={!isAddValid || loading}>Create Clause Type</Button>
                      <Button variant="outline" onClick={() => setIsAddingClause(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Variant Edit Modal */}
            <Dialog open={variantEditOpen} onOpenChange={setVariantEditOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Edit Variant</DialogTitle>
                  <DialogDescription>Update the selected clause variant</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="evName">Variant Name</Label>
                      <Input id="evName" value={variantForm.name} onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="evRisk">Risk Level</Label>
                      <Select value={variantForm.riskLevel} onValueChange={(v) => setVariantForm({ ...variantForm, riskLevel: v as any })}>
                        <SelectTrigger>
                          <SelectValue />
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
                    <Label htmlFor="evText">Legal Text</Label>
                    <Textarea id="evText" rows={8} value={variantForm.legalText} onChange={(e) => setVariantForm({ ...variantForm, legalText: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="evStatus">Status</Label>
                      <Select value={variantForm.status} onValueChange={(v) => setVariantForm({ ...variantForm, status: v as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="evVersion">Version</Label>
                      <Input id="evVersion" type="number" value={variantForm.version} onChange={(e) => setVariantForm({ ...variantForm, version: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={onSubmitEditVariant} disabled={loading}>Save</Button>
                    <Button variant="outline" onClick={() => setVariantEditOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Variant Delete Confirmation */}
            <AlertDialog open={variantDeleteOpen} onOpenChange={setVariantDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete variant?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the variant.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onConfirmDeleteVariant}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {/* Enhanced Clauses List */}
            <div className="space-y-6">
              {loading && <div className="text-sm text-muted-foreground">Loading clauses...</div>}
              {error && <div className="text-sm text-red-600">{error}</div>}
              {filteredClauses.map((clause) => (
                <Card key={clause._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl font-heading">{clause.name}</CardTitle>
                          {clause.required && <Badge variant="secondary">Required</Badge>}
                          <Badge variant="outline">{clause.category}</Badge>
                        </div>
                        <CardDescription className="text-base mb-3">{clause.description}</CardDescription>

                        {/* Usage Statistics */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="col-span-4">
                            <span className="text-muted-foreground">Variants:</span>
                            <span className="font-medium text-primary ml-2">{clause.variants?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => { setPreviewClause(clause); setClausePreviewOpen(true) }}>
                          <Eye className="w-4 h-4" />
                          Preview
                        </Button>
                        <Dialog open={isAddingVariant} onOpenChange={setIsAddingVariant}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => onOpenAddVariant(clause)}>
                              <Plus className="w-4 h-4" />
                              Add Variant
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Add Clause Variant</DialogTitle>
                              <DialogDescription>Add a new variant for {selectedClause?.name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="variantName">Variant Name</Label>
                                  <Input id="variantName" placeholder="e.g., Enhanced Protection" value={variantForm.name} onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })} />
                                </div>
                                <div>
                                  <Label htmlFor="riskLevel">Risk Level</Label>
                                  <Select value={variantForm.riskLevel} onValueChange={(v) => setVariantForm({ ...variantForm, riskLevel: v as any })}>
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
                                <Textarea id="variantText" placeholder="Enter the complete legal text for this variant..." rows={8} value={variantForm.legalText} onChange={(e) => setVariantForm({ ...variantForm, legalText: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="status">Status</Label>
                                  <Select value={variantForm.status} onValueChange={(v) => setVariantForm({ ...variantForm, status: v as any })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="version">Version</Label>
                                  <Input id="version" placeholder="e.g., 1" type="number" value={variantForm.version} onChange={(e) => setVariantForm({ ...variantForm, version: Number(e.target.value) })} />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={onSubmitAddVariant} disabled={!isVariantValid || loading}>Add Variant</Button>
                                <Button variant="outline" onClick={() => setIsAddingVariant(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => onOpenEdit(clause)}>
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-2" onClick={() => { setSelectedClause(clause); setIsDeleteOpen(true) }}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {clause.variants?.map((variant) => (
                        <div key={variant._id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
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
                              <Button variant="ghost" size="sm" onClick={() => { setPreviewVariant(variant); setVariantPreviewOpen(true) }}>
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => onOpenEditVariant(clause, variant._id)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => onOpenDeleteVariant(clause, variant._id)}>
                                <Archive className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  variant.status === "active"
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                }`}
                              />
                              {variant.status}
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded">
                            {variant.legalText}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
                <Pager>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)) }} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                      const p = idx + 1
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p) }}>{p}</PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)) }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pager>
              </div>
            </div>

            {/* Edit Clause Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Clause</DialogTitle>
                  <DialogDescription>Update clause details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editName">Clause Name</Label>
                      <Input id="editName" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="editCategory">Category</Label>
                      <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Core Structure">Core Structure</SelectItem>
                          <SelectItem value="Legal Framework">Legal Framework</SelectItem>
                          <SelectItem value="Obligations">Obligations</SelectItem>
                          <SelectItem value="Restrictions">Restrictions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea id="editDescription" rows={5} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="editRequired" checked={editForm.required} onChange={(e) => setEditForm({ ...editForm, required: e.target.checked })} />
                      <Label htmlFor="editRequired">Required</Label>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={onSubmitEdit} disabled={loading}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete clause?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the clause and its variants.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Clause Preview Modal */}
          <Dialog open={clausePreviewOpen} onOpenChange={setClausePreviewOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{previewClause?.name || "Clause Preview"}</DialogTitle>
                <DialogDescription>{previewClause?.category}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">{previewClause?.description}</div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Variants ({previewClause?.variants?.length || 0})</div>
                  <div className="space-y-3 max-h-80 overflow-auto">
                    {previewClause?.variants?.map(v => (
                      <div key={v._id} className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{v.name}</span>
                          <Badge variant="outline" className={getStatusColor(v.status)}>{v.status.toUpperCase()}</Badge>
                          <Badge variant="outline" className={`text-xs ${getRiskColor(v.riskLevel)}`}>{v.riskLevel.toUpperCase()} RISK</Badge>
                          <span className="text-xs text-muted-foreground">v{v.version}</span>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{v.legalText}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setClausePreviewOpen(false)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Variant Preview Modal */}
          <Dialog open={variantPreviewOpen} onOpenChange={setVariantPreviewOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{previewVariant?.name || "Variant Preview"}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2">
                    {previewVariant && (
                      <>
                        <Badge variant="outline" className={getStatusColor(previewVariant.status)}>{previewVariant.status.toUpperCase()}</Badge>
                        <Badge variant="outline" className={`text-xs ${getRiskColor(previewVariant.riskLevel)}`}>{previewVariant.riskLevel.toUpperCase()} RISK</Badge>
                        <span className="text-xs">v{previewVariant.version}</span>
                      </>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{previewVariant?.legalText}</div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setVariantPreviewOpen(false)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Clause Usage Analytics
                </CardTitle>
                <CardDescription>Analytics coming soon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm text-muted-foreground">This section will be powered by real usage data.</div>
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
