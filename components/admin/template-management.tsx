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
// Edit/Upload now use dedicated pages; dialog imports removed
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
import { getAllTemplates, Template, deleteTemplate, downloadTemplate } from "@/lib/templateApi";
import { getClauses, Clause } from "@/lib/clause";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TemplateManagement() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<TemplateStatsData | null>(null);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  // Local upload/edit state removed

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

  // Clause fetching removed from this page

  const handleDownload = async (id: string) => {
    try {
      const url = await downloadTemplate(id);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download template.");
    }
  };

// Edit submit no longer used here


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
      await refreshTemplates();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // Upload handlers removed

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
          <Button asChild className="gap-2">
            <Link href="/admin/templates/upload">
              <Upload className="w-4 h-4" />
              Upload Template
            </Link>
          </Button>
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

                  <Button asChild size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Link href={`/admin/templates/${template._id}/edit`}>
                      <Edit className="w-3 h-3" />
                      Edit
                    </Link>
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

      {/* Edit handled on dedicated page */}


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
