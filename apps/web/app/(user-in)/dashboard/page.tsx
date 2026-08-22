import { cookies } from 'next/headers';
import { 
  Flag, 
  Users, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "@/components/ui/icons"
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
    
    // Get all co okies and format them properly
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
  } catch (err) { console.error(err);
    return null;
  }
}

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
    <Card className="hover:shadow-md transition-shadow duration-300 border-border group cursor-pointer flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`w-10 h-10 rounded-lg border border-transparent group-hover:border-border transition-colors ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-foreground mb-1 break-words min-w-0 ${value.toString().length > 10 ? 'text-lg font-semibold tracking-normal leading-snug mt-2' : 'text-2xl font-bold tracking-tight'}`}>
          {value}
        </div>
        <CardDescription className="text-muted-foreground text-sm line-clamp-1">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}


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
    success: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
    pending: { icon: Clock, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  }

  const StatusIcon = statusConfig[status].icon

  return (
    <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-muted/50 transition-colors duration-200 border-b border-border last:border-0 group cursor-pointer relative">
      <div className="absolute left-6 top-10 bottom-0 w-[1px] bg-border last:hidden" />
      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border ${statusConfig[status].bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <StatusIcon className={`w-4 h-4 ${statusConfig[status].color}`} />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm font-medium text-foreground">{type}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{message}</p>
        <p className="text-xs text-muted-foreground/60 mt-2">{time}</p>
      </div>
    </div>
  )
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
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back! Here's what's happening with your feature flags.</p>
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
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <StatCard
              title="Total Users"
              value={dashboardData.totalUsers?.toLocaleString() || "0"}
              description="Registered users"
              icon={Users}
              iconColor="text-emerald-500"
              iconBg="bg-emerald-500/10"
            />
            <StatCard
              title="Flag Evaluations"
              value={dashboardData.flagEvaluations || "0"}
              description="In the last 24h"
              icon={Activity}
              iconColor="text-amber-500"
              iconBg="bg-amber-500/10"
            />
            <StatCard
              title="Conversion Rate"
              value={dashboardData.conversionRate || "0%"}
              description="This month"
              icon={TrendingUp}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="border-b border-border bg-muted/20">
              <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
              <CardDescription>Latest changes and updates to your feature flags</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {Array.isArray(dashboardData.recentActivity) && dashboardData.recentActivity.length > 0 ? (
                <div className="flex flex-col">
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
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No recent activity</h3>
                  <p className="text-muted-foreground text-sm">When you start using feature flags, you'll see recent activity here.</p>
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
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <StatCard
              title="Total Users"
              value="0"
              description="Registered users"
              icon={Users}
              iconColor="text-emerald-500"
              iconBg="bg-emerald-500/10"
            />
            <StatCard
              title="Flag Evaluations"
              value="0"
              description="In the last 24h"
              icon={Activity}
              iconColor="text-amber-500"
              iconBg="bg-amber-500/10"
            />
            <StatCard
              title="Conversion Rate"
              value="0%"
              description="This month"
              icon={TrendingUp}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
            />
          </div>

          <Card>
            <CardHeader className="border-b border-border bg-muted/20">
              <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
              <CardDescription>Latest changes and updates to your feature flags</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">Unable to load dashboard data</h3>
                  <p className="text-muted-foreground text-sm">Please check your connection and try refreshing the page.</p>
                </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}