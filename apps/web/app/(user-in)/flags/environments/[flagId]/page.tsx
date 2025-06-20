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
  Edit,
  Trash2,
  Copy,
  Settings,
  Code,
  Target,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  } catch (error) {
    console.error('Error fetching flag environment data:', error)
    return null
  }
}

// Loading component
const EnvironmentLoading = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-600 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-700 rounded w-2/3" />
    </div>
    <div className="grid gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 animate-pulse">
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
      ))}
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

// Helper function to validate value based on flag type
const validateValueForType = (value: any, flagType: FlagType): { isValid: boolean; error?: string } => {
  switch (flagType) {
    case 'BOOLEAN':
    case 'KILL_SWITCH':
      if (typeof value !== 'boolean') {
        return { isValid: false, error: 'Value must be true or false' }
      }
      return { isValid: true }
    
    case 'STRING':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a string' }
      }
      return { isValid: true }
    
    case 'NUMBER':
      if (typeof value !== 'number' || isNaN(value)) {
        return { isValid: false, error: 'Value must be a valid number' }
      }
      return { isValid: true }
    
    case 'JSON':
    case 'MULTIVARIATE':
      // For JSON and MULTIVARIATE, allow objects/arrays
      if (typeof value !== 'object' || value === null) {
        return { isValid: false, error: 'Value must be a valid JSON object or array' }
      }
      return { isValid: true }
    
    case 'AB_TEST':
      // AB_TEST typically expects boolean or string values
      if (typeof value !== 'boolean' && typeof value !== 'string') {
        return { isValid: false, error: 'Value must be a boolean or string for A/B test' }
      }
      return { isValid: true }
    
    default:
      return { isValid: true }
  }
}

// Helper function to get input type based on flag type
const getInputTypeForFlag = (flagType: FlagType): 'text' | 'number' | 'boolean' | 'json' => {
  switch (flagType) {
    case 'BOOLEAN':
    case 'KILL_SWITCH':
      return 'boolean'
    case 'NUMBER':
      return 'number'
    case 'JSON':
    case 'MULTIVARIATE':
      return 'json'
    case 'STRING':
    case 'AB_TEST':
    default:
      return 'text'
  }
}

// Helper function to get placeholder text based on flag type
const getPlaceholderForFlag = (flagType: FlagType): string => {
  switch (flagType) {
    case 'BOOLEAN':
    case 'KILL_SWITCH':
      return 'true or false'
    case 'STRING':
      return 'Enter string value'
    case 'NUMBER':
      return 'Enter number value'
    case 'JSON':
      return '{"key": "value"}'
    case 'AB_TEST':
      return '"variant_a" or true/false'
    case 'MULTIVARIATE':
      return '{"variant": "A", "weight": 50}'
    default:
      return 'Enter value'
  }
}

// Helper function to format value for display based on flag type
const formatValueForDisplay = (value: any, flagType: FlagType): string => {
  if (value === null || value === undefined) {
    return 'null'
  }
  
  switch (flagType) {
    case 'BOOLEAN':
    case 'KILL_SWITCH':
      return typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)
    
    case 'STRING':
      return typeof value === 'string' ? `"${value}"` : String(value)
    
    case 'NUMBER':
      return String(value)
    
    case 'JSON':
    case 'MULTIVARIATE':
      return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    
    case 'AB_TEST':
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false'
      }
      return typeof value === 'string' ? `"${value}"` : String(value)
    
    default:
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2)
      }
      return String(value)
  }
}

// Helper function to wrap value in the expected structure
const wrapValue = (innerValue: any): { value: any } => {
  return { value: innerValue }
}

// Value Display Component - Only show the inner value with type-aware formatting
const ValueDisplay = ({ valueObj, label, flagType }: { 
  valueObj: { value: any } | null | undefined, 
  label: string,
  flagType: FlagType 
}) => {
  const innerValue = extractValue(valueObj)
  
  const formattedValue = formatValueForDisplay(innerValue, flagType)

  return (
    <div>
      <label className="text-sm font-medium text-neutral-400 mb-2 block">
        {label}
        <Badge variant="outline" className="ml-2 text-xs">
          {flagType}
        </Badge>
      </label>
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
        <pre className="text-sm text-neutral-300 whitespace-pre-wrap break-all">
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
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'staging':
      case 'stage':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'development':
      case 'dev':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'testing':
      case 'test':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge className={`${getEnvironmentColor(environment.environment)}`}>
              {environment.environment}
            </Badge>
            <div className="flex items-center space-x-2">
              {environment.is_enabled ? (
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              )}
              <span className={`text-sm font-medium ${environment.is_enabled ? 'text-emerald-400' : 'text-gray-400'}`}>
                {environment.is_enabled ? 'Enabled' : 'Disabled'}
              </span>
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
        <div className="flex flex-wrap gap-4">
          <Link href={`/flags/rules/${flag_id}?environmentId=${environment.id}`}>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-orange-600/50 text-orange-400 hover:bg-orange-900/20"
            >
              <Target className="w-4 h-4 mr-2" />
              View Rules
            </Button>
          </Link>
          <Link href={`/flags/rollout/${flag_id}?environmentId=${environment.id}`}>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-blue-600/50 text-blue-400 hover:bg-blue-900/20"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Rollout
            </Button>
          </Link>
          <Link href={`/create-metrics/${environment.id}`}>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-blue-600/50 text-blue-400 hover:bg-blue-900/20"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Add Metric
            </Button>
          </Link>
        </div>
        
        <Separator className="bg-slate-700/50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="text-neutral-400 font-medium">Environment ID</label>
            <p className="text-white font-mono mt-1 break-all">{environment.id}</p>
          </div>
          <div>
            <label className="text-neutral-400 font-medium">Created</label>
            <p className="text-white mt-1">{formatDate(environment.created_at)}</p>
          </div>
          <div>
            <label className="text-neutral-400 font-medium">Updated</label>
            <p className="text-white mt-1">{formatDate(environment.updated_at)}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<EnvironmentLoading />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href={`/flags/${flagId}`}>
                  <Button variant="outline" size="sm" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Flag Details
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center">
                    <Database className="w-8 h-8 mr-3 text-emerald-400" />
                    Environment Settings
                  </h1>
                  <p className="text-neutral-400 mt-1">
                    Manage flag values across different environments
                  </p>
                </div>
              </div>
              <Link href={`/create-flag/environments?flagKey=${environments[0]?.flag_id}`}>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add New Environment
              </Button>
              </Link>
            </div>

            {/* Environment Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{environments.length}</p>
                      <p className="text-sm text-neutral-400">Total Environments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {environments.filter(env => env.is_enabled).length}
                      </p>
                      <p className="text-sm text-neutral-400">Enabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {environments.filter(env => !env.is_enabled).length}
                      </p>
                      <p className="text-sm text-neutral-400">Disabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Environments List */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Environment Configurations</h2>
              </div>
              
              {environments.length === 0 ? (
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardContent className="p-12 text-center">
                    <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Environments Found</h3>
                    <p className="text-neutral-400 mb-6">
                      This flag doesn't have any environment configurations yet. Create your first environment to get started.
                    </p>
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Environment
                    </Button>
                  </CardContent>
                </Card>
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
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-700/50">
                <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                  <Copy className="w-4 h-4 mr-2" />
                  Bulk Copy Settings
                </Button>
                <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                  <Code className="w-4 h-4 mr-2" />
                  Export Configuration
                </Button>
                <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
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
export { extractValue, wrapValue, validateValueForType, getInputTypeForFlag, getPlaceholderForFlag, formatValueForDisplay, type FlagType }