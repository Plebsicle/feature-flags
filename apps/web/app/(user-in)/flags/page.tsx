import { cookies } from "next/headers"
import { feature_flags, flag_type } from "@repo/db/client"
import {
  Flag,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  Activity,
  Calendar,
  Tag,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// Types based on the API response
type FlagType = flag_type
type FeatureFlag = feature_flags

interface FlagsResponse {
  data: FeatureFlag[]
  success: boolean
  message: string
}

// Server-side data fetching
async function getFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/flag/getAllFeatureFlags`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId && { 'Cookie': `sessionId=${sessionId}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: FlagsResponse = await response.json()
    
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.message || 'Failed to fetch flags')
    }
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return []
  }
}

// Flag Card Component
const FlagCard = ({ flag }: { flag: FeatureFlag }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getFlagTypeColor = (type: FlagType) => {
    switch (type) {
      case 'BOOLEAN':
        return 'bg-blue-100 text-blue-800'
      case 'STRING':
        return 'bg-emerald-100 text-emerald-800'
      case 'NUMBER':
        return 'bg-purple-100 text-purple-800'
      case 'JSON':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Link href={`/flags/${flag.id}`}>
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${flag.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {flag.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {flag.key}
                  </code>
                  <Badge className={`text-xs ${getFlagTypeColor(flag.flag_type)}`}>
                    {flag.flag_type}
                  </Badge>
                </div>
                {flag.description && (
                  <CardDescription className="text-gray-600 mt-2 text-sm leading-relaxed line-clamp-2">
                    {flag.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200 flex-shrink-0 ml-2">
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Status</span>
              <div className="flex items-center space-x-2">
                {flag.is_active ? (
                  <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${flag.is_active ? 'text-emerald-600' : 'text-gray-600'}`}>
                  {flag.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {flag.tags && flag.tags.length > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Tags</span>
                <div className="flex flex-wrap gap-1 max-w-32">
                  {flag.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {flag.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{flag.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600">Created</span>
                  <div className="text-xs sm:text-sm text-gray-900 font-medium truncate">
                    {formatDate(flag.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600">Updated</span>
                  <div className="text-xs sm:text-sm text-gray-900 font-medium truncate">
                    {formatDate(flag.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Main Flags Page Component
export default async function FlagsPage() {
  const flags = await getFeatureFlags()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Feature Flags</h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Manage and monitor your feature flags across all environments
              </p>
            </div>
            <Link href="/create-flag/details">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Flag
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search flags..."
                className="pl-10 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{flags.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Flags</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {flags.filter(f => f.is_active).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {flags.filter(f => !f.is_active).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Inactive</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {flags.reduce((acc, flag) => acc + (flag.tags?.length || 0), 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Tags</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flags Grid */}
          {flags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {flags.map((flag) => (
                <FlagCard key={flag.id} flag={flag} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Flag className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No flags found</h3>
              <p className="text-gray-600 mb-6">Create your first feature flag to get started.</p>
              <Link href="/create-flag/details">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Flag
                </Button>
              </Link>
            </div>
          )}

          {/* Info Card */}
          <Card className="bg-blue-50 border border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center">
                <Flag className="w-5 h-5 mr-2 text-blue-600" />
                Feature Flag Management
              </CardTitle>
              <CardDescription className="text-gray-600">
                Best practices for managing feature flags effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Environment Control</h4>
                  <p className="text-sm text-gray-600">
                    Control flag behavior across development, staging, and production environments
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Targeting Rules</h4>
                  <p className="text-sm text-gray-600">
                    Create sophisticated targeting rules based on user attributes and conditions
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Rollout Strategies</h4>
                  <p className="text-sm text-gray-600">
                    Gradually release features with percentage-based and progressive rollouts
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