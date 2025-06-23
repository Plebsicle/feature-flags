import { Suspense } from "react"
import { motion } from "framer-motion"
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
  Users,
  Activity,
  Calendar,
  Tag,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect } from "next/dist/server/api-utils"

// Types based on the API response
type FlagType = flag_type

type FeatureFlag  = feature_flags

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
    console.log(sessionId);
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
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'STRING':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'NUMBER':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'JSON':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Link href={`/flags/${flag.id}`}>
      <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300 cursor-pointer group h-full">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${flag.is_active ? 'bg-emerald-400' : 'bg-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg text-white truncate group-hover:text-blue-400 transition-colors">
                  {flag.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-xs text-neutral-500 bg-slate-700/50 px-2 py-1 rounded">
                    {flag.key}
                  </code>
                  <Badge className={`text-xs ${getFlagTypeColor(flag.flag_type)}`}>
                    {flag.flag_type}
                  </Badge>
                </div>
                {flag.description && (
                  <CardDescription className="text-neutral-400 mt-2 text-sm leading-relaxed line-clamp-2">
                    {flag.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <button className="text-neutral-400 hover:text-white transition-colors duration-200 flex-shrink-0 ml-2">
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-neutral-400">Status</span>
              <div className="flex items-center space-x-2">
                {flag.is_active ? (
                  <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${flag.is_active ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {flag.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {flag.tags && flag.tags.length > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-xs sm:text-sm text-neutral-400">Tags</span>
                <div className="flex flex-wrap gap-1 max-w-32">
                  {flag.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-slate-600 text-neutral-300">
                      {tag}
                    </Badge>
                  ))}
                  {flag.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-neutral-300">
                      +{flag.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-slate-700/50">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-neutral-400">Created</span>
                  <div className="text-xs sm:text-sm text-white font-medium truncate">
                    {formatDate(flag.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-neutral-400">Updated</span>
                  <div className="text-xs sm:text-sm text-white font-medium truncate">
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

// Loading component
const FlagsLoading = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 animate-pulse">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-3 h-3 rounded-full bg-gray-600 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="h-5 bg-gray-600 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

// Main Flags Page Component
export default async function FlagsPage() {
  const flags = await getFeatureFlags()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Feature Flags</h1>
              <p className="text-neutral-400 text-base sm:text-lg">
                Manage and monitor your feature flags across all environments
              </p>
            </div>
            <Link href="/create-flag/details">
                  <Button className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Flag
                  </Button>
                </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search flags..."
                className="pl-10 bg-slate-800/40 border-slate-700/30 text-white placeholder:text-neutral-400 focus:border-blue-500/50"
              />
            </div>
            <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50 hover:border-slate-600 w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">{flags.length}</div>
                    <div className="text-xs sm:text-sm text-neutral-400">Total Flags</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {flags.filter(f => f.is_active).length}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-400">Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {flags.filter(f => !f.is_active).length}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-400">Inactive</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {flags.reduce((acc, flag) => acc + (flag.tags?.length || 0), 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-400">Total Tags</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flags Grid */}
          <Suspense fallback={<FlagsLoading />}>
            {flags.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {flags.map((flag) => (
                  <FlagCard key={flag.id} flag={flag} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Flag className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No flags found</h3>
                <p className="text-neutral-400">Create your first feature flag to get started.</p>
                <Link href="/create-flag/details">
                  <Button className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Flag
                  </Button>
                </Link>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}