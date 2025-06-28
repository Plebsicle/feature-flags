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
  data: KillSwitch[]
  success: boolean
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
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'STAGING':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'PROD':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'TEST':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <Link href={`/killSwitch/${killSwitch.id}`}>
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group h-full">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${killSwitch.is_active ? 'bg-red-500' : 'bg-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg text-gray-900 truncate group-hover:text-red-600 transition-colors">
                  {killSwitch.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={killSwitch.is_active ? "destructive" : "secondary"}>
                    {killSwitch.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                {killSwitch.description && (
                  <CardDescription className="text-gray-600 mt-2 text-sm leading-relaxed line-clamp-2">
                    {killSwitch.description}
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
              <span className="text-xs sm:text-sm text-gray-500">Status</span>
              <div className="flex items-center space-x-2">
                {killSwitch.is_active ? (
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                ) : (
                  <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${killSwitch.is_active ? 'text-red-600' : 'text-gray-500'}`}>
                  {killSwitch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {(killSwitch.flag_mappings?.length ?? 0) > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-xs sm:text-sm text-gray-500">Flags</span>
                <div className="flex flex-wrap gap-1 max-w-32">
                  <Badge variant="outline" className="text-xs">
                    {killSwitch.flag_mappings.length} flag{killSwitch.flag_mappings.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            )}

            {(killSwitch.flag_mappings?.length ?? 0) > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-xs sm:text-sm text-gray-500">Environments</span>
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
                    <Badge variant="outline" className="text-xs">
                      +{Array.from(new Set((killSwitch.flag_mappings ?? []).flatMap(fm => fm.environments ?? []))).length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500">Created</span>
                  <div className="text-xs sm:text-sm text-gray-900 font-medium truncate">
                    {formatDate(killSwitch.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500">Updated</span>
                  <div className="text-xs sm:text-sm text-gray-900 font-medium truncate">
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
      <Card key={i} className="animate-pulse">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

export default function KillSwitchesClient() {
  const [killSwitches, setKillSwitches] = useState<KillSwitch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const fetchKillSwitches = async () => {
    try {
      setLoading(true)
      setError(null)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`/${backendUrl}/killSwitch`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      let data: any = await response.json()
  
      if (data.success) {
        console.log('✅ Kill switches data received:', data.data)
        console.log('📊 Number of kill switches:', data.data?.length || 0)
        
        // Ensure we always set an array
        const killSwitchesArray = Array.isArray(data.data.killSwitches) ? data.data.killSwitches : []
        console.log('🔧 Setting kill switches array:', killSwitchesArray)
        setKillSwitches(killSwitchesArray)
      } else {
        throw new Error('Failed to fetch kill switches')
      }
    } catch (err) {
      console.error('Error fetching kill switches:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch kill switches')
    } finally {
      setLoading(false)
      console.log('🔄 Loading set to false')
    }
  }

  useEffect(() => {
    fetchKillSwitches()
  }, [])

  // Filter kill switches based on search query
  const filteredKillSwitches = Array.isArray(killSwitches) 
    ? killSwitches.filter(killSwitch =>
        killSwitch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (killSwitch.description && killSwitch.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []

  const activeKillSwitches = filteredKillSwitches.filter(ks => ks.is_active)
  const inactiveKillSwitches = filteredKillSwitches.filter(ks => !ks.is_active)

  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 mb-2">Error loading kill switches</div>
          <div className="text-red-700 mb-4">{error}</div>
          <Button 
            onClick={fetchKillSwitches}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <Skull className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kill Switches</h1>
            <p className="text-gray-600">Emergency controls for your feature flags</p>
          </div>
        </div>
        
        <Link href="/create-switch">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Kill Switch
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search kill switches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Kill Switches</p>
                <p className="text-2xl font-bold text-gray-900">{killSwitches.length}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Layers className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Switches</p>
                <p className="text-2xl font-bold text-red-600">{activeKillSwitches.length}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Switches</p>
                <p className="text-2xl font-bold text-gray-600">{inactiveKillSwitches.length}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <ToggleLeft className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kill Switches Grid */}
      {loading ? (
        <div>
          <p className="text-gray-600 mb-4">Loading kill switches...</p>
          <KillSwitchesLoading />
        </div>
      ) : filteredKillSwitches.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
            <Skull className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No kill switches found' : 'No kill switches yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search query to find what you\'re looking for.'
                : 'Create your first kill switch to have emergency control over your feature flags.'
              }
            </p>
            {!searchQuery && (
              <Link href="/create-switch">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Kill Switch
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">Rendering {filteredKillSwitches.length} kill switches...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredKillSwitches.map((killSwitch, index) => {
              console.log(`🎯 Rendering kill switch ${index + 1}:`, killSwitch.name, killSwitch)
              return (
                <div key={killSwitch.id}>
                  <KillSwitchCard killSwitch={killSwitch} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 