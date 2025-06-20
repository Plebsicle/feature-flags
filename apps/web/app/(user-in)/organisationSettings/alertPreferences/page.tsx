import Link from "next/link"
import { cookies } from 'next/headers'
import { ArrowLeft, Bell, Settings, Mail, MessageSquare, Users, Clock, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateAlertPreferencesModal } from "@/components/create-alert-preferences-modal"
import { EditAlertPreferencesModal } from "@/components/edit-alert-preferences-modal"

// Types based on the API response structure and database schema
type user_role = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER"

interface AlertPreferences {
  id: string
  organisation_id: string
  alert_notification_frequency: Date | string
  email_enabled: boolean
  slack_enabled: boolean
  email_roles_notification: user_role[]
  created_at: Date
  updated_at: Date
}

interface AlertPreferencesResponse {
  success: boolean
  message: string
  data: AlertPreferences | null
}

export default async function AlertPreferencesPage() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  let preferences: AlertPreferences | null = null
  let error: string | null = null

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value

    const response = await fetch(`${BACKEND_URL}/organisation/preferences`, {
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

    const data: AlertPreferencesResponse = await response.json()
    console.log(data);
    if (data.success) {
      preferences = data.data
    } else {
      error = data.message || "Failed to fetch alert preferences"
    }
  } catch (err) {
    console.error("Error fetching alert preferences:", err)
    error = "Failed to fetch alert preferences. Please try again later."
  }

  const formatFrequency = (frequency: Date | string) => {
    try {
      const date = new Date(frequency)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return "Invalid time"
    }
  }

  const getRoleColor = (role: user_role) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "ADMIN":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "MEMBER":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "VIEWER":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with back navigation */}
        <div className="mb-8">
          <Link href="/organisationSettings/inviteMembers" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-300 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Organisation Settings
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Alert Preferences</h1>
              <p className="text-neutral-400">Configure how your organisation receives alert notifications</p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-red-400 font-medium">Error Loading Preferences</h3>
                  <p className="text-red-400/70 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Content */}
          {!error && (
            <>
              {preferences ? (
                /* Existing Preferences */
                <div className="space-y-6">
                  {/* Preferences Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Current Alert Configuration</h2>
                      <p className="text-neutral-400">Last updated {new Date(preferences.updated_at).toLocaleDateString()}</p>
                    </div>
                    <EditAlertPreferencesModal preferences={preferences} />
                  </div>

                  {/* Preferences Display */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Notification Methods */}
                    <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                      <CardHeader>
                        <CardTitle className="text-xl text-neutral-100 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Notification Methods
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-blue-400" />
                            <span className="text-neutral-300">Email Notifications</span>
                          </div>
                          <Badge 
                            variant={preferences.email_enabled ? "default" : "secondary"} 
                            className={preferences.email_enabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}
                          >
                            {preferences.email_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                            <span className="text-neutral-300">Slack Notifications</span>
                          </div>
                          <Badge 
                            variant={preferences.slack_enabled ? "default" : "secondary"} 
                            className={preferences.slack_enabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}
                          >
                            {preferences.slack_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                      <CardHeader>
                        <CardTitle className="text-xl text-neutral-100 flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Notification Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Notification Frequency
                          </h4>
                          <div className="p-3 bg-slate-700/30 rounded-lg">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              {formatFrequency(preferences.alert_notification_frequency)}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Email Recipients
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.email_roles_notification.map((role, index) => (
                              <Badge 
                                key={index}
                                className={getRoleColor(role)}
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Info */}
                  <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(preferences.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Settings className="w-4 h-4" />
                          ID: {preferences.id.substring(0, 8)}...
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* No Preferences - Setup Required */
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Setup Your Organisation's Alert Preferences</h2>
                  <p className="text-neutral-400 text-lg mb-8 max-w-2xl mx-auto">
                    Configure how and when your team receives notifications about metric alerts. 
                    Set up email and Slack notifications, choose notification frequencies, and specify which roles should receive alerts.
                  </p>
                  
                  <div className="space-y-4">
                    <CreateAlertPreferencesModal />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                      <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/30">
                        <Mail className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <h3 className="text-white font-medium mb-1">Email Alerts</h3>
                        <p className="text-neutral-400 text-sm">Get notifications via email</p>
                      </div>
                      <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/30">
                        <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <h3 className="text-white font-medium mb-1">Slack Integration</h3>
                        <p className="text-neutral-400 text-sm">Receive alerts in Slack channels</p>
                      </div>
                      <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/30">
                        <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <h3 className="text-white font-medium mb-1">Role-based Delivery</h3>
                        <p className="text-neutral-400 text-sm">Configure alerts by user roles</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
