import KillSwitchDetailClient from "@/components/kill-switch-detail-client"

interface KillSwitchDetailPageProps {
  params: Promise<{
    killSwitch: string
  }>
}

export default async function KillSwitchDetailPage({ params }: KillSwitchDetailPageProps) {
  const { killSwitch } = await params
  return <KillSwitchDetailClient killSwitchId={killSwitch} />
}
