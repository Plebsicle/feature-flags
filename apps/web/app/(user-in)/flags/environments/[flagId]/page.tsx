import { Suspense } from "react"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import {
  Database,
  Calendar,
  ArrowLeft,
  Plus,
  ToggleLeft,
  ToggleRight,
  Copy,
  Settings,
  Code,
  Target,
  BarChart3,
} from "@/components/ui/icons"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { DeleteEnvironmentButton } from "../../../../../src/components/delete-environment-button"
import { EditEnvironmentModal } from "../../../../../src/components/edit-environment-button"
import { flag_type } from "@repo/db/client"

// Types for environment data
type FlagType = 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON' | 'AB_TEST' | 'KILL_SWITCH' | 'MULTIVARIATE'

interface FlagEnvironment {
  id: string
  flag_id: string
  environment: string
  value: { value: any }  // Updated type to reflect nested structure
  default_value: { value: any }  // Updated type to reflect nested structure
  is_enabled: boolean
  created_at: Date
  updated_at: Date
}

interface Response {
  environmentData : FlagEnvironment[],
  flag_id : string,
  flag_type : flag_type
}

interface EnvironmentResponse {
  data: Response
  success: boolean
  message: string
}

// Server-side data fetching
async function getFlagEnvironmentData(flagId: string): Promise<Response | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/flag/getFlagEnvironmentData/${flagId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId && { 'Cookie': `sessionId=${sessionId}` }),
      },
    })
    console.log(response);
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: EnvironmentResponse = await response.json()
    console.log(result);
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.message || 'Failed to fetch environment data')
    }
  } catch (error) { console.error(error)
    return null
  }
}

// Loading component
const EnvironmentLoading = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-xl w-1/3 mb-4" />
          <div className="h-4 bg-muted/50 rounded-lg w-2/3" />
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-xl border-border bg-card/80 backdrop-blur">
              <CardHeader>
                <div className="h-6 bg-muted rounded-lg w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted/50 rounded-lg w-full" />
                  <div className="h-4 bg-muted/50 rounded-lg w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// Helper function to extract the inner value
const extractValue = (valueObj: { value: any } | null | undefined): any => {
  if (!valueObj || typeof valueObj !== 'object') {
    return null
  }
  return valueObj.value
}



// Helper function to format value for display based on flag type
const formatValueForDisplay = (value: any, flagType: FlagType): string => {
  if (value === null || value === undefined) {
    return 'null'
  }
  
  switch (flagType) {
    case 'BOOLEAN':
      return typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)
    
    case 'STRING':
      return typeof value === 'string' ? `"${value}"` : String(value)
    
    case 'NUMBER':
      return String(value)
    
    case 'JSON':
    case 'AB_TEST':
    case 'MULTIVARIATE':
      return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)    
    default:
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2)
      }
      return String(value)
  }
}


// Value Display Component - Only show the inner value with type-aware formatting
const ValueDisplay = ({ valueObj, label, flagType }: { 
  valueObj: { value: any } | null | undefined, 
  label: string,
  flagType: FlagType 
}) => {
  const innerValue = extractValue(valueObj)
  console.log(innerValue);
  const formattedValue = formatValueForDisplay(innerValue, flagType)
  console.log(formattedValue);
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">
        {label}
        <Badge variant="outline" className="ml-2 text-xs font-medium rounded-md">
          {flagType}
        </Badge>
      </label>
      <div className="bg-muted/10 border border-border rounded-lg p-3">
        <pre className="text-sm font-mono text-foreground whitespace-pre-wrap break-all">
          {formattedValue}
        </pre>
      </div>
    </div>
  )
}

// Environment Card Component
const EnvironmentCard = ({ environment, flag_id, flag_type }: { environment: FlagEnvironment; flag_id: string; flag_type: flag_type }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEnvironmentColor = (env: string) => {
    switch (env.toLowerCase()) {
      case 'production':
      case 'prod':
        return 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-xs font-medium'
      case 'staging':
      case 'stage':
        return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md text-xs font-medium'
      case 'development':
      case 'dev':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-md text-xs font-medium'
      case 'testing':
      case 'test':
        return 'bg-teal-500/10 text-teal-500 border border-teal-500/20 rounded-md text-xs font-medium'
      default:
        return 'bg-muted/10 text-foreground border border-border rounded-md text-xs font-medium'
    }
  }

  const getEnvironmentIcon = (env: string) => {
    switch (env.toLowerCase()) {
      case 'production':
      case 'prod':
        return 'bg-red-500/10 border border-red-500/20 text-red-500'
      case 'staging':
      case 'stage':
        return 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
      case 'development':
      case 'dev':
        return 'bg-blue-500/10 border border-blue-500/20 text-blue-500'
      case 'testing':
      case 'test':
        return 'bg-teal-500/10 border border-teal-500/20 text-teal-500'
      default:
        return 'bg-muted/10 border border-border text-foreground'
    }
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${getEnvironmentIcon(environment.environment)} rounded-xl flex items-center justify-center`}>
              <Database className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getEnvironmentColor(environment.environment)}>
                {environment.environment}
              </Badge>
              <div className="flex items-center space-x-2">
                {environment.is_enabled ? (
                  <ToggleRight className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={`text-xs font-medium ${environment.is_enabled ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {environment.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <EditEnvironmentModal
              environmentId={environment.id}
              environmentName={environment.environment}
              currentValue={extractValue(environment.value)}
              currentDefaultValue={extractValue(environment.default_value)}
              currentIsEnabled={environment.is_enabled}
            />
            <DeleteEnvironmentButton
              environmentId={environment.id}
              environmentName={environment.environment}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ValueDisplay valueObj={environment.value} label="Current Value" flagType={flag_type} />
          <ValueDisplay valueObj={environment.default_value} label="Default Value" flagType={flag_type} />
        </div>
        
        {/* Environment Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link href={`/flags/rules/${flag_id}?environmentId=${environment.id}`}>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-md text-xs font-medium transition-all duration-200"
            >
              <Target className="w-4 h-4 mr-2" />
              View Rules
            </Button>
          </Link>
          <Link href={`/flags/rollout/${flag_id}?environmentId=${environment.id}`}>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-md text-xs font-medium transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Rollout
            </Button>
          </Link>
          <Link href={`/create-metrics/${environment.id}`}>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-md text-xs font-medium transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Add Metric
            </Button>
          </Link>
        </div>
        
        <Separator className="bg-border/50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          
          <div>
            <label className="text-xs font-medium text-muted-foreground">Created</label>
            <div className="flex items-center space-x-1 mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground/70" />
              <span className="text-sm font-medium text-foreground">{formatDate(environment.created_at)}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Updated</label>
            <div className="flex items-center space-x-1 mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground/70" />
              <span className="text-sm font-medium text-foreground">{formatDate(environment.updated_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Environment Page Component
export default async function FlagEnvironmentPage({
  params,
}: {
  params: Promise<{ flagId: string }>
}) {
  const { flagId } = await params
  const totalData = await getFlagEnvironmentData(flagId)

  if (!totalData?.environmentData) {
    notFound()
  }
  const environments = totalData.environmentData;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <Suspense fallback={<EnvironmentLoading />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href={`/flags/${flagId}`}>
                  <Button variant="outline" size="sm" className="rounded-md text-xs font-medium border-border hover:bg-muted/50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Flag Details
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center">
                    <Database className="w-6 h-6 mr-3 text-primary" />
                    Environment Settings
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium mt-1">
                    Manage flag values across different environments
                  </p>
                </div>
              </div>
              <Link href={`/create-flag/environments?flagKey=${flagId}`}>
                <Button className="rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Environment
                </Button>
              </Link>
            </div>

            {/* Environment Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{environments.length}</p>
                      <p className="text-xs font-medium text-muted-foreground">Total Environments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                      <ToggleRight className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {environments.filter(env => env.is_enabled).length}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">Enabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted/10 border border-border rounded-xl flex items-center justify-center">
                      <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {environments.filter(env => !env.is_enabled).length}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">Disabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Environments List */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground tracking-tight">Environment Configurations</h2>
              </div>
              
              {environments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-muted/10 border border-border rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Database className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">No Environments Found</h3>
                  <p className="text-sm font-medium text-muted-foreground mb-6 max-w-md mx-auto">
                    This flag doesn&apos;t have any environment configurations yet. Create your first environment to get started.
                  </p>
                  <Button className="rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Environment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {environments.map((environment) => (
                    <EnvironmentCard key={environment.id} environment={environment} flag_id={totalData.flag_id} flag_type={totalData.flag_type} />
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            {environments.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
                <Button variant="outline" className="rounded-md text-xs font-medium border-border hover:bg-muted/50">
                  <Copy className="w-4 h-4 mr-2" />
                  Bulk Copy Settings
                </Button>
                <Button variant="outline" className="rounded-md text-xs font-medium border-border hover:bg-muted/50">
                  <Code className="w-4 h-4 mr-2" />
                  Export Configuration
                </Button>
                <Button variant="outline" className="rounded-md text-xs font-medium border-border hover:bg-muted/50">
                  <Settings className="w-4 h-4 mr-2" />
                  Bulk Operations
                </Button>
              </div>
            )}
          </div>
        </Suspense>
      </div>
    </div>
  )
}

// Export helper functions for use in other components