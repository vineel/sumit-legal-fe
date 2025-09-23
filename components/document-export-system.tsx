"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { jsPDF } from "jspdf"; // For PDF generation
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  FileText,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Ligature as Signature,
  Mail,
  Calendar,
  Users,
  Printer,
} from "lucide-react"

interface DocumentExportSystemProps {
  comparisonResults: any[]
  sessionId: string
  parties: { name: string; email: string }[]
}

interface SignatureBlock {
  party: string
  name: string
  title: string
  date: string
  signed: boolean
}

export function DocumentExportSystem({ comparisonResults, sessionId, parties }: DocumentExportSystemProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx" | "txt">("pdf")
  const [includeSignatures, setIncludeSignatures] = useState(true)
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [signatureBlocks, setSignatureBlocks] = useState<SignatureBlock[]>([
    { party: "Brad's Guitars", name: "Brad Johnson", title: "CEO", date: "", signed: false },
    { party: "Meemer VC", name: "Sarah Chen", title: "Managing Partner", date: "", signed: false },
  ])

  const unresolvedCount = comparisonResults.filter((result) => result.isUnresolved).length
  const resolvedCount = comparisonResults.length - unresolvedCount
  const completionPercentage = Math.round((resolvedCount / comparisonResults.length) * 100)

  const generateDocumentContent = () => {
    const resolvedClauses = comparisonResults.filter((result) => !result.isUnresolved)
    const unresolvedClauses = comparisonResults.filter((result) => result.isUnresolved)

    return {
      coverPage: {
        title: "NON-DISCLOSURE AGREEMENT",
        parties: parties,
        date: new Date().toLocaleDateString(),
        sessionId: sessionId,
        status: unresolvedCount > 0 ? "DRAFT" : "FINAL",
      },
      legalTerms: {
        resolved: resolvedClauses.map((clause) => ({
          title: clause.clause,
          content: clause.selectedVariant,
          confidence: clause.confidence || 95,
        })),
        unresolved: unresolvedClauses.map((clause) => ({
          title: clause.clause,
          placeholder: "[REQUIRES NEGOTIATION - INSERT AGREED LANGUAGE]",
          options: clause.bradRanking || [],
        })),
      },
      signatures: includeSignatures ? signatureBlocks : [],
    }
  }

  

 // The main export function
const downloadDocument = (format: "pdf" | "docx" | "txt") => {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const documentContent = generateDocumentContent(); // Generate the content

      // Handle PDF Export
      if (format === "pdf") {
        const doc = new jsPDF();
        doc.text(documentContent.coverPage.title, 10, 10);
        doc.text(`Date: ${documentContent.coverPage.date}`, 10, 20);
        doc.text(`Session ID: ${documentContent.coverPage.sessionId}`, 10, 30);
        doc.text(`Status: ${documentContent.coverPage.status}`, 10, 40);

        // Add Parties
        doc.text("Parties:", 10, 50);
        documentContent.coverPage.parties.forEach((party, index) => {
          doc.text(`- ${party.name} (${party.email})`, 10, 60 + index * 10);
        });

        // Add Legal Terms (Resolved)
        doc.text("LEGAL TERMS:", 10, 70);
        documentContent.legalTerms.resolved.forEach((clause, index) => {
          doc.text(`${index + 1}. ${clause.title.toUpperCase()}: ${clause.content}`, 10, 80 + index * 10);
        });

        doc.save(`NDA_${documentContent.coverPage.sessionId}_${documentContent.coverPage.status}.pdf`);

      } 
      // Handle DOCX Export
      else if (format === "docx") {
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: [
                new Paragraph({
                  children: [
                    new TextRun(documentContent.coverPage.title),
                    new TextRun("\n"),
                    new TextRun(`Date: ${documentContent.coverPage.date}`),
                    new TextRun("\n"),
                    new TextRun(`Session ID: ${documentContent.coverPage.sessionId}`),
                    new TextRun("\n"),
                    new TextRun(`Status: ${documentContent.coverPage.status}`),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun("Parties:")],
                }),
                ...documentContent.coverPage.parties.map((party: any) =>
                  new Paragraph({
                    children: [new TextRun(`- ${party.name} (${party.email})`)],
                  })
                ),
                new Paragraph({
                  children: [new TextRun("LEGAL TERMS:")],
                }),
                ...documentContent.legalTerms.resolved.map((clause: any, index: number) =>
                  new Paragraph({
                    children: [new TextRun(`${index + 1}. ${clause.title.toUpperCase()}: ${clause.content}`)],
                  })
                ),
              ],
            },
          ],
        });

        Packer.toBlob(doc).then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `NDA_${documentContent.coverPage.sessionId}_${documentContent.coverPage.status}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

      } 
      // Handle TXT Export
      else if (format === "txt") {
        const content = formatDocumentForExport(documentContent, "txt");
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `NDA_${documentContent.coverPage.sessionId}_${documentContent.coverPage.status}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

    } catch (error) {
      console.error("Error generating or downloading the document:", error);
    }
  }
};


  const handleExport = async (format: "pdf" | "docx" | "txt") => {
    setIsExporting(true)
    setExportProgress(0)

    // Simulate export progress
    const progressInterval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsExporting(false)
          downloadDocument(format)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  // const downloadDocument = (format: string) => {
  //   const document = generateDocumentContent()
  //   const content = formatDocumentForExport(document, format)

  //   const blob = new Blob([content], {
  //     type:
  //       format === "pdf"
  //         ? "application/pdf"
  //         : format === "docx"
  //           ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  //           : "text/plain",
  //   })

  //   const url = URL.createObjectURL(blob)
  //   const a = document.createElement("a")
  //   a.href = url
  //   a.download = `NDA_${sessionId}_${document.coverPage.status}.${format}`
  //   document.body.appendChild(a)
  //   a.click()
  //   document.body.removeChild(a)
  //   URL.revokeObjectURL(url)
  // }

 





  const formatDocumentForExport = (document: any, format: string) => {
    if (format === "txt") {
      return `
${document.coverPage.title}

Date: ${document.coverPage.date}
Session ID: ${document.coverPage.sessionId}
Status: ${document.coverPage.status}

Parties:
${document.coverPage.parties.map((p: any) => `- ${p.name} (${p.email})`).join("\n")}

LEGAL TERMS:

${document.legalTerms.resolved
  .map(
    (clause: any, index: number) => `
${index + 1}. ${clause.title.toUpperCase()}
${clause.content}
(Confidence: ${clause.confidence}%)
`,
  )
  .join("\n")}

${
  document.legalTerms.unresolved.length > 0
    ? `
UNRESOLVED CLAUSES:
${document.legalTerms.unresolved
  .map(
    (clause: any, index: number) => `
${index + 1}. ${clause.title.toUpperCase()}
${clause.placeholder}
Available Options: ${clause.options.join(", ")}
`,
  )
  .join("\n")}
`
    : ""
}

${
  document.signatures.length > 0
    ? `
SIGNATURE BLOCKS:
${document.signatures
  .map(
    (sig: any) => `
${sig.party}
Name: ${sig.name}
Title: ${sig.title}
Date: ${sig.date || "_________________"}
Signature: _________________________________
`,
  )
  .join("\n")}
`
    : ""
}

Generated by IBD Contracting AI-Assisted Platform
      `.trim()
    }

    // For PDF and DOCX, we would use appropriate libraries
    // This is a simplified version for demonstration
    return formatDocumentForExport(document, "txt")
  }

  const updateSignatureBlock = (index: number, field: string, value: string) => {
    const updated = [...signatureBlocks]
    updated[index] = { ...updated[index], [field]: value }
    setSignatureBlocks(updated)
  }

  return (
    <div className="space-y-6">
      {/* Document Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Export System
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate and export your finalized legal document with professional formatting
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="text-2xl font-bold text-success">{resolvedCount}</div>
              <div className="text-sm text-success">Resolved Clauses</div>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="text-2xl font-bold text-destructive">{unresolvedCount}</div>
              <div className="text-sm text-destructive">Unresolved Clauses</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
              <div className="text-sm text-primary">Complete</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
              <div className="text-2xl font-bold text-accent">{parties.length}</div>
              <div className="text-sm text-accent">Parties</div>
            </div>
          </div>

          <Progress value={completionPercentage} className="mb-4" />

          {unresolvedCount > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Draft Status:</strong> This document contains {unresolvedCount} unresolved clause
                {unresolvedCount > 1 ? "s" : ""} that require negotiation before finalization. Export as draft or
                resolve conflicts first.
              </AlertDescription>
            </Alert>
          )}

          {unresolvedCount === 0 && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ready for Export:</strong> All clauses have been resolved. Your document is ready for final
                export and signatures.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">Export Options</TabsTrigger>
          <TabsTrigger value="preview">Document Preview</TabsTrigger>
          <TabsTrigger value="signatures">Signature Setup</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">Choose format and options for your document export</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${exportFormat === "pdf" ? "ring-2 ring-primary" : ""}`}
                >
                  <CardContent className="p-4" onClick={() => setExportFormat("pdf")}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-red-500" />
                      <div>
                        <h3 className="font-medium">PDF Document</h3>
                        <p className="text-sm text-muted-foreground">Professional format, ready for signatures</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${exportFormat === "docx" ? "ring-2 ring-primary" : ""}`}
                >
                  <CardContent className="p-4" onClick={() => setExportFormat("docx")}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">Word Document</h3>
                        <p className="text-sm text-muted-foreground">Editable format for further customization</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${exportFormat === "txt" ? "ring-2 ring-primary" : ""}`}
                >
                  <CardContent className="p-4" onClick={() => setExportFormat("txt")}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-gray-500" />
                      <div>
                        <h3 className="font-medium">Plain Text</h3>
                        <p className="text-sm text-muted-foreground">Simple format for review and editing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signatures">Include Signature Blocks</Label>
                  <input
                    type="checkbox"
                    id="signatures"
                    checked={includeSignatures}
                    onChange={(e) => setIncludeSignatures(e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating document...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} />
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => handleExport(exportFormat)} disabled={isExporting} className="gap-2" size="lg">
                  <Download className="w-4 h-4" />
                  {unresolvedCount > 0 ? "Export Draft" : "Export Final Document"}
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2 bg-transparent">
                  <Eye className="w-4 h-4" />
                  {showPreview ? "Hide" : "Show"} Preview
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Printer className="w-4 h-4" />
                  Print Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Document Preview</span>
                <Badge variant={unresolvedCount > 0 ? "destructive" : "default"}>
                  {unresolvedCount > 0 ? "DRAFT" : "FINAL"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg p-8 shadow-sm max-h-96 overflow-y-auto">
                <div className="space-y-6 text-sm">
                  {/* Cover Page */}
                  <div className="text-center space-y-4 pb-6 border-b">
                    <h1 className="text-2xl font-bold">NON-DISCLOSURE AGREEMENT</h1>
                    <div className="space-y-2">
                      <p>Between:</p>
                      {parties.map((party, index) => (
                        <p key={index} className="font-medium">
                          {party.name} ({party.email})
                        </p>
                      ))}
                    </div>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Session ID: {sessionId}</p>
                  </div>

                  {/* Legal Terms */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">TERMS AND CONDITIONS</h2>
                    {comparisonResults.map((result, index) => (
                      <div key={index} className="space-y-2">
                        <h3 className="font-medium">
                          {index + 1}. {result.clause.toUpperCase()}
                        </h3>
                        {result.isUnresolved ? (
                          <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                            <p className="text-red-800 font-medium">[REQUIRES NEGOTIATION]</p>
                            <p className="text-sm text-red-600 mt-1">
                              This clause needs resolution before final document generation.
                            </p>
                          </div>
                        ) : (
                          <p className="leading-relaxed">{result.selectedVariant}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Signature Blocks */}
                  {includeSignatures && (
                    <div className="space-y-4 pt-6 border-t">
                      <h2 className="text-lg font-semibold">SIGNATURES</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {signatureBlocks.map((sig, index) => (
                          <div key={index} className="space-y-3 p-4 border rounded">
                            <h4 className="font-medium">{sig.party}</h4>
                            <div className="space-y-2">
                              <p>Name: {sig.name}</p>
                              <p>Title: {sig.title}</p>
                              <p>Date: _________________</p>
                              <p>Signature: _________________________________</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signatures" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signature className="w-5 h-5" />
                Signature Block Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">Configure signature information for all parties</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {signatureBlocks.map((sig, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{sig.party}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${index}`}>Signatory Name</Label>
                        <Input
                          id={`name-${index}`}
                          value={sig.name}
                          onChange={(e) => updateSignatureBlock(index, "name", e.target.value)}
                          placeholder="Full legal name"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`title-${index}`}>Title/Position</Label>
                        <Input
                          id={`title-${index}`}
                          value={sig.title}
                          onChange={(e) => updateSignatureBlock(index, "title", e.target.value)}
                          placeholder="CEO, Managing Partner, etc."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Document Distribution
              </CardTitle>
              <p className="text-sm text-muted-foreground">Send the document to all parties for review and signature</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {parties.map((party, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{party.name}</p>
                        <p className="text-sm text-muted-foreground">{party.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Mail className="w-4 h-4" />
                      Send Document
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <Label htmlFor="message">Custom Message (Optional)</Label>
                <Textarea id="message" placeholder="Add a personal message to accompany the document..." rows={4} />
              </div>

              <div className="flex gap-3">
                <Button className="gap-2">
                  <Mail className="w-4 h-4" />
                  Send to All Parties
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Calendar className="w-4 h-4" />
                  Schedule Delivery
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
