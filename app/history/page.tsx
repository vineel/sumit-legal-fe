import { ProtectedRoute } from "@/components/protected-route"
import { HistoryAnalytics } from "@/components/history-analytics"

export default function HistoryPage() {
  return (
    <ProtectedRoute requiredRole="party">
      <HistoryAnalytics />
    </ProtectedRoute>
  )
}
