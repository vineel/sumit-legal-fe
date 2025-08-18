"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import Link from "next/link"

// Mock clause data
const mockClauses = [
  {
    id: "1",
    type: "Nature of NDA (Mutual vs. Unilateral)",
    variants: [
      {
        id: "1a",
        name: "Standard Mutual",
        text: "Both parties may disclose confidential information...",
        status: "active",
      },
      {
        id: "1b",
        name: "Flexible Mutual with Carveouts",
        text: "Both parties may disclose with specific exceptions...",
        status: "active",
      },
      {
        id: "1c",
        name: "Unilateral Discloser-Only",
        text: "Only one party discloses confidential information...",
        status: "active",
      },
    ],
    required: true,
    lastModified: "2024-01-15",
  },
  {
    id: "2",
    type: "Definitions",
    variants: [
      { id: "2a", name: "Comprehensive", text: "Confidential Information means all information...", status: "active" },
      {
        id: "2b",
        name: "Lean Definitions",
        text: "Confidential Information refers to information...",
        status: "active",
      },
      {
        id: "2c",
        name: "Minimal Definitions",
        text: "Confidential Information means information marked...",
        status: "draft",
      },
    ],
    required: true,
    lastModified: "2024-01-12",
  },
]

export function ClauseManagement() {
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClause, setSelectedClause] = useState<any>(null)
  const [isAddingClause, setIsAddingClause] = useState(false)
  const [isAddingVariant, setIsAddingVariant] = useState(false)

  const filteredClauses = mockClauses.filter((clause) => clause.type.toLowerCase().includes(searchTerm.toLowerCase()))

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
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-heading font-bold mb-2">Clause Bank Management</h2>
            <p className="text-muted-foreground">Manage clause types and their variants</p>
          </div>
          <Dialog open={isAddingClause} onOpenChange={setIsAddingClause}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Clause Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Clause Type</DialogTitle>
                <DialogDescription>Create a new clause type with initial variants</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clauseType">Clause Type Name</Label>
                  <Input id="clauseType" placeholder="e.g., Governing Law" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of this clause type..." />
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

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search clause types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Clauses List */}
        <div className="space-y-6">
          {filteredClauses.map((clause) => (
            <Card key={clause.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {clause.type}
                      {clause.required && <Badge variant="secondary">Required</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {clause.variants.length} variants • Last modified: {clause.lastModified}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isAddingVariant} onOpenChange={setIsAddingVariant}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Plus className="w-4 h-4" />
                          Add Variant
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Clause Variant</DialogTitle>
                          <DialogDescription>Add a new variant for {clause.type}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="variantName">Variant Name</Label>
                            <Input id="variantName" placeholder="e.g., Enhanced Protection" />
                          </div>
                          <div>
                            <Label htmlFor="variantText">Legal Text</Label>
                            <Textarea
                              id="variantText"
                              placeholder="Enter the legal text for this variant..."
                              rows={6}
                            />
                          </div>
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
                    <div key={variant.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{variant.name}</h4>
                          <Badge
                            variant={
                              variant.status === "active"
                                ? "default"
                                : variant.status === "draft"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {variant.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{variant.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
