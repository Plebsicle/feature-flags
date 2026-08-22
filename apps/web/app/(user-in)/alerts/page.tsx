import { cookies } from 'next/headers';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
} from "@/components/ui/icons";
import { Card, CardContent } from "@/components/ui/card";
import { AlertStatusFilter } from "./AlertStatusFilter";
import { AlertCard } from "./AlertCard";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

type AlertStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';

interface TriggeredAlert {
  id: string;
  created_at: Date;
  metric_id: string;
  current_value: number;
  threshold_value: number;
  alert_status: AlertStatus;
  resolved_at: Date | null;
  acknowledged_at: Date | null;
}

interface AlertData {
  id: string;
  organization_id: string;
  flag_environment_id: string;
  metric_name: string;
  metric_key: string;
  metric_type: string;
  is_active: boolean;
  tags: string[];
  triggered_alerts: TriggeredAlert[];
}  

interface AlertsPageProps {
  searchParams: Promise<{ status?: string }>;
}

async function getAlertsData(status: string | undefined): Promise<AlertData[] | null> {
  try {
    const cookieStore = await cookies();
    
    const cookieHeader = cookieStore.getAll()
      .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
      .join('; ');
      let response = null;
    if(status !== undefined){
        response = await fetch(`${BACKEND_URL}/alertLogs?status=${status}`, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });
    }
    else{
      response = await fetch(`${BACKEND_URL}/alertLogs`, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });
    }
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

function EmptyState({ status }: { status: string | undefined }) {
  const statusText = status?.toLowerCase() || 'active';
  
  return (
    <Card className="text-center py-12 rounded-none border-border bg-card/80 backdrop-blur shadow-xs">
      <CardContent>
        <div className="flex flex-col items-center space-y-4 pt-6">
          <div className="w-16 h-16 bg-muted/20 border border-border rounded-none flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No {statusText} alerts
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {status === 'TRIGGERED' 
                ? "Great! You don't have any active alerts requiring attention."
                : status 
                  ? `No alerts are currently in ${statusText} status.`
                  : "You don't have any alerts that match your current filter."
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const params = await searchParams;
  const status = params.status?.toUpperCase() as AlertStatus | undefined;
  const alertsData = await getAlertsData(status);
  
  // Flatten the alerts data to get individual alerts
  const allAlerts = alertsData?.flatMap(metric => 
    metric.triggered_alerts.map(alert => ({
      ...alert,
      metric_name: metric.metric_name,
      metric_key: metric.metric_key,
      metric_type: metric.metric_type,
      tags: metric.tags
    }))
  ) || [];

  const alertCounts = {
    triggered: allAlerts.filter(alert => alert.alert_status === 'TRIGGERED').length,
    acknowledged: allAlerts.filter(alert => alert.alert_status === 'ACKNOWLEDGED').length,
    resolved: allAlerts.filter(alert => alert.alert_status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and manage your metric alerts across all environments.
          </p>
        </div>
        
        <AlertStatusFilter currentStatus={status} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200 bg-card/80 backdrop-blur shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Triggered</p>
                <p className="text-3xl font-bold tracking-tight text-destructive mt-1">{alertCounts.triggered}</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 bg-card/80 backdrop-blur shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acknowledged</p>
                <p className="text-3xl font-bold tracking-tight text-amber-500 mt-1">{alertCounts.acknowledged}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 bg-card/80 backdrop-blur shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold tracking-tight text-emerald-500 mt-1">{alertCounts.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {allAlerts.length === 0 ? (
          <EmptyState status={status} />
        ) : (
          allAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}
