import { ProtectedRoute } from "@/components/protected-route"
import { UserManagement } from "@/components/admin/user-management"

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <UserManagement />
    </ProtectedRoute>
  )
}
