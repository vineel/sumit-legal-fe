import { ProtectedRoute } from "@/components/protected-route"
import { ClauseManagement } from "@/components/admin/clause-management"

export default function ClausesPage() {
  return (
    <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
      <ClauseManagement />
    </ProtectedRoute>
  )
}
