import { InviteAcceptancePage } from "@/components/invite-acceptance-page"

interface InvitePageProps {
  params: Promise<{
    token: string
  }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  return <InviteAcceptancePage inviteToken={token} />
}
