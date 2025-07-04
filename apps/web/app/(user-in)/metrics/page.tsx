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

  const getMetricColor = (type: string) => {
    switch (type) {
      case "CONVERSION":
        return "bg-purple-100 text-purple-600"
      case "COUNT":
        return "bg-indigo-100 text-indigo-600"
      case "NUMERIC":
        return "bg-emerald-100 text-emerald-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const Icon = getMetricIcon(metric.metric_type)

  return (
    <Link href={`/metrics/${metric.id}`} className="block h-full">
      <Card className="h-full hover:shadow-md transition-all duration-200 group cursor-pointer">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div
              className={`w-12 h-12 rounded-xl ${getMetricColor(metric.metric_type)} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={metric.is_active ? "default" : "secondary"} 
                className={metric.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}
              >
                {metric.is_active ? "Active" : "Inactive"}
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </div>
          <CardTitle className="text-xl text-gray-900 font-semibold group-hover:text-indigo-600 transition-colors duration-200">
            {metric.metric_name}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 font-mono">
            {metric.metric_key}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metric.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {metric.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              {metric.metric_type}
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 text-xs">
              {metric.aggregation_method}
            </Badge>
            {metric.unit_measurement && (
              <Badge className="bg-teal-100 text-teal-800 text-xs">
                {metric.unit_measurement}
              </Badge>
            )}
          </div>

          {metric.tags && metric.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {metric.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {metric.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
                  +{metric.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
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
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Metrics</h1>
              <p className="text-gray-600">Monitor and analyze your feature performance</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              {metrics.length} total metrics
              {metrics.filter(m => m.is_active).length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-emerald-600">
                    {metrics.filter(m => m.is_active).length} active
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Metrics</h3>
                <p className="text-red-600 text-sm">{error}</p>
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
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No metrics found</h3>
            <p className="text-gray-600 mb-6">
              To create metrics, navigate to your feature flags and select a specific environment. 
              Metrics are created and configured per environment within your feature flags.
            </p>
            <Link href="/flags">
              <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto">
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
