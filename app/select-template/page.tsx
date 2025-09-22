import { ProtectedRoute } from "@/components/protected-route"
import { UserTemplateSelection } from "@/components/user-template-selection"

export default function SelectTemplatePage() {
  return (
    <ProtectedRoute requiredRole="party">
      <UserTemplateSelection />
    </ProtectedRoute>
  )
}
