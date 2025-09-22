import { redirect } from "next/navigation"

export default function CollaborationPage() {
  // Redirect to dashboard as collaboration is disabled
  redirect('/dashboard')
}
