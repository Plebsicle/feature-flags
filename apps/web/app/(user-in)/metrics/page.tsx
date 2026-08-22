import Link from "next/link"
import { cookies } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Activity, 
  Target, 
  TrendingUp,
  CalendarDays,
  Tag,
  Database,
  ArrowRight
} from "@/components/ui/icons"  
import { metric_aggregation_method, metric_type } from "@repo/db/client"

// Types based on the API response structure
interface Metric {
  id: string
  created_at: Date
  updated_at: Date
  is_active: boolean
  organization_id: string
  description: string | null
  tags: string[]
  flag_environment_id: string
  metric_name: string
  metric_key: string
  metric_type: metric_type
  aggregation_window: number
  unit_measurement: string | null
  aggregation_method: metric_aggregation_method
}

interface MetricsResponse {
  success: boolean
  message: string
  data: Metric[]
}

// Client component for metric cards with animations and navigation
function MetricCard({ metric }: { metric: Metric }) {
  const getMetricIcon = (type: string) => {
    switch (type) {
      case "CONVERSION":
        return Target
      case "COUNT":
        return Database
      case "NUMERIC":
        return TrendingUp
      default:
        return BarChart3
    }
  }

  const getMetricColor = (type: string) => {
    switch (type) {
      case "CONVERSION":
        return "bg-primary/10 text-primary border border-primary/20"
      case "COUNT":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20"
      case "NUMERIC":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      default:
        return "bg-muted text-muted-foreground border border-border"
    }
  }

  const Icon = getMetricIcon(metric.metric_type)

  return (
    <Link href={`/metrics/${metric.id}`} className="block h-full">
      <Card className="h-full hover:shadow-md transition-shadow duration-200 group cursor-pointer rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div
              className={`w-12 h-12 rounded-lg ${getMetricColor(metric.metric_type)} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={metric.is_active ? "destructive" : "secondary"} 
                className={`rounded-md text-xs font-medium uppercase ${metric.is_active ? 'bg-emerald-500 text-emerald-foreground' : ''}`}
              >
                {metric.is_active ? "Active" : "Inactive"}
              </Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </div>
          <CardTitle className="text-xl text-foreground font-semibold group-hover:text-primary transition-colors duration-200 truncate">
            {metric.metric_name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground truncate">
            {metric.metric_key}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {metric.description && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {metric.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-md border-border text-xs font-medium uppercase">
              {metric.metric_type}
            </Badge>
            <Badge variant="outline" className="rounded-md border-border text-xs font-medium uppercase">
              {metric.aggregation_method}
            </Badge>
            {metric.unit_measurement && (
              <Badge variant="outline" className="rounded-md border-border text-xs font-medium uppercase">
                {metric.unit_measurement}
              </Badge>
            )}
          </div>

          {metric.tags && metric.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {metric.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md border border-border bg-muted/30 text-foreground text-xs font-medium"
                >
                  <Tag className="w-3 h-3 mr-1 opacity-70" />
                  {tag}
                </span>
              ))}
              {metric.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md border border-border bg-muted/30 text-muted-foreground text-xs font-medium">
                  +{metric.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" />
              {new Date(metric.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              {metric.aggregation_window}s win
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function MetricsPage() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  let metrics: Metric[] = []
  let error: string | null = null

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value

    const response = await fetch(`${BACKEND_URL}/metrics`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(sessionId && { "Cookie": `sessionId=${sessionId}` })
      },
      // Add cache control for server components
      next: { revalidate: 60 } // Revalidate every 60 seconds
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: MetricsResponse = await response.json()
    
    if (data.success) {
      metrics = data.data
    } else {
      error = data.message || "Failed to fetch metrics"
    }
  } catch (err) {
    console.error("Error fetching metrics:", err)
    let error = "Failed to fetch metrics. Please try again later."
  }

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">Metrics</h1>
              <p className="text-sm text-muted-foreground">Monitor and analyze your feature performance</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="w-4 h-4" />
              {metrics.length} total metrics
              {metrics.filter(m => m.is_active).length > 0 && (
                <>
                  <span className="mx-2 text-border">•</span>
                  <span className="text-emerald-500 font-semibold">
                    {metrics.filter(m => m.is_active).length} active
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-destructive/20 rounded-lg flex items-center justify-center border border-destructive/30">
                <Activity className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <h3 className="text-destructive font-semibold text-sm mb-1">Error Loading Metrics</h3>
                <p className="text-destructive/80 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {metrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted border border-border rounded-xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">No metrics found</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
              To create metrics, navigate to your feature flags and select a specific environment. 
              Metrics are created and configured per environment within your feature flags.
            </p>
            <Link href="/feature-flags">
              <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg transition-all flex items-center gap-2 mx-auto shadow-sm">
                <BarChart3 className="w-4 h-4" />
                Go to Feature Flags
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
