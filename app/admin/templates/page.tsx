import { ProtectedRoute } from "@/components/protected-route"
import { TemplateManagementNew } from "@/components/admin/template-management-new"

export default function AdminTemplatesPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <TemplateManagementNew />
    </ProtectedRoute>
  )
}
