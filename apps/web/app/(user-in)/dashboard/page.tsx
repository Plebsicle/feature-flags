import { cookies } from 'next/headers';
import { 
  Flag, 
  BarChart3, 
  Users, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

interface DashboardData {
  activeFlags : any
  recentActivity: any[] | string
  totalUsers: number
  flagEvaluations: string
  conversionRate: string
}

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies and format them properly
    const cookieHeader = cookieStore.getAll()
      .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    console.log('Sending cookies:', cookieHeader); // Debug log

    // Use fetch instead of axios for better Next.js compatibility
    const response = await fetch(`${BACKEND_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This is important for cookie handling
      cache: 'no-store', // Prevent caching for dynamic data
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('Backend returned error:', data);
      return null;
    }

    return data.data;
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return null;
  }
}

// Alternative approach: Get specific cookies by name
async function getDashboardDataWithSpecificCookies(): Promise<DashboardData | null> {
  try {
    const cookieStore = await cookies();
    
    // Debug: Log all available cookies
    const allCookies = cookieStore.getAll();
    console.log('All available cookies:', allCookies);
    const sessionId = cookieStore.get('sessionId')?.value;
    
    console.log('Specific cookies found:', {
      sessionId,
    });
    
    // Build cookie header with only the cookies you need
    const cookiePairs = [];
    if (sessionId) cookiePairs.push(`session-id=${sessionId}`);
    
    const cookieHeader = cookiePairs.join('; ');
    
    console.log('Sending specific cookies:', cookieHeader); // Debug log

    if (!cookieHeader) {
      console.error('No authentication cookies found');
      console.log('Check your cookie names and make sure they are set correctly');
      return null;
    }

    const response = await fetch(`${BACKEND_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('Backend returned error:', data);
      return null;
    }

    return data.data;
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return null;
  }
}

// SERVER COMPONENT - This renders on server, great for SEO
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string
  value: string
  description: string
  icon: any
  iconColor: string
  iconBg: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        <CardDescription className="text-gray-600 text-sm">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

// SERVER COMPONENT - Rendered on server
function ActivityItem({
  type,
  message,
  time,
  status,
}: {
  type: string
  message: string
  time: string
  status: "success" | "warning" | "pending"
}) {
  const statusConfig = {
    success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    warning: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
    pending: { icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
  }

  const StatusIcon = statusConfig[status].icon

  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${statusConfig[status].bg} flex items-center justify-center`}>
        <StatusIcon className={`w-4 h-4 ${statusConfig[status].color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{type}</p>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{message}</p>
        <p className="text-xs text-gray-500 mt-2">{time}</p>
      </div>
    </div>
  )
}

// ALTERNATIVE: Use headers to get cookies (sometimes more reliable)
async function getDashboardDataUsingHeaders(): Promise<DashboardData | null> {
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie');
    
    console.log('Raw cookie header from request:', cookieHeader);

    if (!cookieHeader) {
      console.error('No cookie header found in request');
      return null;
    }

    const response = await fetch(`${BACKEND_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('Backend returned error:', data);
      return null;
    }

    return data.data;
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return null;
  }
}

function getActivityStatus(title: string): "success" | "warning" | "pending" {
  if (title.toLowerCase().includes('success') || title.toLowerCase().includes('enabled')) {
    return 'success';
  } else if (title.toLowerCase().includes('warning') || title.toLowerCase().includes('disabled')) {
    return 'warning';
  } else {
    return 'pending';
  }
}

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your feature flags.</p>
      </div>

      {dashboardData ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Active Flags"
              value={dashboardData.activeFlags?.toString() || "0"}
              description="Currently deployed"
              icon={Flag}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-100"
            />
            <StatCard
              title="Total Users"
              value={dashboardData.totalUsers?.toLocaleString() || "0"}
              description="Registered users"
              icon={Users}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
            />
            <StatCard
              title="Flag Evaluations"
              value={dashboardData.flagEvaluations || "0"}
              description="In the last 24h"
              icon={Activity}
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
            />
            <StatCard
              title="Conversion Rate"
              value={dashboardData.conversionRate || "0%"}
              description="This month"
              icon={TrendingUp}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <CardDescription>Latest changes and updates to your feature flags</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {Array.isArray(dashboardData.recentActivity) && dashboardData.recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {dashboardData.recentActivity.map((activity: any, index: number) => (
                    <ActivityItem
                      key={index}
                      type={activity.title || activity.type || "Update"}
                      message={activity.description || activity.message || "No description available"}
                      time={activity.timestamp || activity.time || "Just now"}
                      status={getActivityStatus(activity.title || activity.type || "")}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-gray-600">When you start using feature flags, you'll see recent activity here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-6">
          {/* Loading/Error State with placeholder stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Active Flags"
              value="0"
              description="Currently deployed"
              icon={Flag}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-100"
            />
            <StatCard
              title="Total Users"
              value="0"
              description="Registered users"
              icon={Users}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
            />
            <StatCard
              title="Flag Evaluations"
              value="0"
              description="In the last 24h"
              icon={Activity}
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
            />
            <StatCard
              title="Conversion Rate"
              value="0%"
              description="This month"
              icon={TrendingUp}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <CardDescription>Latest changes and updates to your feature flags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load dashboard data</h3>
                <p className="text-gray-600">Please check your connection and try refreshing the page.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}