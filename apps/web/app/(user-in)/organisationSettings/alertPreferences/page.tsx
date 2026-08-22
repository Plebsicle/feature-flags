import Link from "next/link"
import { cookies } from "next/headers"
import { ArrowLeft, Bell, Settings, Mail, MessageSquare, Users, Calendar } from "@/components/ui/icons"
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
          <Link href="/organisationSettings/inviteMembers" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-200 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Organization Settings
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight mb-1">Alert Preferences</h1>
              <p className="text-muted-foreground text-sm">Configure how your organisation receives alert notifications</p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-destructive/20 border border-destructive/30 rounded-md flex items-center justify-center">
                  <Bell className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-destructive font-semibold text-lg">Error Loading Preferences</h3>
                  <p className="text-destructive/80 text-sm">{error}</p>
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
                      <h2 className="text-2xl font-semibold text-foreground tracking-tight">Current Alert Configuration</h2>
                      <p className="text-muted-foreground text-sm mt-1">Last updated {new Date(preferences.updated_at).toLocaleDateString()}</p>
                    </div>
                    <EditAlertPreferencesModal preferences={preferences} />
                  </div>

                  {/* Preferences Display */}
                  <div className="space-y-6">
                    {/* Notification Methods */}
                    <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                      <CardHeader className="border-b border-border/50 pb-4">
                        <CardTitle className="text-xl text-foreground font-semibold flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          Notification Methods
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex items-center justify-between p-3 bg-muted/10 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-primary" />
                            <span className="text-foreground text-sm font-medium">Email Notifications</span>
                          </div>
                          <Badge 
                            variant={preferences.email_enabled ? "default" : "secondary"} 
                            className={`rounded-md text-xs font-medium ${preferences.email_enabled ? "bg-primary/20 text-primary border-primary/50" : "bg-muted text-muted-foreground border-border"}`}
                          >
                            {preferences.email_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/10 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <span className="text-foreground text-sm font-medium">Slack Notifications</span>
                          </div>
                          <Badge 
                            variant={preferences.slack_enabled ? "default" : "secondary"} 
                            className={`rounded-md text-xs font-medium ${preferences.slack_enabled ? "bg-primary/20 text-primary border-primary/50" : "bg-muted text-muted-foreground border-border"}`}
                          >
                            {preferences.slack_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                      <CardHeader className="border-b border-border/50 pb-4">
                        <CardTitle className="text-xl text-foreground font-semibold flex items-center gap-2">
                          <Settings className="w-5 h-5 text-primary" />
                          Notification Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Email Recipients
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.email_roles_notification.map((role, index) => (
                              <Badge 
                                key={index}
                                className={`rounded-md text-xs font-medium border ${getRoleColor(role)}`}
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
                  <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(preferences.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
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
                  <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-4xl font-bold text-foreground tracking-tight mb-4">Setup Your Organisation&apos;s Alert Preferences</h2>
                  <p className="text-muted-foreground text-sm mb-8 max-w-2xl mx-auto leading-relaxed">
                    Configure how and when your team receives notifications about metric alerts. 
                    Set up email and Slack notifications, choose notification frequencies, and specify which roles should receive alerts.
                  </p>
                  
                  <div className="space-y-4">
                    <CreateAlertPreferencesModal />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                      <div className="p-6 bg-muted/10 border border-border rounded-xl hover:border-primary/50 transition-colors group">
                        <Mail className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mx-auto mb-4" />
                        <h3 className="text-foreground font-semibold text-lg mb-2">Email Alerts</h3>
                        <p className="text-muted-foreground text-sm">Get notifications via email</p>
                      </div>   
                      <div className="p-6 bg-muted/10 border border-border rounded-xl hover:border-primary/50 transition-colors group">
                        <MessageSquare className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mx-auto mb-4" />
                        <h3 className="text-foreground font-semibold text-lg mb-2">Slack Integration</h3>
                        <p className="text-muted-foreground text-sm">Receive alerts in Slack channels</p>
                      </div>
                      <div className="p-6 bg-muted/10 border border-border rounded-xl hover:border-primary/50 transition-colors group">
                        <Users className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mx-auto mb-4" />
                        <h3 className="text-foreground font-semibold text-lg mb-2">Role-based Delivery</h3>
                        <p className="text-muted-foreground text-sm">Configure alerts by user roles</p>
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
