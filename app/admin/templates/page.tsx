import { ProtectedRoute } from "@/components/protected-route"
import { TemplateManagement } from "@/components/admin/template-management"

export default function TemplatesPage() {
  return (
    <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
      <TemplateManagement />
    </ProtectedRoute>
  )
}
