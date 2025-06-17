import { cookies } from 'next/headers';
import { 
  Flag, 
  BarChart3, 
  Users, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { InteractiveElements } from "./interactive-elements"

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
    console.log('Total cookies found:', allCookies.length);
    
    // Get specific cookies that your backend needs
    const authToken = cookieStore.get('auth-token')?.value;
    const sessionId = cookieStore.get('session-id')?.value;
    const userId = cookieStore.get('user-id')?.value;
    
    // Also try common cookie names
    const token = cookieStore.get('token')?.value;
    const accessToken = cookieStore.get('access_token')?.value;
    const jwt = cookieStore.get('jwt')?.value;
    
    console.log('Specific cookies found:', {
      authToken,
      sessionId,
      userId,
      token,
      accessToken,
      jwt
    });
    
    // Build cookie header with only the cookies you need
    const cookiePairs = [];
    if (authToken) cookiePairs.push(`auth-token=${authToken}`);
    if (sessionId) cookiePairs.push(`session-id=${sessionId}`);
    if (userId) cookiePairs.push(`user-id=${userId}`);
    if (token) cookiePairs.push(`token=${token}`);
    if (accessToken) cookiePairs.push(`access_token=${accessToken}`);
    if (jwt) cookiePairs.push(`jwt=${jwt}`);
    
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
  gradient,
}: {
  title: string
  value: string
  description: string
  icon: any
  gradient: string
}) {
  return (
    <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-neutral-400">{title}</CardTitle>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
          {value}
        </div>
        <CardDescription className="text-neutral-400 text-xs sm:text-sm">
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
    success: { icon: CheckCircle, color: "text-emerald-400" },
    warning: { icon: AlertCircle, color: "text-amber-400" },
    pending: { icon: Clock, color: "text-blue-400" },
  }

  const StatusIcon = statusConfig[status].icon

  return (
    <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg hover:bg-slate-800/40 transition-colors duration-200">
      <div className="flex-shrink-0 mt-0.5">
        <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfig[status].color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base text-white font-medium">{type}</p>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">{message}</p>
        <p className="text-xs text-neutral-500 mt-2">{time}</p>
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
    console.error('Error fetching dashboard data using headers:', err);
    return null;
  }
}

function getActivityStatus(title: string): "success" | "warning" | "pending" {
  if (title.toLowerCase().includes('alert') || title.toLowerCase().includes('error') || title.toLowerCase().includes('rollback')) {
    return 'warning'
  }
  if (title.toLowerCase().includes('test') || title.toLowerCase().includes('pending')) {
    return 'pending'
  }
  return 'success'
}

// MAIN SERVER COMPONENT - All content rendered on server for SEO
export default async function DashboardPage() {
  // Try different approaches to get the data
  let dashboardData = await getDashboardDataUsingHeaders()
  
  // Fallback to cookies approach if headers don't work
  if (!dashboardData) {
    dashboardData = await getDashboardDataWithSpecificCookies()
  }
  
  // Last fallback to general cookies approach
  if (!dashboardData) {
    dashboardData = await getDashboardData()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Header - Server rendered, great for SEO */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-neutral-400 text-base sm:text-lg">
            Monitor your feature flags and track performance metrics
          </p>
        </div>

        {/* Error State - Server rendered */}
        {!dashboardData && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">Error loading dashboard data. Please check if you're logged in.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {dashboardData && (
          <>
            {/* Stats Grid - Server rendered, search engines can see this! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Active Flags"
                value={dashboardData.activeFlags.toString()}
                description="Feature flags currently active"
                icon={Flag}
                gradient="from-blue-500 to-indigo-600"
              />
              <StatCard
                title="Organisation Members"
                value={dashboardData.totalUsers.toString()}
                description="Total team members"
                icon={Users}
                gradient="from-emerald-500 to-teal-600"
              />
              <StatCard
                title="Flag Evaluations"
                value={dashboardData.flagEvaluations}
                description="Total evaluations this month"
                icon={Activity}
                gradient="from-purple-500 to-violet-600"
              />
              <StatCard
                title="Conversion Rate"
                value={dashboardData.conversionRate}
                description="Average conversion rate"
                icon={BarChart3}
                gradient="from-orange-500 to-amber-600"
              />
            </div>

            {/* Main Content Grid - Server rendered */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Recent Activity - Server rendered for SEO */}
              <div className="lg:col-span-3">
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-neutral-400 text-sm sm:text-base">
                      Latest flag changes and system events
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {typeof dashboardData.recentActivity === 'string' ? (
                      <div className="text-center py-8 text-neutral-400">
                        {dashboardData.recentActivity}
                      </div>
                    ) : (
                      dashboardData.recentActivity?.map((activity, index) => (
                        <ActivityItem
                          key={index}
                          type={activity.title}
                          message={activity.description}
                          time={activity.timestamp}
                          status={getActivityStatus(activity.title)}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions - Only interactive parts are client components */}
              {/* <div>
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl text-white">Quick Actions</CardTitle>
                    <CardDescription className="text-neutral-400 text-sm sm:text-base">
                      Common tasks and shortcuts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {/* Basic structure server-rendered, interactivity added by client component */}
                    {/* <InteractiveElements />
                  </CardContent>
                </Card>
              // </div> */} 
            </div>
          </>
        )}
      </div>
    </div>
  )
}