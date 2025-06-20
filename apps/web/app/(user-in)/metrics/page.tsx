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
} from "lucide-react"
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

  const getMetricGradient = (type: string) => {
    switch (type) {
      case "CONVERSION":
        return "from-purple-500 to-violet-600"
      case "COUNT":
        return "from-blue-500 to-indigo-600"
      case "NUMERIC":
        return "from-emerald-500 to-teal-600"
      default:
        return "from-slate-500 to-slate-600"
    }
  }

  const Icon = getMetricIcon(metric.metric_type)

  return (
    <Link href={`/metrics/${metric.id}`} className="block h-full">
      <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300 group cursor-pointer hover:scale-[1.02]">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getMetricGradient(metric.metric_type)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={metric.is_active ? "default" : "secondary"} 
                className={metric.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}
              >
                {metric.is_active ? "Active" : "Inactive"}
              </Badge>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
          <CardTitle className="text-xl text-neutral-100 font-semibold group-hover:text-white transition-colors duration-300">
            {metric.metric_name}
          </CardTitle>
          <CardDescription className="text-sm text-slate-400 font-mono">
            {metric.metric_key}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metric.description && (
            <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2">
              {metric.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              {metric.metric_type}
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              {metric.aggregation_method}
            </Badge>
            {metric.unit_measurement && (
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">
                {metric.unit_measurement}
              </Badge>
            )}
          </div>

          {metric.tags && metric.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {metric.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 text-xs"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {metric.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-700/50 text-slate-400 text-xs">
                  +{metric.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {new Date(metric.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {metric.aggregation_window}s window
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
    error = "Failed to fetch metrics. Please try again later."
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Metrics</h1>
              <p className="text-neutral-400">Monitor and analyze your feature performance</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Activity className="w-4 h-4" />
              {metrics.length} total metrics
              {metrics.filter(m => m.is_active).length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-emerald-400">
                    {metrics.filter(m => m.is_active).length} active
                  </span>
                </>
              )}
            </div>
            

          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-red-400 font-medium">Error Loading Metrics</h3>
                <p className="text-red-400/70 text-sm">{error}</p>
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
            <div className="w-16 h-16 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-neutral-300 mb-2">No metrics found</h3>
            <p className="text-neutral-500 mb-6">
              To create metrics, navigate to your feature flags and select a specific environment. 
              Metrics are created and configured per environment within your feature flags.
            </p>
            <Link href="/flags">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 mx-auto">
                <BarChart3 className="w-5 h-5" />
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
