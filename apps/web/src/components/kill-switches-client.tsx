'use client'

import { useEffect, useState } from "react"
import { 
  Power, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ToggleLeft, 
  Activity, 
  Calendar, 
  Layers,
  AlertTriangle 
} from "@/components/ui/icons"
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
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'STAGING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'PROD':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'TEST':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <Link href={`/killSwitch/${killSwitch.id}`}>
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group h-full rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
        <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className={`w-3 h-3 mt-1 flex-shrink-0 shadow-sm rounded-full ${killSwitch.is_active ? 'bg-red-500 shadow-red-500/50' : 'bg-muted-foreground shadow-none'}`} />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg text-foreground font-semibold truncate group-hover:text-red-500 transition-colors">
                  {killSwitch.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={killSwitch.is_active ? "destructive" : "secondary"} className="rounded-md font-medium text-xs px-2 py-0">
                    {killSwitch.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                {killSwitch.description && (
                  <CardDescription className="text-muted-foreground text-sm mt-2 leading-relaxed line-clamp-2">
                    {killSwitch.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors duration-200 flex-shrink-0 ml-2">
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <div className="flex items-center space-x-2">
                {killSwitch.is_active ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={`text-xs font-medium ${killSwitch.is_active ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {killSwitch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {(killSwitch.flag_mappings?.length ?? 0) > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground">Flags</span>
                <div className="flex flex-wrap gap-1 max-w-32">
                  <Badge variant="outline" className="text-xs font-medium rounded-md border-border">
                    {killSwitch.flag_mappings.length} flag{killSwitch.flag_mappings.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            )}

            {(killSwitch.flag_mappings?.length ?? 0) > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground">Environments</span>
                <div className="flex flex-wrap gap-1 max-w-32">
                  {Array.from(new Set((killSwitch.flag_mappings ?? []).flatMap(fm => fm.environments ?? [])))
                    .slice(0, 2)
                    .map((env, index) => (
                      <Badge 
                        key={index} 
                        className={`text-xs font-medium rounded-md border-border ${getEnvironmentColor(env)} px-2 py-0`}
                      >
                        {env}
                      </Badge>
                    ))}
                  {Array.from(new Set((killSwitch.flag_mappings ?? []).flatMap(fm => fm.environments ?? []))).length > 2 && (
                    <Badge variant="outline" className="text-xs font-medium rounded-md border-border px-2 py-0">
                      +{Array.from(new Set((killSwitch.flag_mappings ?? []).flatMap(fm => fm.environments ?? []))).length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Created</div>
                  <div className="text-sm font-medium text-foreground truncate">
                    {formatDate(killSwitch.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Updated</div>
                  <div className="text-sm font-medium text-foreground truncate">
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
      <Card key={i} className="animate-pulse rounded-xl border-border bg-card/50">
        <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-3 h-3 bg-muted mt-1 flex-shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="h-5 bg-muted rounded-md w-3/4 mb-2" />
                <div className="h-4 bg-muted/50 rounded-md w-1/2" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="h-4 bg-muted/50 rounded-md w-full" />
            <div className="h-4 bg-muted/50 rounded-md w-2/3" />
            <div className="h-4 bg-muted/50 rounded-md w-1/2" />
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
      const response = await fetch(`${backendUrl}/killSwitch`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: any = await response.json()
  
      if (data.success) {
        // console.log('✅ Kill switches data received:', data.data)
        // console.log('📊 Number of kill switches:', data.data?.length || 0)
        
        // Ensure we always set an array
        const killSwitchesArray = Array.isArray(data.data.killSwitches) ? data.data.killSwitches : []
        // console.log('🔧 Setting kill switches array:', killSwitchesArray)
        setKillSwitches(killSwitchesArray)
      } else {
        throw new Error('Failed to fetch kill switches')
      }
    } catch (err) { // console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to fetch kill switches')
    } finally {
      setLoading(false)
      // console.log('🔄 Loading set to false')
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
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 max-w-md mx-auto shadow-sm">
          <div className="text-destructive font-semibold mb-2">Error loading kill switches</div>
          <div className="text-destructive/80 text-sm mb-4">{error}</div>
          <Button 
            onClick={fetchKillSwitches}
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive text-sm h-8 rounded-lg"
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
        <div className="flex items-center space-x-4">
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <Power className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">Kill Switches</h1>
            <p className="text-sm text-muted-foreground">Emergency controls for your feature flags</p>
          </div>
        </div>
        
        <Link href="/create-switch">
          <Button className="font-medium text-sm h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Kill Switch
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search kill switches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-border bg-background rounded-lg text-sm focus:border-primary shadow-sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Kill Switches</p>
                <p className="text-3xl font-bold text-foreground mt-1">{killSwitches.length}</p>
              </div>
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                <Layers className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Switches</p>
                <p className="text-3xl font-bold text-red-500 mt-1">{activeKillSwitches.length}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Switches</p>
                <p className="text-3xl font-bold text-foreground mt-1">{inactiveKillSwitches.length}</p>
              </div>
              <div className="bg-muted border border-border p-3 rounded-lg">
                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kill Switches Grid */}
      {loading ? (
        <div>
          <KillSwitchesLoading />
        </div>
      ) : filteredKillSwitches.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-card/50 border border-border border-dashed rounded-xl p-10 max-w-md mx-auto backdrop-blur">
            <Power className="w-12 h-12 text-muted-foreground mx-auto mb-6 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-3">
              {searchQuery ? 'No kill switches found' : 'No kill switches yet'}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {searchQuery 
                ? 'Try adjusting your search query to find what you\'re looking for.'
                : 'Create your first kill switch to have emergency control over your feature flags.'
              }
            </p>
            {!searchQuery && (
              <Link href="/create-switch">
                <Button className="font-medium text-sm h-10 px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Kill Switch
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredKillSwitches.map((killSwitch) => {
              // console.log(`🎯 Rendering kill switch ${index + 1}:`, killSwitch.name, killSwitch)
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