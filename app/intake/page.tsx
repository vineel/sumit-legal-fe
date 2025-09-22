import { ProtectedRoute } from "@/components/protected-route"
import { redirect } from "next/navigation"

export default function IntakePage() {
  // Redirect to dashboard as intake process is disabled
  redirect('/dashboard')
}
