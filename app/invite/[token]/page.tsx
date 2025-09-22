import { redirect } from "next/navigation"

interface InvitePageProps {
  params: Promise<{
    token: string
  }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  // Redirect to dashboard as invite system is disabled
  redirect('/dashboard')
}
