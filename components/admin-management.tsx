"use client"

import * as React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  FileText,
  Users,
  Database,
  Shield,
  Activity,
  Search,
  Download,
  Upload,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ClauseVariant {
  id: string
  name: string
  content: string
  category: string
  lastModified: Date
  createdBy: string
}

interface IntakeTemplate {
  id: string
  name: string
  description: string
  agreementType: string
  clauses: string[]
  isActive: boolean
  lastModified: Date
}

const mockClauseVariants: ClauseVariant[] = [
  {
    id: "1",
    name: "Standard Mutual",
    content: "Each party anticipates disclosing certain confidential or proprietary information...",
    category: "Nature of NDA",
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    createdBy: "admin@ibdcontracting.com",
  },
  {
    id: "2",
    name: "Comprehensive",
    content: "Confidential Information refers to any and all information, data, materials...",
    category: "Definitions",
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    createdBy: "admin@ibdcontracting.com",
  },
]

const mockTemplates: IntakeTemplate[] = [
  {
    id: "1",
    name: "Standard NDA Template",
    description: "Comprehensive NDA template for general business use",
    agreementType: "Non-Disclosure Agreement",
    clauses: ["Nature of NDA", "Definitions", "Confidentiality Obligations"],
    isActive: true,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
  },
  {
    id: "2",
    name: "Tech Startup NDA",
    description: "Specialized template for technology companies and startups",
    agreementType: "Non-Disclosure Agreement",
    clauses: ["Nature of NDA", "Definitions", "No Reverse Engineering"],
    isActive: true,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
]

export function AdminManagement() {
  const [activeTab, setActiveTab] = useState("clauses")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddingClause, setIsAddingClause] = useState(false)
  const [isAddingTemplate, setIsAddingTemplate] = useState(false)
  const [editingClause, setEditingClause] = useState<ClauseVariant | null>(null)

  const categories = ["all", "Nature of NDA", "Definitions", "Confidentiality Obligations", "Remedies"]

  const filteredClauses = mockClauseVariants.filter((clause) => {
    const matchesSearch =
      clause.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || clause.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSaveClause = (clauseData: Partial<ClauseVariant>) => {
    // In real app, this would save to backend
    console.log("Saving clause:", clauseData)
    setIsAddingClause(false)
    setEditingClause(null)
  }

  const handleDeleteClause = (clauseId: string) => {
    // In real app, this would delete from backend
    console.log("Deleting clause:", clauseId)
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Admin Management</h1>
              <p className="text-muted-foreground">Manage clause banks, templates, and system configuration</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Upload className="w-4 h-4" />
                Import Data
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-primary" />
                  <div>
                    <div className="text-lg font-bold">{mockClauseVariants.length}</div>
                    <div className="text-sm text-muted-foreground">Clause Variants</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-accent" />
                  <div>
                    <div className="text-lg font-bold">{mockTemplates.length}</div>
                    <div className="text-sm text-muted-foreground">Templates</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-chart-1" />
                  <div>
                    <div className="text-lg font-bold">12</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-secondary" />
                  <div>
                    <div className="text-lg font-bold">8</div>
                    <div className="text-sm text-muted-foreground">Active Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clauses" className="gap-2">
              <Database className="w-4 h-4" />
              Clause Bank
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Clause Bank Management */}
          <TabsContent value="clauses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-heading">Clause Bank Management</CardTitle>
                    <CardDescription>Manage clause variants and their content</CardDescription>
                  </div>
                  <Dialog open={isAddingClause} onOpenChange={setIsAddingClause}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Clause Variant
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Clause Variant</DialogTitle>
                        <DialogDescription>Create a new clause variant for the clause bank</DialogDescription>
                      </DialogHeader>
                      <ClauseForm onSave={handleSaveClause} onCancel={() => setIsAddingClause(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clauses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clauses Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClauses.map((clause) => (
                        <TableRow key={clause.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{clause.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {clause.content.substring(0, 100)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{clause.category}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {clause.lastModified.toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{clause.createdBy}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingClause(clause)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClause(clause.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template Management */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-heading">Template Management</CardTitle>
                    <CardDescription>Manage intake form templates and document structures</CardDescription>
                  </div>
                  <Dialog open={isAddingTemplate} onOpenChange={setIsAddingTemplate}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Template</DialogTitle>
                        <DialogDescription>Create a new intake form template</DialogDescription>
                      </DialogHeader>
                      <TemplateForm
                        onSave={() => setIsAddingTemplate(false)}
                        onCancel={() => setIsAddingTemplate(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base font-heading">{template.name}</CardTitle>
                            <CardDescription className="text-sm">{template.description}</CardDescription>
                          </div>
                          <Badge className={template.isActive ? "bg-primary/10 text-primary" : "bg-muted"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium">Agreement Type:</span>
                            <span className="text-sm text-muted-foreground ml-2">{template.agreementType}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Clauses:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {template.clauses.slice(0, 3).map((clause, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {clause}
                                </Badge>
                              ))}
                              {template.clauses.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.clauses.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-muted-foreground">
                              Modified {template.lastModified.toLocaleDateString()}
                            </span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                                Edit
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs">
                                Duplicate
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    User management features are available in the enterprise version. Contact support for more
                    information.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">AI Configuration</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ai-suggestions">Enable AI Suggestions</Label>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Enabled
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ai-learning">AI Learning Mode</Label>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Active
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium">Security Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="audit-logging">Audit Logging</Label>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Enabled
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="data-encryption">Data Encryption</Label>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          AES-256
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Clause Dialog */}
        {editingClause && (
          <Dialog open={!!editingClause} onOpenChange={() => setEditingClause(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Clause Variant</DialogTitle>
                <DialogDescription>Modify the clause variant details</DialogDescription>
              </DialogHeader>
              <ClauseForm
                initialData={editingClause}
                onSave={handleSaveClause}
                onCancel={() => setEditingClause(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

function ClauseForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: ClauseVariant
  onSave: (data: Partial<ClauseVariant>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    content: initialData?.content || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Variant Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Standard Mutual"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nature of NDA">Nature of NDA</SelectItem>
              <SelectItem value="Definitions">Definitions</SelectItem>
              <SelectItem value="Confidentiality Obligations">Confidentiality Obligations</SelectItem>
              <SelectItem value="Remedies">Remedies</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="content">Clause Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter the full text of the clause variant..."
          className="min-h-32"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent">
          Cancel
        </Button>
        <Button type="submit">Save Clause</Button>
      </DialogFooter>
    </form>
  )
}

function TemplateForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agreementType: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Tech Startup NDA"
        />
      </div>
      <div>
        <Label htmlFor="template-description">Description</Label>
        <Textarea
          id="template-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of when to use this template..."
        />
      </div>
      <div>
        <Label htmlFor="agreement-type">Agreement Type</Label>
        <Select
          value={formData.agreementType}
          onValueChange={(value) => setFormData({ ...formData, agreementType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select agreement type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Non-Disclosure Agreement">Non-Disclosure Agreement</SelectItem>
            <SelectItem value="Service Agreement">Service Agreement</SelectItem>
            <SelectItem value="Employment Agreement">Employment Agreement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent">
          Cancel
        </Button>
        <Button type="submit">Create Template</Button>
      </DialogFooter>
    </form>
  )
}
