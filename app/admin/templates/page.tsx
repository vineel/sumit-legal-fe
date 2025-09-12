import { ProtectedRoute } from "@/components/protected-route"
import { TemplateManagement } from "@/components/admin/template-management"

export default function AdminTemplatesPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <TemplateManagement />
    </ProtectedRoute>
  )
}
