import Link from "next/link"
import { cookies } from 'next/headers'
import { notFound } from "next/navigation"
import { ArrowLeft, BarChart3, Activity, Target, TrendingUp, Database, CalendarDays, Tag, Settings, Bell } from "@/components/ui/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  params: Promise<{
    metricId: string
  }>
}

export default async function MetricDetailPage({ params }: MetricDetailPageProps) {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
  const { metricId } = await params

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
      }),
      fetch(`${BACKEND_URL}/alerts/${metricId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId && { "Cookie": `sessionId=${sessionId}` })
        },
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
    let error = "Failed to fetch metric. Please try again later."
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
        return "bg-primary/10 text-primary border border-primary/20"
      case "COUNT":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20"
      case "NUMERIC":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      default:
        return "bg-muted text-muted-foreground border border-border"
    }
  }

  const Icon = metric ? getMetricIcon(metric.metric_type) : BarChart3

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with back navigation */}
        <div>
          <Link href="/metrics" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Metrics
          </Link>

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-destructive/20 rounded-md flex items-center justify-center border border-destructive/30">
                  <Activity className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-destructive font-semibold text-sm mb-1">Error Loading Metric</h3>
                  <p className="text-destructive/80 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {metric && (
            <>
              {/* Metric Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl ${getMetricIconBackground(metric.metric_type)} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">{metric.metric_name}</h1>
                    <div className="flex items-center space-x-3">
                      <div className="bg-muted border border-border rounded-lg px-3 py-2 flex-1 max-w-md">
                        <code className="text-sm text-foreground font-mono">{metric.metric_key}</code>
                      </div>
                      <EnhancedCopyButton 
                        text={metric.metric_key}
                        successMessage="Metric key copied to clipboard"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge 
                        variant={metric.is_active ? "destructive" : "secondary"} 
                        className={`rounded-md font-medium text-xs ${metric.is_active ? "bg-emerald-500 text-emerald-foreground" : ""}`}
                      >
                        {metric.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="rounded-md border-border font-medium text-xs">
                        {metric.metric_type}
                      </Badge>
                      <Badge variant="outline" className="rounded-md border-border font-medium text-xs">
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
                  <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                    <CardHeader className="border-b border-border/50 pb-4">
                      <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                        <div className="bg-primary/10 p-2 rounded-lg mr-3 border border-primary/20">
                          <Settings className="w-5 h-5 text-primary" />
                        </div>
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Metric Key</h4>
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono text-foreground bg-muted px-3 py-1.5 rounded-md border border-border">
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
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                          <p className="text-sm text-foreground leading-relaxed">{metric.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Metric Type</h4>
                          <Badge variant="outline" className="rounded-md border-border font-medium text-xs">
                            {metric.metric_type}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Aggregation Method</h4>
                          <Badge variant="outline" className="rounded-md border-border font-medium text-xs">
                            {metric.aggregation_method}
                          </Badge>
                        </div>
                      </div>

                      {metric.unit_measurement && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Unit of Measurement</h4>
                          <Badge variant="outline" className="rounded-md border-border font-medium text-xs">
                            {metric.unit_measurement}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tags and Metadata */}
                  <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                    <CardHeader className="border-b border-border/50 pb-4">
                      <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                        <div className="bg-primary/10 p-2 rounded-lg mr-3 border border-primary/20">
                          <Tag className="w-5 h-5 text-primary" />
                        </div>
                        Tags & Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {metric.tags && metric.tags.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {metric.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md border border-border bg-muted/30 text-foreground text-xs font-medium"
                              >
                                <Tag className="w-3 h-3 mr-2 opacity-70" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                          <p className="text-sm text-muted-foreground">No tags assigned</p>
                        </div>
                      )}

                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Created</span>
                          <div className="flex items-center gap-2 text-foreground text-sm">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            {new Date(metric.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                          <div className="flex items-center gap-2 text-foreground text-sm">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            {new Date(metric.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Alert Configuration */}
                <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                        <div className="bg-primary/10 p-2 rounded-lg mr-3 border border-primary/20">
                          <Bell className="w-5 h-5 text-primary" />
                        </div>
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
                            className="text-xs rounded-md opacity-50 cursor-not-allowed font-medium"
                          >
                            <Bell className="w-3 h-3 mr-2" />
                            Create Alert
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {alert ? (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/20 border border-border rounded-lg gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={alert.is_enabled ? "destructive" : "secondary"} 
                                className={`rounded-md font-medium text-xs ${alert.is_enabled ? "bg-emerald-500 text-emerald-foreground" : ""}`}
                              >
                                {alert.is_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                              <Badge variant="outline" className="rounded-md border-border font-medium text-xs text-orange-500 border-orange-500/30 bg-orange-500/10">
                                {alert.operator.replace('_', ' ').toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Alert when metric value is{' '}
                              <span className="font-semibold text-foreground mx-1 text-primary">
                                {alert.operator.toLowerCase().replace('_', ' ')} {alert.threshold}
                              </span>
                              {metric.unit_measurement && (
                                <span> {metric.unit_measurement}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <UpdateAlertModal alert={alert} metricId={metric.id} />
                            <DeleteAlertButton metricId={metric.id} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-muted/10 border border-dashed border-border rounded-xl">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-6 h-6 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">No alert setup</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
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