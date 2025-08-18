import { ProtectedRoute } from "@/components/protected-route"
import { IntakeFormWizard } from "@/components/intake/intake-form-wizard"

export default function IntakePage() {
  return (
    <ProtectedRoute requiredRole="party">
      <IntakeFormWizard />
    </ProtectedRoute>
  )
}
