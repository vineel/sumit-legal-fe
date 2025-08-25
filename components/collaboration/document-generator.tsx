"use client"

import { DocumentExportSystem } from "@/components/document-export-system"

interface DocumentGeneratorProps {
  comparisonResults: any[]
  sessionId: string
}

export function DocumentGenerator({ comparisonResults, sessionId }: DocumentGeneratorProps) {
  const mockParties = [
    { name: "Brad's Guitars", email: "brad@bradsguitar.com" },
    { name: "Meemer VC", email: "legal@meemer.vc" },
  ]

  return <DocumentExportSystem comparisonResults={comparisonResults} sessionId={sessionId} parties={mockParties} />
}
