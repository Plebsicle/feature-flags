import { cookies } from 'next/headers';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
} from "lucide-react";
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

async function getAlertsData(status: string): Promise<AlertData[] | null> {
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
  } catch (err) {
    console.error('Error fetching alerts data:', err);
    return null;
  }
}

function EmptyState({ status }: { status: string }) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {status.toLowerCase()} alerts
            </h3>
            <p className="text-gray-600 max-w-md">
              {status === 'TRIGGERED' 
                ? "Great! You don't have any active alerts requiring attention."
                : `No alerts are currently in ${status.toLowerCase()} status.`
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
  const status = params.status?.toUpperCase() as AlertStatus;
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
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage your metric alerts across all environments.
          </p>
        </div>
        
        <AlertStatusFilter currentStatus={status} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Triggered</p>
                <p className="text-2xl font-bold text-red-600">{alertCounts.triggered}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acknowledged</p>
                <p className="text-2xl font-bold text-amber-600">{alertCounts.acknowledged}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-emerald-600">{alertCounts.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
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
