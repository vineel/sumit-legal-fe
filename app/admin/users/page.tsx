import { ProtectedRoute } from "@/components/protected-route"
import { UserManagement } from "@/components/admin/user-management"

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
      <UserManagement />
    </ProtectedRoute>
  )
}
