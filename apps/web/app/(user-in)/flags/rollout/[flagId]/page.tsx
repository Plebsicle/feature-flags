import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import {
  Rocket,
  Calendar,
  ArrowLeft,
  Plus,
  Settings,
  BarChart3,
  Clock,
} from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import RolloutEditModal from "@/components/rollout-edit-modal"
import { rollout_type } from '@repo/db/client'

// Types for rollou t data
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
  } catch (error) { console.error(error)
    return null
  }
}

// Helper function to get rollout type display info
const getRolloutTypeInfo = (type: rollout_type) => {
  switch (type) {
    case 'PERCENTAGE':
      return {
        label: 'Percentage Rollout',
        description: 'Fixed percentage rollout with start and end dates',
        color: 'bg-emerald-100 text-emerald-800'
      }
    case 'PROGRESSIVE_ROLLOUT':
      return {
        label: 'Progressive Rollout',
        description: 'Gradually increase percentage over time',
        color: 'bg-blue-100 text-blue-800'
      }
    case 'CUSTOM_PROGRESSIVE_ROLLOUT':
      return {
        label: 'Custom Progressive Rollout',
        description: 'Define custom stages and percentages',
        color: 'bg-primary/10 text-primary'
      }
    default:
      return {
        label: 'Unknown Rollout',
        description: 'Unknown rollout type',
        color: 'bg-muted text-muted-foreground'
      }
  }
}

// Helper function to format rollout config for display
const formatConfigForDisplay = (type: rollout_type, config: any): React.ReactNode => {
  if (!config || typeof config !== 'object') {
    return <span className="text-gray-600">No configuration available</span>
  }

  switch (type) {
    case 'PERCENTAGE':
        return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Percentage:</span>
            <span className="text-sm text-foreground font-medium">{config.percentage || 0}%</span>
          </div>
          {config.startDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Start Date:</span>
              <span className="text-sm text-foreground">{new Date(config.startDate).toLocaleDateString()}</span>
            </div>
          )}
          {config.endDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">End Date:</span>
              <span className="text-sm text-foreground">{new Date(config.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )

    case 'PROGRESSIVE_ROLLOUT':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Start Percentage:</span>
            <span className="text-sm text-foreground font-medium">{config.startPercentage || 0}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Increment:</span>
            <span className="text-sm text-foreground font-medium">{config.incrementPercentage || 0}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Max Percentage:</span>
            <span className="text-sm text-foreground font-medium">{config.maxPercentage || 0}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Frequency:</span>
            <span className="text-sm text-foreground font-medium">
              Every {config.frequency?.value || 1} {config.frequency?.unit || 'days'}
            </span>
          </div>
          {config.currentStage && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Current Stage:</span>
              <span className="text-sm text-foreground font-medium">
                Stage {config.currentStage.stage + 1} ({config.currentStage.percentage}%)
              </span>
            </div>
          )}
        </div>
      )

    case 'CUSTOM_PROGRESSIVE_ROLLOUT':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Stages:</span>
            <span className="text-sm text-foreground font-medium">{config.stages?.length || 0}</span>
          </div>
          {config.currentStage && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Current Stage:</span>
              <span className="text-sm text-foreground font-medium">
                Stage {config.currentStage.stage + 1} ({config.currentStage.percentage}%)
              </span>
            </div>
          )}
          {config.stages && Array.isArray(config.stages) && config.stages.length > 0 && (
            <div className="mt-4">
              <span className="text-sm font-medium text-muted-foreground block mb-2">Stages:</span>
              <div className="space-y-2">
                {config.stages.slice(0, 3).map((stage: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stage {index + 1}:</span>
                    <span className="text-foreground">{stage.percentage}%</span>
                  </div>
                ))}
                {config.stages.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    ...and {config.stages.length - 3} more stages
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )

    default:
      return (
        <div className="bg-muted border border-border rounded p-3">
          <code className="text-sm font-mono text-foreground">
            {JSON.stringify(config, null, 2)}
          </code>
        </div>
      )
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
    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground flex items-center space-x-2">
                <span>{typeInfo.label}</span>
                <Badge className={`text-xs ${typeInfo.color}`}>
                  {rollout.type}
                </Badge>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
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
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-3 block">Configuration</label>
          {formatConfigForDisplay(rollout.type, rollout.config)}
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Created</label>
            <div className="flex items-center space-x-1 mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm text-foreground">{formatDate(rollout.created_at)}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Updated</label>
            <div className="flex items-center space-x-1 mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm text-foreground">{formatDate(rollout.updated_at)}</span>
            </div>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link href={`/flags/${flagId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Flag
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Rollout Strategy
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg mt-1">
                  Control how your feature flag is gradually released to users
                </p>
              </div>
            </div>
            {!rollout && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Rollout
              </Button>
            )}
          </div>

          {/* Rollout Configuration */}
          {rollout ? (
            <RolloutCard rollout={rollout} environmentId={environmentId} />
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No rollout configured</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Set up a rollout strategy to gradually release this feature flag to your users with controlled percentages and timing.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Rollout Strategy
              </Button>
            </div>
          )}

          {/* Rollout Types Info */}
          <Card className="bg-primary/5 border border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                Rollout Types
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose the right rollout strategy for your feature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-foreground">Percentage</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fixed percentage rollout with specific start and end dates
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-foreground">Progressive</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically increase percentage over time with set intervals
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground">Custom</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define custom stages and percentages for precise control
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}