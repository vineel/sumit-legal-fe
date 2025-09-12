import { ProtectedRoute } from "@/components/protected-route"
import { TemplateSelectionPage } from "@/components/template-selection-page"

export default function SelectTemplatePage() {
  return (
    <ProtectedRoute requiredRole="party">
      <TemplateSelectionPage />
    </ProtectedRoute>
  )
}
