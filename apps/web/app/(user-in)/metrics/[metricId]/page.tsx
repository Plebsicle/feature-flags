import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BarChart3, Activity, Target, TrendingUp, Database, CalendarDays, Tag, Clock, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditMetricModal } from "@/components/edit-metric-modal"
import { DeleteMetricButton } from "@/components/delete-metric-button"

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
  metric_type: "CONVERSION" | "COUNT" | "NUMERIC"
  aggregation_window: number
  unit_measurement: string | null
  aggregation_method: "SUM" | "AVERAGE" | "P99" | "P90" | "P95" | "P75" | "P50"
}

interface MetricResponse {
  success: boolean
  message: string
  data: Metric | null
}

interface MetricDetailPageProps {
  params: {
    metricId: string
  }
}

export default async function MetricDetailPage({ params }: MetricDetailPageProps) {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
  const { metricId } = params

  let metric: Metric | null = null
  let error: string | null = null

  try {
    const response = await fetch(`${BACKEND_URL}/metrics/metric?metric_id=${metricId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache control for server components
      next: { revalidate: 30 } // Revalidate every 30 seconds for detail pages
    })

    if (!response.ok) {
      if (response.status === 404) {
        notFound()
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: MetricResponse = await response.json()
    
    if (data.success) {
      metric = data.data
    } else {
      error = data.message || "Failed to fetch metric"
    }
  } catch (err) {
    console.error("Error fetching metric:", err)
    error = "Failed to fetch metric. Please try again later."
  }

  if (!metric && !error) {
    notFound()
  }

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

  const Icon = metric ? getMetricIcon(metric.metric_type) : BarChart3

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with back navigation */}
        <div className="mb-8">
          <Link href="/metrics" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-300 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Metrics
          </Link>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-red-400 font-medium">Error Loading Metric</h3>
                  <p className="text-red-400/70 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {metric && (
            <>
              {/* Metric Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${getMetricGradient(metric.metric_type)} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{metric.metric_name}</h1>
                    <p className="text-lg text-slate-400 font-mono">{metric.metric_key}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge 
                        variant={metric.is_active ? "default" : "secondary"} 
                        className={metric.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}
                      >
                        {metric.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {metric.metric_type}
                      </Badge>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        {metric.aggregation_method}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <EditMetricModal metric={metric} />
                  <DeleteMetricButton metricId={metric.id} metricName={metric.metric_name} />
                </div>
              </div>

              {/* Metric Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-xl text-neutral-100 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metric.description && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Description</h4>
                        <p className="text-neutral-400 leading-relaxed">{metric.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Metric Type</h4>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {metric.metric_type}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Aggregation Method</h4>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {metric.aggregation_method}
                        </Badge>
                      </div>
                    </div>

                    {metric.unit_measurement && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Unit of Measurement</h4>
                        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                          {metric.unit_measurement}
                        </Badge>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-neutral-300 mb-2">Aggregation Window</h4>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Clock className="w-4 h-4" />
                        {metric.aggregation_window} seconds
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags and Metadata */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-xl text-neutral-100 flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Tags & Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metric.tags && metric.tags.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-300 mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {metric.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-md bg-slate-700/50 text-slate-300 text-sm"
                            >
                              <Tag className="w-3 h-3 mr-2" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Tags</h4>
                        <p className="text-neutral-500 text-sm">No tags assigned</p>
                      </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Created</span>
                        <div className="flex items-center gap-2 text-neutral-300">
                          <CalendarDays className="w-4 h-4" />
                          {new Date(metric.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Last Updated</span>
                        <div className="flex items-center gap-2 text-neutral-300">
                          <Activity className="w-4 h-4" />
                          {new Date(metric.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Metric ID</span>
                        <span className="text-neutral-300 font-mono text-sm">{metric.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">Environment ID</span>
                        <span className="text-neutral-300 font-mono text-sm">{metric.flag_environment_id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
