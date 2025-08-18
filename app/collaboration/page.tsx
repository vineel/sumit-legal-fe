import { ProtectedRoute } from "@/components/protected-route"
import { CollaborationWorkspace } from "@/components/collaboration/collaboration-workspace"

export default function CollaborationPage() {
  return (
    <ProtectedRoute requiredRole="party">
      <CollaborationWorkspace />
    </ProtectedRoute>
  )
}
