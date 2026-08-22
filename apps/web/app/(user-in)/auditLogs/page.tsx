import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { 
  ScrollText, 
  User, 
  Calendar,
  Globe,
  Monitor,
  Activity,
  Database,
  Shield,
  Flag,
  Settings,
  BarChart3,
  AlertTriangle,
  Eye
} from "@/components/ui/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuditLogsPagination } from "./AuditLogsPagination";
import { AttributeChangesViewer } from "@/components/attribute-changes-viewer";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

type AuditAction = 
  | 'CREATE'
  | 'UPDATE' 
  | 'DELETE'
  | 'ENABLE'
  | 'DISABLE'
  | 'EVALUATE'
  | 'ALERT_TRIGGERED'
  | 'ALERT_ACKNOWLEDGED'
  | 'ALERT_RESOLVED';

type AuditResourceType = 
  | 'KILL_SWITCHES'
  | 'KILL_SWITCH_FLAG'
  | 'FEATURE_FLAG'
  | 'FLAG_ENVIRONMENT'
  | 'FLAG_RULE'
  | 'ORGANIZATION_ATTRIBUTE'
  | 'FLAG_ROLLOUT'
  | 'METRIC'
  | 'ALERT'
  | 'ALERT_PREFERENCE';

type EnvironmentType = 'DEV' | 'STAGING' | 'PROD' | 'TEST';
type UserRole = 'ADMIN' | 'MEMBER' | 'VIEWER' | 'OWNER';

interface User {
  id: string;
  created_at: Date;
  name: string;
  email: string;
  role: UserRole;
  password?: string | null;
  updated_at: Date;
  is_active: boolean;
  isVerified: boolean;
}

interface AttributeChanges {
  [key: string]: {
    old_value?: unknown;
    new_value?: unknown;
  };
}

interface AuditLog {
  id: string;
  organisation_id?: string;
  user_id?: string;
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id?: string;
  attributes_changed?: AttributeChanges;
  environment?: EnvironmentType;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  user?: User | null;
}

interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

interface AuditLogsPageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getAuditLogs(page: number): Promise<AuditLogsResponse | null> {
  try {
    const cookieStore = await cookies();
    
    const cookieHeader = cookieStore.getAll()
      .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
      .join('; ');
 
    const response = await fetch(`${BACKEND_URL}/auditLogs?page=${page}`, {
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
    console.log(data);
    return data;
  } catch (err) { console.error(err);
    return null;
  }
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getActionIcon(action: AuditAction) {
  switch (action) {
    case 'CREATE':
      return <Database className="w-4 h-4 text-emerald-600" />;
    case 'UPDATE':
      return <Settings className="w-4 h-4 text-blue-600" />;
    case 'DELETE':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'ENABLE':
      return <Activity className="w-4 h-4 text-emerald-600" />;
    case 'DISABLE':
      return <Shield className="w-4 h-4 text-gray-600" />;
    case 'EVALUATE':
      return <Eye className="w-4 h-4 text-primary" />;
    case 'ALERT_TRIGGERED':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'ALERT_ACKNOWLEDGED':
      return <Activity className="w-4 h-4 text-amber-600" />;
    case 'ALERT_RESOLVED':
      return <Activity className="w-4 h-4 text-emerald-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-600" />;
  }
}

function getResourceIcon(resourceType: AuditResourceType) {
  switch (resourceType) {
    case 'FEATURE_FLAG':
    case 'FLAG_ENVIRONMENT':
    case 'FLAG_RULE':
    case 'FLAG_ROLLOUT':
      return <Flag className="w-4 h-4 text-indigo-600" />;
    case 'KILL_SWITCHES':
    case 'KILL_SWITCH_FLAG':
      return <Shield className="w-4 h-4 text-red-600" />;
    case 'METRIC':
      return <BarChart3 className="w-4 h-4 text-blue-600" />;
    case 'ALERT':
    case 'ALERT_PREFERENCE':
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case 'ORGANIZATION_ATTRIBUTE':
      return <Settings className="w-4 h-4 text-gray-600" />;
    default:
      return <Database className="w-4 h-4 text-gray-600" />;
  }
}

function getActionColor(action: AuditAction): string {
  switch (action) {
    case 'CREATE':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'UPDATE':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'DELETE':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'ENABLE':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'DISABLE':
      return 'bg-muted/50 text-muted-foreground border-border';
    case 'EVALUATE':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'ALERT_TRIGGERED':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'ALERT_ACKNOWLEDGED':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'ALERT_RESOLVED':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default:
      return 'bg-muted/50 text-muted-foreground border-border';
  }
}

function getEnvironmentColor(environment?: EnvironmentType): string {
  switch (environment) {
    case 'PROD':
      return 'bg-destructive/10 text-destructive border border-destructive/20';
    case 'STAGING':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'DEV':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'TEST':
      return 'bg-muted/50 text-muted-foreground border border-border';
    default:
      return 'bg-muted/50 text-muted-foreground border border-border';
  }
}

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'OWNER':
      return 'bg-primary/10 text-primary border border-primary/20';
    case 'ADMIN':
      return 'bg-destructive/10 text-destructive border border-destructive/20';
    case 'MEMBER':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'VIEWER':
      return 'bg-muted/50 text-muted-foreground border border-border';
    default:
      return 'bg-muted/50 text-muted-foreground border border-border';
  }
}

function EmptyState() {
  return (
    <Card className="text-center py-12 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
      <CardContent>
        <div className="flex flex-col items-center space-y-4 pt-6">
          <div className="w-16 h-16 bg-muted/20 border border-border rounded-xl flex items-center justify-center">
            <ScrollText className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No audit logs found
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              No audit logs are available at the moment. Activity will appear here as actions are performed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditLogCard({ log }: { log: AuditLog }) {
  const hasAttributeChanges = log.attributes_changed && Object.keys(log.attributes_changed).length > 0;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-border bg-card/80 backdrop-blur shadow-sm rounded-xl">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-muted/10 p-2 border border-border rounded-lg">
              {getActionIcon(log.action)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {log.action.replace(/_/g, ' ')} - {log.resource_type.replace(/_/g, ' ')}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
                  {getResourceIcon(log.resource_type)}
                  <span className="text-xs font-medium text-muted-foreground">{log.resource_type.replace(/_/g, ' ')}</span>
                </div>
                {log.environment && (
                  <Badge className={`${getEnvironmentColor(log.environment)} rounded-md text-xs font-medium uppercase px-2 py-0`}>
                    {log.environment}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Badge className={`${getActionColor(log.action)} border rounded-full text-xs font-medium uppercase px-2 py-0.5`}>
            {log.action}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* User Information */}
        {log.user && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">{log.user.name}</h4>
                <p className="text-xs text-muted-foreground">{log.user.email}</p>
              </div>
              <div className="flex flex-col space-y-2 items-end">
                <Badge className={`${getRoleColor(log.user.role)} rounded-md text-xs font-medium uppercase px-2 py-0`}>
                  {log.user.role}
                </Badge>
                <div className="flex space-x-1">
                  {log.user.is_active && (
                    <Badge variant="outline" className="rounded-md text-xs font-medium text-primary border-primary/50 px-2 py-0">
                      Active
                    </Badge>
                  )}
                  {log.user.isVerified && (
                    <Badge variant="outline" className="rounded-md text-xs font-medium text-blue-500 border-blue-500/50 px-2 py-0">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/10 border border-border rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Timestamp</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(log.created_at)}
            </p>
          </div>

          {log.environment && (
            <div className="bg-muted/10 border border-border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Monitor className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Environment</span>
              </div>
              <Badge className={`${getEnvironmentColor(log.environment)} rounded-md text-xs font-medium uppercase mt-1 px-2 py-0`}>
                {log.environment}
              </Badge>
            </div>
          )}
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
          {log.ip_address && (
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>IP Address: <span className="text-foreground font-normal">{log.ip_address}</span></span>
            </div>
          )}

          {log.user_agent && (
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <Monitor className="w-4 h-4" />
              <span title={log.user_agent}>
                User Agent: <span className="text-foreground font-normal">{log.user_agent.slice(0, 40)}...</span>
              </span>
            </div>
          )}
        </div>

        {/* Attribute Changes */}
        {hasAttributeChanges && (
          <div className="pt-2">
            <AttributeChangesViewer attributes={log.attributes_changed} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);

  // Redirect to page 1 if invalid page number
  if (isNaN(currentPage) || currentPage < 1) {
    redirect('/auditLogs?page=1');
  }

  const auditLogsData = await getAuditLogs(currentPage);
  
  if (!auditLogsData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Error loading audit logs. Please try again.</p>
        </div>
        <EmptyState />
      </div>
    );
  }

  const { data: auditLogs, pagination } = auditLogsData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track all activities and changes across your organization.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200 bg-card/80 backdrop-blur shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Page</p>
                <p className="text-3xl font-bold tracking-tight text-foreground mt-1">{pagination.currentPage}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <ScrollText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 bg-card/80 backdrop-blur shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pages</p>
                <p className="text-3xl font-bold tracking-tight text-foreground mt-1">{pagination.totalPages}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 bg-card/80 backdrop-blur shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold tracking-tight text-foreground mt-1">{pagination.totalItems}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-4">
        {auditLogs.length === 0 ? (
          <EmptyState />
        ) : (
          auditLogs.map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <AuditLogsPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
        />
      )}
    </div>
  );
}
