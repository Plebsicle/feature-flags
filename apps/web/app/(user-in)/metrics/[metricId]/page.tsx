import Link from "next/link"
import { cookies } from 'next/headers'
import { notFound } from "next/navigation"
import { ArrowLeft, BarChart3, Activity, Target, TrendingUp, Database, CalendarDays, Tag, Clock, Settings, Bell } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditMetricModal } from "@/components/edit-metric-modal"
import { DeleteMetricButton } from "@/components/delete-metric-button"
import { CreateAlertModal } from "@/components/create-alert-modal"
import { UpdateAlertModal } from "@/components/update-alert-modal"
import { DeleteAlertButton } from "@/components/delete-alert-button"
import { alert_operator, metric_aggregation_method, metric_type } from "@repo/db/client"

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

interface Alert {
  id: string
  metric_id: string
  operator: alert_operator
  threshold: number
  is_enabled: boolean
}

interface MetricResponse {
  success: boolean
  message: string
  data: Metric | null
}

interface AlertResponse {
  success: boolean
  message: string
  data: Alert | null
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
  let alert: Alert | null = null
  let error: string | null = null

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value

    // Fetch metric and alert data in parallel
    const [metricResponse, alertResponse] = await Promise.all([
      fetch(`${BACKEND_URL}/metrics/${metricId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId && { "Cookie": `sessionId=${sessionId}` })
        },
        next: { revalidate: 30 }
      }),
      fetch(`${BACKEND_URL}/alerts/${metricId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId && { "Cookie": `sessionId=${sessionId}` })
        },
        next: { revalidate: 30 }
      })
    ])

    if (!metricResponse.ok) {
      if (metricResponse.status === 404) {
        notFound()
      }
      throw new Error(`HTTP error! status: ${metricResponse.status}`)
    }

    const metricData: MetricResponse = await metricResponse.json()
    
    if (metricData.success) {
      metric = metricData.data
    } else {
      error = metricData.message || "Failed to fetch metric"
    }

    // Alert fetch is optional, don't fail if it errors
    if (alertResponse.ok) {
      try {
        const alertData: AlertResponse = await alertResponse.json()
        console.log("Alert response data:", alertData);
        console.log("alertData.success:", alertData.success);
        console.log("alertData.data:", alertData.data);
        console.log("Condition check (alertData.success && alertData.data):", alertData.success && alertData.data);
        
        if (alertData.success && alertData.data) {
          // Handle single alert object
          alert = alertData.data as Alert
          console.log("Alert assigned successfully:", alert);
        } else {
          console.log("Alert assignment skipped - condition not met");
          console.log("alertData.success:", alertData.success);
          console.log("alertData.data exists:", !!alertData.data);
        }
      } catch (alertErr) {
        console.warn("Error fetching alert data:", alertErr)
        // Continue without alert data
      }
    } else {
      console.log("Alert response not ok:", alertResponse.status);
    }
  } catch (err) {
    console.error("Error fetching data:", err)
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
              <div className="space-y-6">
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

                {/* Alert Configuration */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-neutral-100 flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Alert Configuration
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {!alert ? (
                          <CreateAlertModal metricId={metric.id} />
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled
                            className="border-slate-600 text-slate-500 cursor-not-allowed"
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            Create Alert
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {alert ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={alert.is_enabled ? "default" : "secondary"} 
                                className={alert.is_enabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}
                              >
                                {alert.is_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                {alert.operator.replace('_', ' ').toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-neutral-300">
                              Alert when metric value is{' '}
                              <span className="font-medium text-white">
                                {alert.operator.toLowerCase().replace('_', ' ')} {alert.threshold}
                              </span>
                              {metric.unit_measurement && (
                                <span className="text-neutral-400"> {metric.unit_measurement}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <UpdateAlertModal alert={alert} metricId={metric.id} />
                            <DeleteAlertButton alertId={alert.id} metricId={metric.id} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-300 mb-2">No alert setup</h3>
                        <p className="text-neutral-500 mb-4">
                          Set up an alert to be notified when this metric crosses a threshold.
                        </p>
                      </div>
                    )}
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
