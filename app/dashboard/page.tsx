import { ProtectedRoute } from "@/components/protected-route"
import { PartyDashboard } from "@/components/dashboard/party-dashboard"

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="party">
      <PartyDashboard />
    </ProtectedRoute>
  )
}
