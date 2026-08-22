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
} from "@/components/ui/icons"
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
    console.error(error)
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
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'STRING':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'NUMBER':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'JSON':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <Link href={`/flags/${flag.id}`}>
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${flag.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {flag.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1.5">
                  <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md font-mono border border-border">
                    {flag.key}
                  </code>
                  <Badge className={`text-[10px] px-1.5 py-0 font-medium ${getFlagTypeColor(flag.flag_type)}`}>
                    {flag.flag_type}
                  </Badge>
                </div>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {flag.description && (
            <CardDescription className="text-muted-foreground text-sm mt-3 line-clamp-2">
              {flag.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col justify-end space-y-4">
          
          {/* Tags Section */}
          {flag.tags && flag.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {flag.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium border-border bg-muted/50 text-muted-foreground">
                  {tag}
                </Badge>
              ))}
              {flag.tags.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium border-border bg-muted/50 text-muted-foreground">
                  +{flag.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Metadata Section */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>{formatDate(flag.updated_at)}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {flag.is_active ? (
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <ToggleRight className="w-4 h-4" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ToggleLeft className="w-4 h-4" /> Inactive
                </span>
              )}
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
  
  const activeCount = flags.filter(f => f.is_active).length
  const inactiveCount = flags.filter(f => !f.is_active).length

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Feature Flags</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{flags.length} Total</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-emerald-500">{activeCount} Active</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{inactiveCount} Inactive</span>
              </div>
            </div>
            <Link href="/create-flag/details">
              <Button className="w-full sm:w-auto shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Flag
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search flags..."
                className="pl-9 bg-background border-border focus:border-primary transition-all shadow-sm"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto shadow-sm bg-background">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Flags Grid */}
          {flags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {flags.map((flag) => (
                <FlagCard key={flag.id} flag={flag} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-dashed border-border bg-muted/20">
              <div className="w-12 h-12 bg-background shadow-sm rounded-xl border border-border flex items-center justify-center mx-auto mb-4">
                <Flag className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No flags found</h3>
              <p className="text-muted-foreground text-sm mb-6">Create your first feature flag to get started.</p>
              <Link href="/create-flag/details">
                <Button shadow-sm>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Flag
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}