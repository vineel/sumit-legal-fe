"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Upload,
  Download,
  Edit,
  Trash2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { fetchTemplateStats, TemplateStatsData } from "@/lib/admin";
import {
  getAllTemplates,
  Template,
  addTemplate,
  deleteTemplate,
  updateTemplate,
  downloadTemplate,
} from "@/lib/templateApi";

export function TemplateManagement() {
  const { user, logout } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState<TemplateStatsData | null>(null);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [uploadForm, setUploadForm] = useState({
    templatename: "",
    description: "",
    version: "",
    file: null as File | null,
  });
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [editForm, setEditForm] = useState({
    templatename: "",
    description: "",
    version: "",
   active: true,
    file: null as File | null,
  });

  const refreshTemplates = async () => {
    try {
      const tempdata = await getAllTemplates();
      setTemplates(tempdata);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  useEffect(() => {
    fetchTemplateStats();
    refreshTemplates();
  }, []);

  const openEditModal = (template: Template) => {
    setEditTemplate(template);
    setEditForm({
      templatename: template.templatename,
      description: template.description || "",
      version: template.version,
      file: null,
      active: template.active ?? true, 
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, files } = e.target;
    if (id === "file") {
      setEditForm((prev) => ({ ...prev, file: files?.[0] || null }));
    } else {
      setEditForm((prev) => ({ ...prev, [id]: value }));
    }
  };
  const handleDownload = async (id: string) => {
    try {
      const url = await downloadTemplate(id);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download template.");
    }
  };

const handleEditSubmit = async () => {
  if (!editTemplate) return;

  const formData = new FormData();
  formData.append("templatename", editForm.templatename);
  formData.append("description", editForm.description);
  formData.append("version", editForm.version);
  formData.append("active", String(editForm.active)); // 👈 append active as string
  if (editForm.file) {
    formData.append("file", editForm.file);
  }

  try {
    await updateTemplate(editTemplate._id, formData);
    setEditTemplate(null); // close modal
    await refreshTemplates();
  } catch (error) {
    console.error("Edit failed", error);
  }
};


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
      await refreshTemplates();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, files } = e.target;
    if (id === "file") {
      setUploadForm((prev) => ({ ...prev, file: files?.[0] || null }));
    } else {
      setUploadForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm.templatename || !uploadForm.version || !uploadForm.file) {
      alert("Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("templatename", uploadForm.templatename);
    formData.append("description", uploadForm.description);
    formData.append("version", uploadForm.version);
    formData.append("file", uploadForm.file);

    try {
      await addTemplate(formData);
      setIsUploading(false);
      setUploadForm({
        templatename: "",
        description: "",
        version: "",
        file: null,
      });
      await refreshTemplates(); // refetch templates
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  useEffect(() => {
    const getStats = async () => {
      try {
        const data = await fetchTemplateStats();
        console.log(data, "stats>>>!2");

        setStats(data);
      } catch (error) {
        console.error("Failed to fetch template stats:", error);
      }
    };

    const getTemplates = async () => {
      try {
        const tempdata = await getAllTemplates();
        console.log(tempdata, "tempdata>>!23");
        setTemplates(tempdata);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      }
    };

    getStats();
    getTemplates();
  }, []);

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
              <h1 className="text-xl font-heading font-semibold">
                Template Management
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.name}
              </span>
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
            <h2 className="text-2xl font-heading font-bold mb-2">
              Document Templates
            </h2>
            <p className="text-muted-foreground">
              Manage NDA templates and document structures
            </p>
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
                <DialogDescription>
                  Upload a new NDA template or document structure
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templatename">Template Name</Label>
                  <Input
                    id="templatename"
                    value={uploadForm.templatename}
                    onChange={handleUploadChange}
                    placeholder="e.g., Enterprise NDA Template"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={uploadForm.description}
                    onChange={handleUploadChange}
                    placeholder="Brief description of this template..."
                  />
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={uploadForm.version}
                    onChange={handleUploadChange}
                    placeholder="e.g., 1.0"
                  />
                </div>
                <div>
                  <Label htmlFor="file">Template File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".docx,.pdf,.json"
                    onChange={handleUploadChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: DOCX, PDF, JSON structure files
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUploadSubmit}>Upload Template</Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsUploading(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card
              key={template._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <div>
                      {/* Use template.templatename instead of template.name */}
                      <CardTitle className="text-lg">
                        {template.templatename}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  {/* Your status badge logic; you might want to use template.active */}
                  <Badge variant={template.active ? "default" : "secondary"}>
                    {template.active ? "active" : "inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <p className="font-medium">{template.version}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clauses Used:</span>
                    {/* Show clauseUsageCount here */}
                    <p className="font-medium">
                      {template?.clauseUsageCount || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modified:</span>
                    {/* Format updatedAt to a readable date */}
                    <p className="font-medium">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                    onClick={() => handleDownload(template._id)}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={() => openEditModal(template)}
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={() => handleDelete(template._id)}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      {editTemplate && (
  <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Template</DialogTitle>
        <DialogDescription>Update the selected template details</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="templatename">Template Name</Label>
          <Input
            id="templatename"
            value={editForm.templatename}
            onChange={handleEditChange}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={editForm.description}
            onChange={handleEditChange}
          />
        </div>

        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={editForm.version}
            onChange={handleEditChange}
          />
        </div>

        <div>
          <Label htmlFor="file">Replace Template File (optional)</Label>
          <Input id="file" type="file" onChange={handleEditChange} />
        </div>

        {/* ✅ Active Toggle */}
 <div className="max-w-[100px]">
  <Label htmlFor="active">Active Status</Label>
  <select
    id="active"
    value={editForm.active ? "true" : "false"}
    onChange={(e) =>
      setEditForm((prev) => ({ ...prev, active: e.target.value === "true" }))
    }
    className="w-full border rounded px-2 py-1 mt-1 text-sm"
  >
    <option value="true">Active</option>
    <option value="false">Inactive</option>
  </select>
</div>



        <div className="flex gap-2">
          <Button onClick={handleEditSubmit}>Save Changes</Button>
          <Button variant="outline" onClick={() => setEditTemplate(null)}>
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}


        {/* Template Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Template Usage Statistics</CardTitle>
            <CardDescription>
              Overview of template performance and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-accent">
                  {stats?.totalTemplates}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Templates
                </div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.activeTemplates}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Templates
                </div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.totalUsage}
                </div>
                <div className="text-sm text-muted-foreground">Total Usage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
