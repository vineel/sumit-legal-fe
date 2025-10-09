import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export function IntakeInstructions() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <FileText className="w-5 h-5" />
          Instructions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>For each clause group, reject any option you can't accept as-is, then rank the remaining acceptable options (1 = preferred; higher numbers = fallbacks).</strong> During reconciliation, the system keeps only mutually acceptable variants; if none overlap it flags a Red Light, if one remains—or both parties ranked the same variant #1—it's auto-selected. Otherwise it scores each shared variant S = (RankA + RankB) + |RankA − RankB|, selects the lowest score, and breaks ties by smaller gap, then lower sum, then random.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
