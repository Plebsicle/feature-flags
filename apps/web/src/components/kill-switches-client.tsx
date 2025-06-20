'use client'

import { Suspense, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { 
  Skull, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ToggleLeft, 
  ToggleRight, 
  Activity, 
  Calendar, 
  Flag, 
  Layers,
  AlertTriangle 
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { $Enums } from "@repo/db/client"

// Types based on the API response
type KillSwitch = {
  flag_mappings: {
    id: string;
    created_at: Date;
    environments: $Enums.environment_type[];
    kill_switch_id: string;
    flag_id: string;
  }[];
} & {
  name: string;
  id: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  organization_id: string;
  description: string | null;
  created_by: string;
  activated_at: Date | null;
  activated_by: string | null;
}

interface KillSwitchesResponse {
  killSwitches: KillSwitch[]
  success: boolean
  message: string
}

// Kill Switch Card Component
const KillSwitchCard = ({ killSwitch }: { killSwitch: KillSwitch }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getEnvironmentColor = (env: $Enums.environment_type) => {
    switch (env) {
      case 'DEV':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'STAGING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'PROD':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'TEST':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Link href={`/killSwitch/${killSwitch.id}`}>
      <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300 cursor-pointer group h-full">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${killSwitch.is_active ? 'bg-red-400' : 'bg-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg text-white truncate group-hover:text-red-400 transition-colors">
                  {killSwitch.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`text-xs ${killSwitch.is_active ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                    {killSwitch.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                {killSwitch.description && (
                  <CardDescription className="text-neutral-400 mt-2 text-sm leading-relaxed line-clamp-2">
                    {killSwitch.description}
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
                {killSwitch.is_active ? (
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                ) : (
                  <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${killSwitch.is_active ? 'text-red-400' : 'text-gray-400'}`}>
                  {killSwitch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {(killSwitch.flag_mappings?.length ?? 0) > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-xs sm:text-sm text-neutral-400">Flags</span>
                <div className="flex flex-wrap gap-1 max-w-32">
                  <Badge variant="outline" className="text-xs border-slate-600 text-neutral-300">
                    {killSwitch.flag_mappings.length} flag{killSwitch.flag_mappings.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            )}

            {(killSwitch.flag_mappings?.length ?? 0) > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-xs sm:text-sm text-neutral-400">Environments</span>
                <div className="flex flex-wrap gap-1 max-w-32">
                  {Array.from(new Set((killSwitch.flag_mappings ?? []).flatMap(fm => fm.environments ?? [])))
                    .slice(0, 2)
                    .map((env, index) => (
                      <Badge 
                        key={index} 
                        className={`text-xs ${getEnvironmentColor(env)}`}
                      >
                        {env}
                      </Badge>
                    ))}
                  {Array.from(new Set((killSwitch.flag_mappings ?? []).flatMap(fm => fm.environments ?? []))).length > 2 && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-neutral-300">
                      +{Array.from(new Set((killSwitch.flag_mappings ?? []).flatMap(fm => fm.environments ?? []))).length - 2}
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
                    {formatDate(killSwitch.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-neutral-400">Updated</span>
                  <div className="text-xs sm:text-sm text-white font-medium truncate">
                    {formatDate(killSwitch.updated_at)}
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
const KillSwitchesLoading = () => (
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

// Main Kill Switches Client Component
export default function KillSwitchesClient() {
  const [killSwitches, setKillSwitches] = useState<KillSwitch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKillSwitches = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/killSwitch`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result: {data? : KillSwitchesResponse,success : boolean,message? : string} = await response.json()
        console.log(result);
        if (result.success) {
          const killSwitches = result?.data?.killSwitches ?? [];
          setKillSwitches(Array.isArray(killSwitches) ? killSwitches : []);
        } else {
          throw new Error(result.message || 'Failed to fetch kill switches')
        }
      } catch (error) {
        console.error('Error fetching kill switches:', error)
        setError('Failed to fetch kill switches')
      } finally {
        setLoading(false)
      }
    }

    fetchKillSwitches()
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <KillSwitchesLoading />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Kill Switches</h1>
              <p className="text-neutral-400 text-base sm:text-lg">
                Manage emergency kill switches to disable features across environments
              </p>
            </div>
            <Link href="/create-switch">
            <Button className="mt-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
                Add Kill Switch
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search kill switches..."
                className="pl-10 bg-slate-800/40 border-slate-700/30 text-white placeholder:text-neutral-400 focus:border-red-500/50"
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
                  <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">{killSwitches.length}</div>
                    <div className="text-xs sm:text-sm text-neutral-400">Total Kill Switches</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {killSwitches.filter(ks => ks.is_active).length}
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
                      {killSwitches.filter(ks => !ks.is_active).length}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-400">Inactive</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {killSwitches.reduce((acc, ks) => acc + (ks.flag_mappings?.length || 0), 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-400">Total Flags</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kill Switches Grid or Placeholder */}
          <Suspense fallback={<KillSwitchesLoading />}>
            {error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Error loading kill switches</h3>
                <p className="text-neutral-400">{error}</p>
              </div>
            ) : killSwitches.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
              >
                {killSwitches.map((killSwitch) => (
                  <motion.div key={killSwitch.id} variants={itemVariants}>
                    <KillSwitchCard killSwitch={killSwitch} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <Skull className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No kill switches found</h3>
                <p className="text-neutral-400">Create your first kill switch to get started.</p>
                <Link href="/create-switch">
                    <Button className="mt-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                        Add Kill Switch
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