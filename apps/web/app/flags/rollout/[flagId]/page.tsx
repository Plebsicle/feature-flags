import { Suspense } from "react"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import {
  Rocket,
  Calendar,
  ArrowLeft,
  Plus,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Copy,
  Settings,
  Code,
  BarChart3,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import RolloutEditModal from "@/components/rollout-edit-modal"
import { rollout_type } from '@repo/db/client'

// Types for rollout data
interface RolloutData {
  id: string;
  created_at: Date;
  updated_at: Date;
  flag_environment_id: string;
  type: rollout_type;
  config: any; // JsonValue
}

interface RolloutResponse {
  data: RolloutData
  success: boolean
  message: string
}

// Server-side data fetching
async function getRolloutData(environmentId: string): Promise<RolloutData | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/flag/getRollout/${environmentId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId && { 'Cookie': `sessionId=${sessionId}` }),
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: RolloutResponse = await response.json()
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.message || 'Failed to fetch rollout data')
    }
  } catch (error) {
    console.error('Error fetching rollout data:', error)
    return null
  }
}

// Loading component
const RolloutLoading = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-600 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-700 rounded w-2/3" />
    </div>
    <div className="grid gap-6">
      <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-600 rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

// Helper function to get rollout type display info
const getRolloutTypeInfo = (type: rollout_type) => {
  switch (type) {
    case 'PERCENTAGE':
      return {
        label: 'Percentage Rollout',
        description: 'Fixed percentage rollout with start and end dates',
        color: 'bg-green-900/50 text-green-200'
      }
    case 'PROGRESSIVE_ROLLOUT':
      return {
        label: 'Progressive Rollout',
        description: 'Gradually increase percentage over time',
        color: 'bg-blue-900/50 text-blue-200'
      }
    case 'CUSTOM_PROGRESSIVE_ROLLOUT':
      return {
        label: 'Custom Progressive Rollout',
        description: 'Define custom stages and percentages',
        color: 'bg-purple-900/50 text-purple-200'
      }
    default:
      return {
        label: 'Unknown Rollout',
        description: 'Unknown rollout type',
        color: 'bg-gray-900/50 text-gray-200'
      }
  }
}

// Helper function to format rollout config for display
const formatConfigForDisplay = (type: rollout_type, config: any): React.ReactNode => {
  if (!config || typeof config !== 'object') {
    return <span className="text-slate-400">No configuration available</span>
  }

  switch (type) {
    case 'PERCENTAGE':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Percentage:</span>
            <span className="text-white font-medium">{config.percentage || 0}%</span>
          </div>
          {config.startDate && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Start Date:</span>
              <span className="text-white">{new Date(config.startDate).toLocaleDateString()}</span>
            </div>
          )}
          {config.endDate && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">End Date:</span>
              <span className="text-white">{new Date(config.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )

    case 'PROGRESSIVE_ROLLOUT':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Start Percentage:</span>
            <span className="text-white font-medium">{config.startPercentage || 0}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Increment:</span>
            <span className="text-white font-medium">{config.incrementPercentage || 0}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Max Percentage:</span>
            <span className="text-white font-medium">{config.maxPercentage || 0}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Frequency:</span>
            <span className="text-white font-medium">
              Every {config.frequency?.value || 1} {config.frequency?.unit || 'days'}
            </span>
          </div>
          {config.currentStage && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Stage:</span>
              <span className="text-white font-medium">
                Stage {config.currentStage.stage + 1} ({config.currentStage.percentage}%)
              </span>
            </div>
          )}
        </div>
      )

    case 'CUSTOM_PROGRESSIVE_ROLLOUT':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Stages:</span>
            <span className="text-white font-medium">{config.stages?.length || 0}</span>
          </div>
          {config.currentStage && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Stage:</span>
              <span className="text-white font-medium">
                Stage {config.currentStage.stage + 1} ({config.currentStage.percentage}%)
              </span>
            </div>
          )}
          {config.stages && config.stages.length > 0 && (
            <div className="mt-3">
              <span className="text-slate-400 text-sm">Stages:</span>
              <div className="mt-1 space-y-1">
                {config.stages.slice(0, 3).map((stage: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-300">Stage {index + 1}:</span>
                    <span className="text-white">{stage.percentage}%</span>
                  </div>
                ))}
                {config.stages.length > 3 && (
                  <div className="text-slate-400 text-xs">
                    +{config.stages.length - 3} more stages
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )

    default:
      return <span className="text-slate-400">Unknown configuration</span>
  }
}

// Rollout Card Component
const RolloutCard = ({ rollout, environmentId }: { rollout: RolloutData; environmentId: string }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const typeInfo = getRolloutTypeInfo(rollout.type)

  return (
    <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/50 transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                {typeInfo.label}
                <Badge className={typeInfo.color}>
                  {rollout.type}
                </Badge>
              </CardTitle>
              <CardDescription className="text-neutral-400">
                {typeInfo.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <RolloutEditModal
              rolloutData={rollout}
              environmentId={environmentId}
            />
            
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-neutral-400 font-medium text-sm mb-2 block">Configuration</label>
            {formatConfigForDisplay(rollout.type, rollout.config)}
          </div>
          <div>
            <label className="text-neutral-400 font-medium text-sm">Status</label>
            <div className="mt-2">
              <Badge variant="default" className="bg-emerald-900/50 text-emerald-200">
                Active
              </Badge>
            </div>
          </div>
        </div>
        <Separator className="bg-slate-700/50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="text-neutral-400 font-medium">Rollout ID</label>
            <p className="text-white font-mono mt-1 break-all">{rollout.id}</p>
          </div>
          <div>
            <label className="text-neutral-400 font-medium">Created</label>
            <p className="text-white mt-1">{formatDate(rollout.created_at)}</p>
          </div>
          <div>
            <label className="text-neutral-400 font-medium">Updated</label>
            <p className="text-white mt-1">{formatDate(rollout.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Rollout Page Component
export default async function FlagRolloutPage({
  params,
  searchParams,
}: {
  params: Promise<{ flagId: string }>
  searchParams: Promise<{ environmentId?: string }>
}) {
  const { flagId } = await params
  const { environmentId } = await searchParams

  if (!environmentId) {
    notFound()
  }

  const rollout = await getRolloutData(environmentId)

  if (rollout === null) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<RolloutLoading />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href={`/flags/environments/${flagId}`}>
                  <Button variant="outline" size="sm" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Environments
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center">
                    <Rocket className="w-8 h-8 mr-3 text-blue-400" />
                    Rollout Configuration
                  </h1>
                  <p className="text-neutral-400 mt-1">
                    Manage rollout strategy and deployment settings for this environment
                  </p>
                </div>
              </div>
            </div>

            {/* Rollout Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{getRolloutTypeInfo(rollout.type).label}</p>
                      <p className="text-sm text-neutral-400">Rollout Type</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">Active</p>
                      <p className="text-sm text-neutral-400">Status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {rollout.type === 'CUSTOM_PROGRESSIVE_ROLLOUT' 
                          ? rollout.config?.stages?.length || 0
                          : rollout.type === 'PERCENTAGE' 
                          ? `${rollout.config?.percentage || 0}%`
                          : `${rollout.config?.currentStage?.percentage || 0}%`
                        }
                      </p>
                      <p className="text-sm text-neutral-400">
                        {rollout.type === 'CUSTOM_PROGRESSIVE_ROLLOUT' ? 'Stages' : 'Current %'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rollout Configuration */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Current Configuration</h2>
              </div>
              
              <RolloutCard rollout={rollout} environmentId={environmentId} />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-700/50">
              <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                <Copy className="w-4 h-4 mr-2" />
                Copy Configuration
              </Button>
              <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                <Code className="w-4 h-4 mr-2" />
                Export Settings
              </Button>
              <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  )
}
