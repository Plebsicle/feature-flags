import { cookies } from 'next/headers'
import { Users, Bell, Building } from 'lucide-react'
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

    console.log('Fetching organisation members...') // Debug log

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
      console.error(`HTTP error! status: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    console.log('Response data structure:', JSON.stringify(data, null, 2))
    
    if (!data.success) {
      console.error('Backend returned error:', data)
      return null
    }

    return data as MembersResponse
  } catch (err) {
    console.error('Error fetching members data:', err)
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organisation Members</h1>
            <p className="text-gray-600 text-lg">
              Manage your team and control access to your organization
            </p>
          </div>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Unable to Load Members
              </CardTitle>
              <CardDescription className="text-red-700">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Organisation Members</h1>
              <p className="text-gray-600 text-lg">
                Manage your team and control access to your organization
              </p>
            </div>
            <Link href="/organisationSettings/alertPreferences">
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alert Preferences
              </button>
            </Link>
          </div>
        </div>

        {/* Organization Slug Card */}
        <Card className="hover:shadow-md transition-shadow duration-200 mb-8 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Organization Details
            </CardTitle>
            <CardDescription>
              Your organization&apos;s unique identifier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-indigo-200">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Organization Slug</h3>
                <code className="text-lg font-mono text-indigo-700">
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
        <Card className="hover:shadow-md transition-shadow duration-200 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Overview
            </CardTitle>
            <CardDescription>
              Current team composition and roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {response.data.length}
                </div>
                <div className="text-sm text-gray-600">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {response.data.filter(m => m.role === "OWNER").length}
                </div>
                <div className="text-sm text-gray-600">Owners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {response.data.filter(m => m.role === "ADMIN").length}
                </div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {response.data.filter(m => m.role === "MEMBER").length + response.data.filter(m => m.role === "VIEWER").length}
                </div>
                <div className="text-sm text-gray-600">Members & Viewers</div>
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
