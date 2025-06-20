import KillSwitchDetailClient from "@/components/kill-switch-detail-client"

interface KillSwitchDetailPageProps {
  params: {
    killSwitch: string
  }
}

export default function KillSwitchDetailPage({ params }: KillSwitchDetailPageProps) {
  return <KillSwitchDetailClient killSwitchId={params.killSwitch} />
}
