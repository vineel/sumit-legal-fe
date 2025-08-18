"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Upload, Download, Edit, Trash2, FileText } from "lucide-react"
import Link from "next/link"

// Mock template data
const mockTemplates = [
  {
    id: "1",
    name: "Standard NDA Template",
    description: "Basic mutual NDA template for general business use",
    version: "2.1",
    status: "active",
    lastModified: "2024-01-15",
    usageCount: 45,
    clauses: 19,
  },
  {
    id: "2",
    name: "Tech Company NDA",
    description: "Enhanced NDA template for technology companies with IP protection",
    version: "1.3",
    status: "active",
    lastModified: "2024-01-10",
    usageCount: 23,
    clauses: 22,
  },
  {
    id: "3",
    name: "Investment NDA",
    description: "Specialized template for investment and funding discussions",
    version: "1.0",
    status: "draft",
    lastModified: "2024-01-08",
    usageCount: 0,
    clauses: 16,
  },
]

export function TemplateManagement() {
  const { user, logout } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

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
              <h1 className="text-xl font-heading font-semibold">Template Management</h1>
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
            <h2 className="text-2xl font-heading font-bold mb-2">Document Templates</h2>
            <p className="text-muted-foreground">Manage NDA templates and document structures</p>
          </div>
          <Dialog open={isUploading} onOpenChange={setIsUploading}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Template</DialogTitle>
                <DialogDescription>Upload a new NDA template or document structure</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input id="templateName" placeholder="e.g., Enterprise NDA Template" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="Brief description of this template..." />
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input id="version" placeholder="e.g., 1.0" />
                </div>
                <div>
                  <Label htmlFor="file">Template File</Label>
                  <Input id="file" type="file" accept=".docx,.pdf,.json" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: DOCX, PDF, JSON structure files
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsUploading(false)}>Upload Template</Button>
                  <Button variant="outline" onClick={() => setIsUploading(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={template.status === "active" ? "default" : "secondary"}>{template.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <p className="font-medium">{template.version}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clauses:</span>
                    <p className="font-medium">{template.clauses}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Usage:</span>
                    <p className="font-medium">{template.usageCount} times</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modified:</span>
                    <p className="font-medium">{template.lastModified}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-2 bg-transparent">
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Template Usage Statistics</CardTitle>
            <CardDescription>Overview of template performance and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-accent">{mockTemplates.length}</div>
                <div className="text-sm text-muted-foreground">Total Templates</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {mockTemplates.filter((t) => t.status === "active").length}
                </div>
                <div className="text-sm text-muted-foreground">Active Templates</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {mockTemplates.reduce((sum, t) => sum + t.usageCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Usage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
