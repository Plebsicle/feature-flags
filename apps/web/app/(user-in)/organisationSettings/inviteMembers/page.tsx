import { cookies } from 'next/headers'
import { Users, Bell, Building } from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrganisationMembersClient } from './OrganisationMembersClient'
import { EnhancedCopyButton } from "@/components/enhanced-copy-button"
import Link from 'next/link'

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

type UserRole = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER"

interface MemberDetails {
  id: string
  name: string
  email: string 
  role: UserRole
} 

interface MembersResponse {
  data: MemberDetails[]
  orgSlug: string | {
    slug: string
  }
  success: boolean
}

async function getMembersData(): Promise<MembersResponse | null> {
  try {
    const cookieStore = await cookies()
    
    // Get all cookies and format them properly
    const cookieHeader = cookieStore.getAll()
      .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
      .join('; ')

    // console.log('Fetching organisation members...') // Debug log

    const response = await fetch(`${BACKEND_URL}/organisation/members`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store', // Prevent caching for dynamic data
    })

    if (!response.ok) {
      // console.error(`HTTP error! status: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    // console.log('Response data structure:', JSON.stringify(data, null, 2))
    
    if (!data.success) {
      // console.error('Backend returned error:', data)
      return null
    }

    return data as MembersResponse
  } catch (err) { // console.error(err)
    return null
  }
}

export default async function OrganisationMembersPage() {
  const response = await getMembersData()

  if (!response) {
    return (
      <div className="space-y-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Organisation Members</h1>
            <p className="text-muted-foreground text-sm">
              Manage your team and control access to your organization
            </p>
          </div>

          <Card className="rounded-xl border-destructive/50 bg-destructive/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2 font-semibold">
                <Users className="w-5 h-5" />
                Unable to Load Members
              </CardTitle>
              <CardDescription className="text-destructive/80 text-sm">
                There was an error loading the member data. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Organisation Members</h1>
              <p className="text-muted-foreground text-sm">
                Manage your team and control access to your organization
              </p>
            </div>
            <Link href="/organisationSettings/alertPreferences">
              <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-sm">
                <Bell className="w-4 h-4" />
                Alert Preferences
              </button>
            </Link>
          </div>
        </div>

        {/* Organization Slug Card */}
        <Card className="hover:shadow-md transition-shadow duration-200 mb-8 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground flex items-center gap-2 font-semibold text-lg">
              <Building className="w-5 h-5 text-primary" />
              Organization Details
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Your organization&apos;s unique identifier
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between bg-muted/10 p-4 border border-border rounded-lg">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-1">Organization Slug</h3>
                <code className="text-sm font-medium text-foreground bg-muted px-2 py-1 rounded-md">
                  {typeof response.orgSlug === 'string' 
                    ? response.orgSlug 
                    : response.orgSlug?.slug || 'Not available'}
                </code>
              </div>
              <EnhancedCopyButton 
                text={typeof response.orgSlug === 'string' 
                  ? response.orgSlug 
                  : response.orgSlug?.slug || ''}
                successMessage="Organization slug copied to clipboard"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="hover:shadow-md transition-shadow duration-200 mb-8 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground flex items-center gap-2 font-semibold text-lg">
              <Users className="w-5 h-5 text-primary" />
              Team Overview
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Current team composition and roles
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/10 border border-border/50 hover:border-border transition-colors group rounded-lg">
                <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {response.data.length}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1">Total Members</div>
              </div>
              <div className="text-center p-4 bg-muted/10 border border-border/50 hover:border-border transition-colors group rounded-lg">
                <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {response.data.filter(m => m.role === "OWNER").length}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1">Owners</div>
              </div>
              <div className="text-center p-4 bg-muted/10 border border-border/50 hover:border-border transition-colors group rounded-lg">
                <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {response.data.filter(m => m.role === "ADMIN").length}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1">Admins</div>
              </div>
              <div className="text-center p-4 bg-muted/10 border border-border/50 hover:border-border transition-colors group rounded-lg">
                <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {response.data.filter(m => m.role === "MEMBER").length + response.data.filter(m => m.role === "VIEWER").length}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1">Members & Viewers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client-side Interactive Component */}
        <OrganisationMembersClient initialMembers={response.data} />
      </div>
    </div>
  )
}
