import { ProtectedRoute } from "@/components/protected-route"
import { RealtimeCollaborationWorkspace } from "@/components/realtime-collaboration-workspace"

export default function CollaborationPage() {
  return (
    <ProtectedRoute requiredRole="party">
      <RealtimeCollaborationWorkspace />
    </ProtectedRoute>
  )
}
