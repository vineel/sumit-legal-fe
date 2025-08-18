import { ProtectedRoute } from "@/components/protected-route"
import { AuditLogs } from "@/components/admin/audit-logs"

export default function AuditPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AuditLogs />
    </ProtectedRoute>
  )
}
