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
import { EnhancedCopyButton } from "@/components/enhanced-copy-button"
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

  const getMetricIconBackground = (type: string) => {
    switch (type) {
      case "CONVERSION":
        return "bg-purple-100 text-purple-600"
      case "COUNT":
        return "bg-blue-100 text-blue-600"
      case "NUMERIC":
        return "bg-emerald-100 text-emerald-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const Icon = metric ? getMetricIcon(metric.metric_type) : BarChart3

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with back navigation */}
        <div>
          <Link href="/metrics" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Metrics
          </Link>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-red-800 font-medium">Error Loading Metric</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {metric && (
            <>
              {/* Metric Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl ${getMetricIconBackground(metric.metric_type)} flex items-center justify-center`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">{metric.metric_name}</h1>
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-md">
                        <code className="text-lg text-gray-700 font-mono">{metric.metric_key}</code>
                      </div>
                      <EnhancedCopyButton 
                        text={metric.metric_key}
                        successMessage="Metric key copied to clipboard"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge 
                        variant={metric.is_active ? "default" : "secondary"} 
                        className={metric.is_active ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-600 border-0"}
                      >
                        {metric.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge className="bg-indigo-100 text-indigo-700 border-0">
                        {metric.metric_type}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-700 border-0">
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
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Metric Key</h4>
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-medium text-indigo-700 font-mono bg-white px-3 py-1.5 rounded border border-indigo-100">
                            {metric.metric_key}
                          </code>
                          <EnhancedCopyButton 
                            text={metric.metric_key}
                            successMessage="Metric key copied to clipboard"
                          />
                        </div>
                      </div>
                      
                      {metric.description && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                          <p className="text-gray-600 leading-relaxed">{metric.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Metric Type</h4>
                          <Badge className="bg-indigo-100 text-indigo-700 border-0">
                            {metric.metric_type}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Aggregation Method</h4>
                          <Badge className="bg-amber-100 text-amber-700 border-0">
                            {metric.aggregation_method}
                          </Badge>
                        </div>
                      </div>

                      {metric.unit_measurement && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Unit of Measurement</h4>
                          <Badge className="bg-teal-100 text-teal-700 border-0">
                            {metric.unit_measurement}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tags and Metadata */}
                  <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-indigo-600" />
                        Tags & Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {metric.tags && metric.tags.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {metric.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-sm"
                              >
                                <Tag className="w-3 h-3 mr-2" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                          <p className="text-gray-500 text-sm">No tags assigned</p>
                        </div>
                      )}

                      <div className="space-y-3 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Created</span>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CalendarDays className="w-4 h-4" />
                            {new Date(metric.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Last Updated</span>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Activity className="w-4 h-4" />
                            {new Date(metric.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Alert Configuration */}
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-indigo-600" />
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
                            className="text-gray-500 cursor-not-allowed"
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
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={alert.is_enabled ? "default" : "secondary"} 
                                className={alert.is_enabled ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-600 border-0"}
                              >
                                {alert.is_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                              <Badge className="bg-orange-100 text-orange-700 border-0">
                                {alert.operator.replace('_', ' ').toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-gray-700">
                              Alert when metric value is{' '}
                              <span className="font-medium text-gray-900">
                                {alert.operator.toLowerCase().replace('_', ' ')} {alert.threshold}
                              </span>
                              {metric.unit_measurement && (
                                <span className="text-gray-600"> {metric.unit_measurement}</span>
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
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No alert setup</h3>
                        <p className="text-gray-600 mb-4">
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