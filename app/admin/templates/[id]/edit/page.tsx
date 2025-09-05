"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClauses, Clause } from "@/lib/clause"
import { getAllTemplates, updateTemplate, Template } from "@/lib/templateApi"
import { ArrowLeft, Upload } from "lucide-react"

export default function EditTemplatePage() {
  const { user, logout } = useAuth()
  const params = useParams()
  const router = useRouter()
  const templateId = params?.id as string

  const [templates, setTemplates] = useState<Template[] | null>(null)
  const [clauses, setClauses] = useState<Clause[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    templatename: "",
    description: "",
    version: "",
    active: true,
    file: null as File | null,
    clauseMode: "existing" as "existing" | "custom",
    clauseIds: [] as string[],
    customClause: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ clauses: list }, temps] = await Promise.all([getClauses(1, 100), getAllTemplates()])
        setClauses(list)
        setTemplates(temps)
        const current = temps.find(t => t._id === templateId)
        if (current) {
          setForm((prev) => ({
            ...prev,
            templatename: current.templatename,
            description: current.description || "",
            version: current.version,
            active: current.active,
          }))
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [templateId])

  const onSubmit = async () => {
    if (!form.templatename || !form.version) return
    const data = new FormData()
    data.append("templatename", form.templatename)
    data.append("description", form.description)
    data.append("version", form.version)
    data.append("active", String(form.active))
    data.append("clauseMode", form.clauseMode)
    if (form.file) data.append("file", form.file)
    if (form.clauseMode === "existing") {
      data.append("clauseIds", JSON.stringify(form.clauseIds))
    } else if (form.clauseMode === "custom" && form.customClause) {
      data.append("customClause", form.customClause)
    }
    try {
      setSubmitting(true)
      await updateTemplate(templateId, data)
      router.push("/admin/templates")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

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
              <h1 className="text-xl font-heading font-semibold">Edit Template</h1>
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
              <Upload className="w-5 h-5" /> Template Details
            </CardTitle>
            <CardDescription>Update template information and linked clauses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templatename">Template Name</Label>
                <Input id="templatename" value={form.templatename} onChange={(e) => setForm({ ...form, templatename: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="version">Version</Label>
                <Input id="version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="file">Replace File (optional)</Label>
              <Input id="file" type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Status</Label>
                <Select value={form.active ? "active" : "inactive"} onValueChange={(v) => setForm({ ...form, active: v === "active" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Clause Mode</Label>
                <Select value={form.clauseMode} onValueChange={(v: any) => setForm({ ...form, clauseMode: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing">Use existing clauses</SelectItem>
                    <SelectItem value="custom">Custom JSON (advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.clauseMode === "existing" && (
              <div>
                <Label>Selected Clause IDs (comma separated)</Label>
                <Input value={form.clauseIds.join(",")} onChange={(e) => setForm({ ...form, clauseIds: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="e.g. 64a..., 64b..." />
              </div>
            )}

            {form.clauseMode === "custom" && (
              <div>
                <Label>Custom Clause JSON</Label>
                <Input value={form.customClause} onChange={(e) => setForm({ ...form, customClause: e.target.value })} placeholder='{"name":"...","variants":[...]} ' />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={submitting}>Save Changes</Button>
              <Button variant="outline" asChild>
                <Link href="/admin/templates">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


