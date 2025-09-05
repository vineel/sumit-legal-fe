"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClauses, Clause } from "@/lib/clause"
import { addTemplate } from "@/lib/templateApi"
import { ArrowLeft, Upload, Search, Eye, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function UploadTemplatePage() {
  const { user, logout } = useAuth()

  const [uploadForm, setUploadForm] = useState({
    templatename: "",
    description: "",
    version: "",
    file: null as File | null,
  })

  const [clauseMode, setClauseMode] = useState<"existing" | "custom">("existing")
  const [clauses, setClauses] = useState<Clause[]>([])
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewClause, setPreviewClause] = useState<Clause | null>(null)

  const [customClause, setCustomClause] = useState({
    name: "",
    category: "Core Structure",
    description: "",
    required: false,
    status: "active" as "active" | "inactive",
    variants: [
      {
        name: "",
        riskLevel: "low" as "low" | "medium" | "high",
        legalText: "",
        status: "active" as "active" | "inactive",
        version: 1,
      },
    ],
  })

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const { clauses: list } = await getClauses(1, 100)
        setClauses(list)
      } catch {}
    }
    fetchClauses()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200"
      case "inactive":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const filteredClauses = clauses.filter((c) => {
    const lower = searchTerm.toLowerCase()
    const matchesSearch = c.name.toLowerCase().includes(lower) || c.description.toLowerCase().includes(lower)
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter
    const matchesStatus = statusFilter === "all" || (c.status as any) === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, files } = e.target
    if (id === "file") {
      setUploadForm((prev) => ({ ...prev, file: files?.[0] || null }))
    } else {
      setUploadForm((prev) => ({ ...prev, [id]: value }))
    }
  }

  const isCustomValid =
    !!customClause.name &&
    !!customClause.description &&
    customClause.variants.length > 0 &&
    customClause.variants.every(v => v.name && v.legalText)

const onSubmit = async () => {
  if (!uploadForm.templatename || !uploadForm.version || !uploadForm.file) return
  if (clauseMode === "existing" && selectedClauseIds.length === 0) return
  if (clauseMode === "custom" && !isCustomValid) return

  const formData = new FormData()
  formData.append("templatename", uploadForm.templatename)
  formData.append("description", uploadForm.description)
  formData.append("version", uploadForm.version)
  formData.append("file", uploadForm.file)

  // 👇 Add clauseMode
  formData.append("clauseMode", clauseMode)

  if (clauseMode === "existing") {
    formData.append("clauseIds", JSON.stringify(selectedClauseIds))
  } else if (clauseMode === "custom") {
    formData.append("customClause", JSON.stringify(customClause))
  }

  try {
    setSubmitting(true)
    await addTemplate(formData)
    window.location.href = "/admin/templates"
  } finally {
    setSubmitting(false)
  }
}


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/templates">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Templates
                </Link>
              </Button>
              <h1 className="text-xl font-heading font-semibold">Upload Template</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>Sign Out</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> New Template Details
            </CardTitle>
            <CardDescription>Provide template information and link to a clause</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templatename">Template Name</Label>
                <Input id="templatename" value={uploadForm.templatename} onChange={handleUploadChange} placeholder="e.g., Enterprise NDA Template" />
              </div>
              <div>
                <Label htmlFor="version">Version</Label>
                <Input id="version" value={uploadForm.version} onChange={handleUploadChange} placeholder="e.g., 1.0" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={uploadForm.description} onChange={handleUploadChange} placeholder="Brief description of this template..." />
            </div>
            <div>
              <Label htmlFor="file">Template File</Label>
              <Input id="file" type="file" accept=".docx,.pdf,.json" onChange={handleUploadChange} />
              <p className="text-xs text-muted-foreground mt-1">Supported formats: DOCX, PDF, JSON structure files</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clause Options</CardTitle>
            <CardDescription>Choose an existing clause or create your own</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Clause Source</Label>
                <Select value={clauseMode} onValueChange={(v: any) => setClauseMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing">Use existing clause</SelectItem>
                    <SelectItem value="custom">Create custom clause</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {clauseMode === "existing" && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input placeholder="Search clause types and descriptions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                </div>

                <div className="space-y-4">
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
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div className="col-span-4">
                                <span className="text-muted-foreground">Variants:</span>
                                <span className="font-medium text-primary ml-2">{clause.variants?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => { setPreviewClause(clause); setPreviewOpen(true) }}>
                              <Eye className="w-4 h-4" />
                              Preview
                            </Button>
                            <Button size="sm" className="gap-2" onClick={() => {
                              setSelectedClauseIds(prev => prev.includes(clause._id) ? prev.filter(id => id !== clause._id) : [...prev, clause._id])
                            }}>
                              {selectedClauseIds.includes(clause._id) && <CheckCircle className="w-4 h-4" />}
                              {selectedClauseIds.includes(clause._id) ? "Deselect" : "Select"}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {clauseMode === "custom" && (
              <div className="space-y-4 border rounded-md p-4">
                <div className="text-sm font-medium">Custom Clause</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Clause Name</Label>
                    <Input value={customClause.name} onChange={(e) => setCustomClause({ ...customClause, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={customClause.category} onValueChange={(v) => setCustomClause({ ...customClause, category: v })}>
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
                  <Label>Description</Label>
                  <Textarea value={customClause.description} onChange={(e) => setCustomClause({ ...customClause, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="flex gap-2 items-center">
                    <input type="checkbox" id="cc_required" checked={customClause.required} onChange={(e) => setCustomClause({ ...customClause, required: e.target.checked })} />
                    <Label htmlFor="cc_required">Required</Label>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={customClause.status} onValueChange={(v: any) => setCustomClause({ ...customClause, status: v })}>
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
                <div className="text-sm font-medium pt-2">Custom Variants</div>
                <div className="space-y-4">
                  {customClause.variants.map((v, idx) => (
                    <div key={idx} className="border rounded-md p-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Variant Name</Label>
                          <Input value={v.name} onChange={(e) => {
                            const next = [...customClause.variants]; next[idx] = { ...next[idx], name: e.target.value }; setCustomClause({ ...customClause, variants: next })
                          }} />
                        </div>
                        <div>
                          <Label>Risk Level</Label>
                          <Select value={v.riskLevel} onValueChange={(val: any) => {
                            const next = [...customClause.variants]; next[idx] = { ...next[idx], riskLevel: val }; setCustomClause({ ...customClause, variants: next })
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Legal Text</Label>
                        <Textarea value={v.legalText} onChange={(e) => {
                          const next = [...customClause.variants]; next[idx] = { ...next[idx], legalText: e.target.value }; setCustomClause({ ...customClause, variants: next })
                        }} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Variant Status</Label>
                          <Select value={v.status} onValueChange={(val: any) => {
                            const next = [...customClause.variants]; next[idx] = { ...next[idx], status: val }; setCustomClause({ ...customClause, variants: next })
                          }}>
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
                          <Label>Version</Label>
                          <Input type="number" value={v.version} onChange={(e) => {
                            const next = [...customClause.variants]; next[idx] = { ...next[idx], version: Number(e.target.value) || 1 }; setCustomClause({ ...customClause, variants: next })
                          }} />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={() => {
                          const next = customClause.variants.filter((_, i) => i !== idx); setCustomClause({ ...customClause, variants: next })
                        }}>Remove Variant</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => setCustomClause({ ...customClause, variants: [...customClause.variants, { name: "", riskLevel: "low", legalText: "", status: "active", version: 1 }] })}>Add Variant</Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={submitting || !uploadForm.templatename || !uploadForm.version || !uploadForm.file || (clauseMode === "existing" && selectedClauseIds.length === 0) || (clauseMode === "custom" && !isCustomValid)}>Save Template</Button>
              <Button asChild variant="outline">
                <Link href="/admin/templates">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clause Preview */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewClause?.name}</DialogTitle>
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
                        <span className="text-xs text-muted-foreground">v{v.version}</span>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{v.legalText}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


