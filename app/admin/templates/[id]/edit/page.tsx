"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  updateClause,
  deleteClause,
  updateClauseVariant,
  deleteClauseVariant,
  getClauses,
  Clause as LibClause,
  createClauseVariant,
} from "@/lib/clause";
import {
  getTemplateById,
  updateTemplate,
  Template as ApiTemplate,
} from "@/lib/templateApi";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Upload, Search, Eye, CheckCircle } from "lucide-react";

// Interface for Template and Clause Data
interface TemplateVariant {
  _id: string;
  name: string;
  riskLevel: "low" | "medium" | "high";
  legalText: string;
  status: "active" | "inactive";
  version: number;
}

interface TemplateClause {
  _id: string;
  name: string;
  category: string;
  description: string;
  required: boolean;
  status: "active" | "inactive";
  createdBy: string;
  variants: TemplateVariant[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Template {
  isCustom: boolean;
  _id: string;
  userid: string;
  templatename: string;
  description: string;
  clauses: TemplateClause[];
  active: boolean;
  version: string;
  templatefile: string;
  createdAt: string;
  updatedAt: string;
  _v: number;
}

export default function EditTemplatePage() {
  const { user, logout } = useAuth();
  const params = useParams();
  const router = useRouter();
  const templateId = params?.id as string;

  const [template, setTemplate] = useState<ApiTemplate | null>(null); // Changed to ApiTemplate
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [clausesDraft, setClausesDraft] = useState<TemplateClause[]>([]);
  const [savingIds, setSavingIds] = useState<{
    clauseId?: string;
    variantId?: string;
  }>({});

  // Clause Options UI state
  const [clauseMode, setClauseMode] = useState<"existing" | "custom">(
    "existing"
  );
  const [clauses, setClauses] = useState<LibClause[]>([]);
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewClause, setPreviewClause] = useState<LibClause | null>(null);
  const [firstClauseIsCustom, setFirstClauseIsCustom] = useState<
    boolean | null
  >(null);
  const [customClauses, setCustomClauses] = useState([
    {
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
    },
  ]);

  const [form, setForm] = useState({
    templatename: "",
    description: "",
    version: "",
    active: true,
    file: null as File | null,
    clauseMode: "existing" as "existing" | "custom", // Make sure the initial value is one of the valid values
    clauseIds: [] as string[], // Array to hold clause IDs for existing clauses
    customClause: "", // For custom JSON clause input
  });

  // Fetch the template details when the component loads
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const templateData = await getTemplateById(templateId);
        console.log(templateData, "templateData>>123");
        setTemplate(templateData);

        setForm((prev) => ({
          ...prev,
          templatename: templateData.templatename,
          description: templateData.description || "",
          version: templateData.version,
          active: templateData.active,
          clauseIds: templateData.clauses!?.map((clause) => clause._id),
        }));
        const clauses = templateData?.clauses || [];
        setClausesDraft(
          (templateData.clauses || []) as unknown as TemplateClause[]
        );
        setSelectedClauseIds(
          (templateData.clauses || []).map((c: any) => c._id)
        );
        if (clauses.length > 0) {
          const firstIsCustom =
            (clauses[0] as { isCustom?: boolean }).isCustom ?? null;
          console.log("First clause isCustom:", firstIsCustom);
          setFirstClauseIsCustom(firstIsCustom);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  // Load clauses list for selection
  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const { clauses: list } = await getClauses(1, 200);
        setClauses(list as any);
      } catch {}
    };
    fetchClauses();
  }, []);

  useEffect(() => {
    if (firstClauseIsCustom === true) {
      setClauseMode("custom");
    } else if (firstClauseIsCustom === false) {
      setClauseMode("existing");
    }
  }, [firstClauseIsCustom]);

  const onSubmit = async () => {
    if (!form.templatename || !form.version) return;

    const data = new FormData();
    data.append("templatename", form.templatename);
    data.append("description", form.description);
    data.append("version", form.version);
    data.append("active", String(form.active));
    data.append("clauseMode", clauseMode);

    if (form.file) data.append("file", form.file);
    if (clauseMode === "existing") {
      data.append("clauseIds", JSON.stringify(selectedClauseIds));
    } else if (clauseMode === "custom") {
      if (customClauses.length === 1) {
        data.append("customClause", JSON.stringify(customClauses[0]));
      } else {
        data.append("customClauses", JSON.stringify(customClauses));
      }
    }

    try {
      setSubmitting(true);
      await updateTemplate(templateId, data);
      router.push("/admin/templates");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshTemplate = async () => {
    const templateData = await getTemplateById(templateId);
    setTemplate(templateData);
    setClausesDraft(
      (templateData.clauses || []) as unknown as TemplateClause[]
    );
  };

  const handleClauseFieldChange = (
    clauseId: string,
    field: keyof TemplateClause,
    value: any
  ) => {
    setClausesDraft((prev) =>
      prev.map((c) => (c._id === clauseId ? { ...c, [field]: value } : c))
    );
  };

  const handleVariantFieldChange = (
    clauseId: string,
    variantId: string,
    field: keyof TemplateVariant,
    value: any
  ) => {
    setClausesDraft((prev) =>
      prev.map((c) =>
        c._id === clauseId
          ? {
              ...c,
              variants: c.variants.map((v) =>
                v._id === variantId ? { ...v, [field]: value } : v
              ),
            }
          : c
      )
    );
  };

  const onSaveClause = async (clause: TemplateClause) => {
    try {
      setSavingIds({ clauseId: clause._id });
      await updateClause(clause._id, {
        name: clause.name,
        category: clause.category,
        description: clause.description,
        required: clause.required,
        status: clause.status,
      });
      await refreshTemplate();
    } finally {
      setSavingIds({});
    }
  };

  const onDeleteClause = async (clauseId: string) => {
    try {
      setSavingIds({ clauseId });
      await deleteClause(clauseId);
      await refreshTemplate();
    } finally {
      setSavingIds({});
    }
  };

  const onSaveVariant = async (clauseId: string, variant: TemplateVariant) => {
    try {
      setSavingIds({ clauseId, variantId: variant._id });
      await updateClauseVariant(clauseId, variant._id, {
        name: variant.name,
        riskLevel: variant.riskLevel,
        legalText: variant.legalText,
        status: variant.status,
        version: variant.version,
      } as any);
      await refreshTemplate();
    } finally {
      setSavingIds({});
    }
  };

  const onDeleteVariant = async (variantId: string) => {
    try {
      setSavingIds({ variantId });
      await deleteClauseVariant(variantId);
      await refreshTemplate();
    } finally {
      setSavingIds({});
    }
  };

  if (loading)
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

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
              <h1 className="text-xl font-heading font-semibold">
                Edit Template
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Template Details
            </CardTitle>
            <CardDescription>
              Update template information and linked clauses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templatename">Template Name</Label>
                <Input
                  id="templatename"
                  value={form.templatename}
                  onChange={(e) =>
                    setForm({ ...form, templatename: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={form.version}
                  onChange={(e) =>
                    setForm({ ...form, version: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="file">Replace File (optional)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) =>
                  setForm({ ...form, file: e.target.files?.[0] || null })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Status</Label>
                <Select
                  value={form.active ? "active" : "inactive"}
                  onValueChange={(v) =>
                    setForm({ ...form, active: v === "active" })
                  }
                >
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
                <Label>Clause Source</Label>

                <Select
                  value={clauseMode}
                  onValueChange={(v: "existing" | "custom") => setClauseMode(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing">
                      Use existing clause
                    </SelectItem>
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
                    <Input
                      placeholder="Search clause types and descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Core Structure">
                        Core Structure
                      </SelectItem>
                      <SelectItem value="Legal Framework">
                        Legal Framework
                      </SelectItem>
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
                  {clauses
                    .filter((c) => {
                      const lower = searchTerm.toLowerCase();
                      const matchesSearch =
                        c.name.toLowerCase().includes(lower) ||
                        (c.description || "").toLowerCase().includes(lower);
                      const matchesCategory =
                        categoryFilter === "all" ||
                        c.category === categoryFilter;
                      const matchesStatus =
                        statusFilter === "all" ||
                        (c.status as any) === statusFilter;
                      return matchesSearch && matchesCategory && matchesStatus;
                    })
                    .map((clause) => (
                      <Card
                        key={clause._id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-xl font-heading">
                                  {clause.name}
                                </CardTitle>
                                {clause.required && (
                                  <Badge variant="secondary">Required</Badge>
                                )}
                                <Badge variant="outline">
                                  {clause.category}
                                </Badge>
                              </div>
                              <CardDescription className="text-base mb-3">
                                {clause.description}
                              </CardDescription>
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div className="col-span-4">
                                  <span className="text-muted-foreground">
                                    Variants:
                                  </span>
                                  <span className="font-medium text-primary ml-2">
                                    {clause.variants?.length || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-transparent"
                                onClick={() => {
                                  setPreviewClause(clause as any);
                                  setPreviewOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => {
                                  setSelectedClauseIds((prev) =>
                                    prev.includes(clause._id)
                                      ? prev.filter((id) => id !== clause._id)
                                      : [...prev, clause._id]
                                  );
                                }}
                              >
                                {selectedClauseIds.includes(clause._id) && (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                {selectedClauseIds.includes(clause._id)
                                  ? "Deselect"
                                  : "Select"}
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
              <div className="space-y-6">
                {customClauses.map((cc, ccIdx) => (
                  <div key={ccIdx} className="space-y-4 border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Custom Clause {ccIdx + 1}
                      </div>
                      <div className="flex gap-2">
                        {customClauses.length > 1 && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              setCustomClauses(
                                customClauses.filter((_, i) => i !== ccIdx)
                              )
                            }
                          >
                            Remove Clause
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            const next = [...customClauses];
                            next.splice(ccIdx + 1, 0, {
                              name: "",
                              category: "Core Structure",
                              description: "",
                              required: false,
                              status: "active",
                              variants: [
                                {
                                  name: "",
                                  riskLevel: "low",
                                  legalText: "",
                                  status: "active",
                                  version: 1,
                                },
                              ],
                            });
                            setCustomClauses(next);
                          }}
                        >
                          Duplicate
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Clause Name</Label>
                        <Input
                          value={cc.name}
                          onChange={(e) => {
                            const next = [...customClauses];
                            next[ccIdx] = {
                              ...next[ccIdx],
                              name: e.target.value,
                            };
                            setCustomClauses(next);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={cc.category}
                          onValueChange={(v) => {
                            const next = [...customClauses];
                            next[ccIdx] = { ...next[ccIdx], category: v };
                            setCustomClauses(next);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Core Structure">
                              Core Structure
                            </SelectItem>
                            <SelectItem value="Legal Framework">
                              Legal Framework
                            </SelectItem>
                            <SelectItem value="Obligations">
                              Obligations
                            </SelectItem>
                            <SelectItem value="Restrictions">
                              Restrictions
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={cc.description}
                        onChange={(e) => {
                          const next = [...customClauses];
                          next[ccIdx] = {
                            ...next[ccIdx],
                            description: e.target.value,
                          };
                          setCustomClauses(next);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          id={`cc_required_${ccIdx}`}
                          checked={cc.required}
                          onChange={(e) => {
                            const next = [...customClauses];
                            next[ccIdx] = {
                              ...next[ccIdx],
                              required: e.target.checked,
                            };
                            setCustomClauses(next);
                          }}
                        />
                        <Label htmlFor={`cc_required_${ccIdx}`}>Required</Label>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={cc.status}
                          onValueChange={(v: any) => {
                            const next = [...customClauses];
                            next[ccIdx] = { ...next[ccIdx], status: v };
                            setCustomClauses(next);
                          }}
                        >
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
                    <div className="text-sm font-medium pt-2">
                      Custom Variants
                    </div>
                    <div className="space-y-4">
                      {cc.variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="border rounded-md p-3 space-y-3"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Variant Name</Label>
                              <Input
                                value={v.name}
                                onChange={(e) => {
                                  const next = [...customClauses];
                                  const nv = [...next[ccIdx].variants];
                                  nv[idx] = {
                                    ...nv[idx],
                                    name: e.target.value,
                                  };
                                  next[ccIdx] = {
                                    ...next[ccIdx],
                                    variants: nv,
                                  };
                                  setCustomClauses(next);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Risk Level</Label>
                              <Select
                                value={v.riskLevel}
                                onValueChange={(val: any) => {
                                  const next = [...customClauses];
                                  const nv = [...next[ccIdx].variants];
                                  nv[idx] = { ...nv[idx], riskLevel: val };
                                  next[ccIdx] = {
                                    ...next[ccIdx],
                                    variants: nv,
                                  };
                                  setCustomClauses(next);
                                }}
                              >
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
                            <Textarea
                              value={v.legalText}
                              onChange={(e) => {
                                const next = [...customClauses];
                                const nv = [...next[ccIdx].variants];
                                nv[idx] = {
                                  ...nv[idx],
                                  legalText: e.target.value,
                                };
                                next[ccIdx] = { ...next[ccIdx], variants: nv };
                                setCustomClauses(next);
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Variant Status</Label>
                              <Select
                                value={v.status}
                                onValueChange={(val: any) => {
                                  const next = [...customClauses];
                                  const nv = [...next[ccIdx].variants];
                                  nv[idx] = { ...nv[idx], status: val };
                                  next[ccIdx] = {
                                    ...next[ccIdx],
                                    variants: nv,
                                  };
                                  setCustomClauses(next);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">
                                    Inactive
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Version</Label>
                              <Input
                                type="number"
                                value={v.version}
                                onChange={(e) => {
                                  const next = [...customClauses];
                                  const nv = [...next[ccIdx].variants];
                                  nv[idx] = {
                                    ...nv[idx],
                                    version: Number(e.target.value) || 1,
                                  };
                                  next[ccIdx] = {
                                    ...next[ccIdx],
                                    variants: nv,
                                  };
                                  setCustomClauses(next);
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                const next = [...customClauses];
                                next[ccIdx] = {
                                  ...next[ccIdx],
                                  variants: next[ccIdx].variants.filter(
                                    (_, i) => i !== idx
                                  ),
                                };
                                setCustomClauses(next);
                              }}
                            >
                              Remove Variant
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const next = [...customClauses];
                                next[ccIdx] = {
                                  ...next[ccIdx],
                                  variants: [
                                    ...next[ccIdx].variants,
                                    {
                                      name: "",
                                      riskLevel: "low",
                                      legalText: "",
                                      status: "active",
                                      version: 1,
                                    },
                                  ],
                                };
                                setCustomClauses(next);
                              }}
                            >
                              Add Variant
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    setCustomClauses([
                      ...customClauses,
                      {
                        name: "",
                        category: "Core Structure",
                        description: "",
                        required: false,
                        status: "active",
                        variants: [
                          {
                            name: "",
                            riskLevel: "low",
                            legalText: "",
                            status: "active",
                            version: 1,
                          },
                        ],
                      },
                    ])
                  }
                >
                  Add Another Clause
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={onSubmit}
                disabled={
                  submitting ||
                  !form.templatename ||
                  !form.version ||
                  (clauseMode === "existing" &&
                    selectedClauseIds.length === 0) ||
                  (clauseMode === "custom" &&
                    !(
                      customClauses.length > 0 &&
                      customClauses.every(
                        (cc) =>
                          cc.name &&
                          cc.description &&
                          cc.variants.length > 0 &&
                          cc.variants.every((v) => v.name && v.legalText)
                      )
                    ))
                }
              >
                Save Changes
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/templates">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewClause?.name}</DialogTitle>
              <DialogDescription>{previewClause?.category}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {previewClause?.description}
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-2">
                  Variants ({previewClause?.variants?.length || 0})
                </div>
                <div className="space-y-3 max-h-80 overflow-auto">
                  {previewClause?.variants?.map((v: any) => (
                    <div key={v._id} className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{v.name}</span>
                        <Badge variant="outline">
                          {(v.status || "").toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          v{v.version}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {v.legalText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}


 