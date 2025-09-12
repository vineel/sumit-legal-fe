import { AgreementDetailsPage } from "@/components/agreement-details-page"

interface AgreementPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AgreementPage({ params }: AgreementPageProps) {
  const { id } = await params
  return <AgreementDetailsPage agreementId={id} />
}
