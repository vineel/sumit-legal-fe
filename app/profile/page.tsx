import { ProtectedRoute } from "@/components/protected-route"
import { UserProfile } from "@/components/user-profile"

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredRole="party">
      <UserProfile />
    </ProtectedRoute>
  )
}
