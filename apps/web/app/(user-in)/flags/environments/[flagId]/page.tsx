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
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
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
  console.log(innerValue);
  const formattedValue = formatValueForDisplay(innerValue, flagType)
  console.log(formattedValue);
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        {label}
        <Badge variant="outline" className="ml-2 text-xs">
          {flagType}
        </Badge>
      </label>
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap break-all">
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
        return 'bg-red-100 text-red-800'
      case 'staging':
      case 'stage':
        return 'bg-yellow-100 text-yellow-800'
      case 'development':
      case 'dev':
        return 'bg-blue-100 text-blue-800'
      case 'testing':
      case 'test':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnvironmentIcon = (env: string) => {
    switch (env.toLowerCase()) {
      case 'production':
      case 'prod':
        return 'bg-red-100'
      case 'staging':
      case 'stage':
        return 'bg-yellow-100'
      case 'development':
      case 'dev':
        return 'bg-blue-100'
      case 'testing':
      case 'test':
        return 'bg-purple-100'
      default:
        return 'bg-gray-100'
    }
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${getEnvironmentIcon(environment.environment)} rounded-lg flex items-center justify-center`}>
              <Database className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getEnvironmentColor(environment.environment)}>
                {environment.environment}
              </Badge>
              <div className="flex items-center space-x-2">
                {environment.is_enabled ? (
                  <ToggleRight className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${environment.is_enabled ? 'text-emerald-600' : 'text-gray-600'}`}>
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
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white h-10 font-medium transition-all duration-200"
            >
              <Target className="w-5 h-5 mr-2" />
              View Rules
            </Button>
          </Link>
          <Link href={`/flags/rollout/${flag_id}?environmentId=${environment.id}`}>
            <Button 
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white h-10 font-medium transition-all duration-200"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Rollout
            </Button>
          </Link>
          <Link href={`/create-metrics/${environment.id}`}>
            <Button 
              className="bg-[#06B6D4] hover:bg-[#0891B2] text-white h-10 font-medium transition-all duration-200"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Add Metric
            </Button>
          </Link>
        </div>
        
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          
          <div>
            <label className="text-sm font-medium text-gray-700">Created</label>
            <div className="flex items-center space-x-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-900">{formatDate(environment.created_at)}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Updated</label>
            <div className="flex items-center space-x-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-900">{formatDate(environment.updated_at)}</span>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <Suspense fallback={<EnvironmentLoading />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href={`/flags/${flagId}`}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Flag Details
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                    <Database className="w-6 h-6 mr-3 text-indigo-600" />
                    Environment Settings
                  </h1>
                  <p className="text-gray-600 text-base sm:text-lg mt-1">
                    Manage flag values across different environments
                  </p>
                </div>
              </div>
              <Link href={`/create-flag/environments?flagKey=${flagId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Environment
                </Button>
              </Link>
            </div>

            {/* Environment Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{environments.length}</p>
                      <p className="text-sm text-gray-600">Total Environments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {environments.filter(env => env.is_enabled).length}
                      </p>
                      <p className="text-sm text-gray-600">Enabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ToggleLeft className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {environments.filter(env => !env.is_enabled).length}
                      </p>
                      <p className="text-sm text-gray-600">Disabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Environments List */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Environment Configurations</h2>
              </div>
              
              {environments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Database className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Environments Found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    This flag doesn't have any environment configurations yet. Create your first environment to get started.
                  </p>
                  <Button>
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
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Bulk Copy Settings
                </Button>
                <Button variant="outline">
                  <Code className="w-4 h-4 mr-2" />
                  Export Configuration
                </Button>
                <Button variant="outline">
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