"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileDown,
  Printer,
  Share2,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Sample clause bank data based on the project documents
const clauseBank = {
  "Nature of NDA (Mutual vs. Unilateral)": {
    "Standard Mutual":
      "Each party anticipates disclosing certain confidential or proprietary information to the other in connection with their potential business relationship. Accordingly, both parties agree to maintain such information in confidence and to use it solely as provided in this Agreement.",
    "Flexible Mutual with Carveouts":
      "Each party may disclose confidential information to the other, subject to the exclusions and limitations set forth herein. Both parties acknowledge that certain information may require different levels of protection based on its nature and sensitivity.",
    "Unilateral Discloser-Only":
      "Discloser may provide certain confidential information to Recipient for evaluation purposes. Recipient agrees to maintain such information in strict confidence and use it solely for the purposes outlined in this Agreement.",
  },
  Definitions: {
    Comprehensive:
      "Confidential Information refers to any and all information, data, materials, products, technology, computer programs, software, marketing plans, business plans, financial information, customer lists, supplier information, know-how, trade secrets, and any other proprietary information disclosed by one party to the other, whether orally, in writing, electronically, or by any other means.",
    "Lean Definitions":
      "Confidential Information refers to any information, whether disclosed orally, visually, or in writing, that a reasonable person would consider confidential under the circumstances. This may include, without limitation, technical data, product plans, and business forecasts.",
    "Minimal Definitions":
      "Confidential Information means any proprietary information clearly marked as confidential at the time of disclosure.",
  },
  "Confidentiality Obligations": {
    "Mutual Balanced":
      "Each party shall maintain the confidentiality of Confidential Information received from the other party using the same degree of care it applies to its own confidential information, but in no event less than reasonable care.",
    "Strict Mutual (Enhanced Care Standard)":
      "Each party shall maintain the confidentiality of Confidential Information received from the other party using the highest degree of care it applies to its own confidential information and, in any event, no less than a commercially reasonable standard of care. Each party shall also ensure that its employees and contractors are bound by confidentiality obligations at least as restrictive as those contained herein.",
    "Unilateral Recipient Obligations":
      "Recipient shall maintain the confidentiality of all Confidential Information using the highest standard of care and shall not disclose such information to any third party without the prior written consent of Discloser.",
  },
}

// Sample resolved clauses based on the comparison data
const resolvedClauses = {
  "Nature of NDA (Mutual vs. Unilateral)": "Standard Mutual",
  Definitions: "Lean Definitions",
  "Confidentiality Obligations": "Strict Mutual (Enhanced Care Standard)",
  "Purpose of Disclosure": "Specific Purpose",
  "Use Restrictions": "Purpose-Bound Use",
  "Exclusions from Confidentiality": "Standard Exclusions",
  "Term of Confidentiality": null, // Unresolved
  "Compelled Disclosure": "Notice and Assist",
  "Return or Destruction of Information": "Destruction Preferred",
  Remedies: "Equitable Relief Standard",
}

export function DocumentGenerator() {
  const [activeTab, setActiveTab] = useState("preview")
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState(new Date())

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate document generation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLastGenerated(new Date())
    setIsGenerating(false)
  }

  const handleExport = (format: string) => {
    // Simulate export functionality
    console.log(`Exporting document as ${format}`)
  }

  const getClauseStatus = (clauseName: string) => {
    const resolved = resolvedClauses[clauseName as keyof typeof resolvedClauses]
    if (resolved === null) return "unresolved"
    if (resolved) return "resolved"
    return "pending"
  }

  const generateDocumentContent = () => {
    let content = ""
    let clauseNumber = 1

    Object.entries(resolvedClauses).forEach(([clauseName, selectedVariant]) => {
      if (selectedVariant && clauseBank[clauseName as keyof typeof clauseBank]) {
        const clauseText =
          clauseBank[clauseName as keyof typeof clauseBank][
            selectedVariant as keyof (typeof clauseBank)[keyof typeof clauseBank]
          ]
        if (clauseText) {
          content += `${clauseNumber}. ${clauseName.toUpperCase()}\n${clauseText}\n\n`
          clauseNumber++
        }
      } else if (selectedVariant === null) {
        content += `${clauseNumber}. ${clauseName.toUpperCase()}\n[🔴 UNRESOLVED – INSERT NEGOTIATED LANGUAGE HERE]\n\n`
        clauseNumber++
      }
    })

    return content
  }

  const resolvedCount = Object.values(resolvedClauses).filter((v) => v !== null).length
  const totalCount = Object.keys(resolvedClauses).length
  const completionPercentage = Math.round((resolvedCount / totalCount) * 100)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Document Generator</h1>
              <p className="text-muted-foreground">AI-powered document assembly from resolved clause preferences</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Generating..." : "Regenerate"}
              </Button>
              <Button variant="outline" onClick={() => handleExport("pdf")} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  <div>
                    <div className="text-lg font-bold">{resolvedCount}</div>
                    <div className="text-sm text-muted-foreground">Resolved Clauses</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  <div>
                    <div className="text-lg font-bold">{totalCount - resolvedCount}</div>
                    <div className="text-sm text-muted-foreground">Unresolved</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-accent" />
                  <div>
                    <div className="text-lg font-bold">{completionPercentage}%</div>
                    <div className="text-sm text-muted-foreground">Complete</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-chart-1" />
                  <div>
                    <div className="text-lg font-bold">{lastGenerated.toLocaleTimeString()}</div>
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unresolved Clauses Alert */}
          {totalCount - resolvedCount > 0 && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {totalCount - resolvedCount} clause{totalCount - resolvedCount > 1 ? "s" : ""} remain unresolved. The
                document will contain placeholder text for these sections until they are negotiated.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Document Preview
            </TabsTrigger>
            <TabsTrigger value="clauses" className="gap-2">
              <FileText className="w-4 h-4" />
              Clause Breakdown
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Export Options
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Non-Disclosure Agreement</CardTitle>
                <CardDescription>
                  Generated from AI-assisted clause matching • Last updated {lastGenerated.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full border rounded-lg p-6 bg-card">
                  <div className="space-y-6 font-mono text-sm leading-relaxed">
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-bold font-heading">NON-DISCLOSURE AGREEMENT</h2>
                      <p className="text-muted-foreground">Between Brad's Guitars and Meemer VC</p>
                    </div>
                    <Separator />
                    <div className="whitespace-pre-line">{generateDocumentContent()}</div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clauses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Clause Resolution Status</CardTitle>
                <CardDescription>Detailed breakdown of all clauses and their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(resolvedClauses).map(([clauseName, selectedVariant]) => {
                    const status = getClauseStatus(clauseName)
                    return (
                      <div key={clauseName} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium">{clauseName}</h3>
                            {selectedVariant && (
                              <Badge className="mt-1 bg-primary/10 text-primary">{selectedVariant}</Badge>
                            )}
                            {selectedVariant === null && (
                              <Badge variant="destructive" className="mt-1">
                                Unresolved
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {status === "resolved" && <CheckCircle className="w-5 h-5 text-primary" />}
                            {status === "unresolved" && <AlertCircle className="w-5 h-5 text-destructive" />}
                          </div>
                        </div>
                        {selectedVariant && clauseBank[clauseName as keyof typeof clauseBank] && (
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                            {
                              clauseBank[clauseName as keyof typeof clauseBank][
                                selectedVariant as keyof (typeof clauseBank)[keyof typeof clauseBank]
                              ]
                            }
                          </div>
                        )}
                        {selectedVariant === null && (
                          <div className="text-sm text-destructive bg-destructive/5 p-3 rounded border border-destructive/20">
                            This clause requires negotiation between parties before the document can be finalized.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <FileDown className="w-5 h-5" />
                    Document Formats
                  </CardTitle>
                  <CardDescription>Export the generated document in various formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleExport("pdf")}
                    className="w-full justify-start gap-3"
                    disabled={totalCount - resolvedCount > 0}
                  >
                    <FileText className="w-4 h-4" />
                    Export as PDF
                  </Button>
                  <Button
                    onClick={() => handleExport("docx")}
                    variant="outline"
                    className="w-full justify-start gap-3 bg-transparent"
                    disabled={totalCount - resolvedCount > 0}
                  >
                    <FileText className="w-4 h-4" />
                    Export as Word Document
                  </Button>
                  <Button
                    onClick={() => handleExport("txt")}
                    variant="outline"
                    className="w-full justify-start gap-3 bg-transparent"
                  >
                    <FileText className="w-4 h-4" />
                    Export as Plain Text
                  </Button>
                  {totalCount - resolvedCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Complete document exports are disabled until all clauses are resolved.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Sharing Options
                  </CardTitle>
                  <CardDescription>Share the document with stakeholders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-3 bg-transparent">
                    <Share2 className="w-4 h-4" />
                    Generate Shareable Link
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 bg-transparent">
                    <Printer className="w-4 h-4" />
                    Print Document
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 bg-transparent">
                    <FileText className="w-4 h-4" />
                    Email to Parties
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Document Metadata</CardTitle>
                <CardDescription>Information about the generated document</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Document Type:</span>
                    <span className="ml-2 text-muted-foreground">Non-Disclosure Agreement</span>
                  </div>
                  <div>
                    <span className="font-medium">Parties:</span>
                    <span className="ml-2 text-muted-foreground">Brad's Guitars, Meemer VC</span>
                  </div>
                  <div>
                    <span className="font-medium">Generated:</span>
                    <span className="ml-2 text-muted-foreground">{lastGenerated.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">
                      {totalCount - resolvedCount === 0 ? (
                        <Badge className="bg-primary/10 text-primary">Complete</Badge>
                      ) : (
                        <Badge variant="outline">Pending Resolution</Badge>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Word Count:</span>
                    <span className="ml-2 text-muted-foreground">
                      ~{generateDocumentContent().split(" ").length} words
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Clauses:</span>
                    <span className="ml-2 text-muted-foreground">
                      {resolvedCount}/{totalCount} resolved
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
