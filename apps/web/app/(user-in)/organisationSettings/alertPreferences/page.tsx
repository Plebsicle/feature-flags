import Link from "next/link"
import { cookies } from "next/headers"
import { ArrowLeft, Bell, Settings, Mail, MessageSquare, Users, Calendar } from "lucide-react"
import { Card, CardContent,  CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateAlertPreferencesModal } from "@/components/create-alert-preferences-modal"
import { EditAlertPreferencesModal } from "@/components/edit-alert-preferences-modal"
import { 
  AlertPreferences, 
  AlertPreferencesResponse, 
  getRoleColor 
} from "@/lib/alert-preferences-types"

export default async function AlertPreferencesPage() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  let preferences: AlertPreferences | null = null
  let error: string | null = null

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("sessionId")?.value

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

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back navigation */}
        <div className="mb-8">
          <Link href="/organisationSettings/inviteMembers" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Organisation Settings
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alert Preferences</h1>
              <p className="text-gray-600">Configure how your organisation receives alert notifications</p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-red-800 font-medium">Error Loading Preferences</h3>
                  <p className="text-red-600 text-sm">{error}</p>
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
                      <h2 className="text-2xl font-semibold text-gray-900">Current Alert Configuration</h2>
                      <p className="text-gray-600">Last updated {new Date(preferences.updated_at).toLocaleDateString()}</p>
                    </div>
                    <EditAlertPreferencesModal preferences={preferences} />
                  </div>

                  {/* Preferences Display */}
                  <div className="space-y-6">
                    {/* Notification Methods */}
                    <Card className="hover:shadow-md transition-shadow duration-200">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Notification Methods
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-indigo-600" />
                            <span className="text-gray-700">Email Notifications</span>
                          </div>
                          <Badge 
                            variant={preferences.email_enabled ? "default" : "secondary"} 
                            className={preferences.email_enabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}
                          >
                            {preferences.email_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                            <span className="text-gray-700">Slack Notifications</span>
                          </div>
                          <Badge 
                            variant={preferences.slack_enabled ? "default" : "secondary"} 
                            className={preferences.slack_enabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}
                          >
                            {preferences.slack_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="hover:shadow-md transition-shadow duration-200">
                      <CardHeader>
                        <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Notification Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
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
                  <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(preferences.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
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
                  <div className="w-20 h-20 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-10 h-10 text-amber-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Setup Your Organisation&apos;s Alert Preferences</h2>
                  <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                    Configure how and when your team receives notifications about metric alerts. 
                    Set up email and Slack notifications, choose notification frequencies, and specify which roles should receive alerts.
                  </p>
                  
                  <div className="space-y-4">
                    <CreateAlertPreferencesModal />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Mail className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                        <h3 className="text-gray-900 font-medium mb-1">Email Alerts</h3>
                        <p className="text-gray-600 text-sm">Get notifications via email</p>
                      </div>   
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <MessageSquare className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <h3 className="text-gray-900 font-medium mb-1">Slack Integration</h3>
                        <p className="text-gray-600 text-sm">Receive alerts in Slack channels</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <h3 className="text-gray-900 font-medium mb-1">Role-based Delivery</h3>
                        <p className="text-gray-600 text-sm">Configure alerts by user roles</p>
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
