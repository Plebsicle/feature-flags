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
} from "lucide-react";
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
  } catch (err) {
    console.error('Error fetching audit logs:', err);
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
      return <Eye className="w-4 h-4 text-purple-600" />;
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
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPDATE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'DELETE':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'ENABLE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DISABLE':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    case 'EVALUATE':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'ALERT_TRIGGERED':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'ALERT_ACKNOWLEDGED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ALERT_RESOLVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function getEnvironmentColor(environment?: EnvironmentType): string {
  switch (environment) {
    case 'PROD':
      return 'bg-red-100 text-red-800';
    case 'STAGING':
      return 'bg-amber-100 text-amber-800';
    case 'DEV':
      return 'bg-blue-100 text-blue-800';
    case 'TEST':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'OWNER':
      return 'bg-purple-100 text-purple-800';
    case 'ADMIN':
      return 'bg-red-100 text-red-800';
    case 'MEMBER':
      return 'bg-blue-100 text-blue-800';
    case 'VIEWER':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function EmptyState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <ScrollText className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No audit logs found
            </h3>
            <p className="text-gray-600 max-w-md">
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
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getActionIcon(log.action)}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {log.action.replace(/_/g, ' ')} - {log.resource_type.replace(/_/g, ' ')}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
                  {getResourceIcon(log.resource_type)}
                  <span className="text-sm text-gray-600">{log.resource_type.replace(/_/g, ' ')}</span>
                </div>
                {log.environment && (
                  <Badge className={`${getEnvironmentColor(log.environment)} text-xs`}>
                    {log.environment}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Badge className={`${getActionColor(log.action)} border`}>
            {log.action}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Information */}
        {log.user && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{log.user.name}</h4>
                <p className="text-sm text-gray-600">{log.user.email}</p>
              </div>
              <div className="flex flex-col space-y-1">
                <Badge className={`${getRoleColor(log.user.role)} text-xs px-2 py-1`}>
                  {log.user.role}
                </Badge>
                <div className="flex space-x-1">
                  {log.user.is_active && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-emerald-700 border-emerald-300">
                      Active
                    </Badge>
                  )}
                  {log.user.isVerified && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-blue-700 border-blue-300">
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
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Timestamp</span>
            </div>
            <p className="text-sm text-gray-900">
              {formatDate(log.created_at)}
            </p>
          </div>

          {log.environment && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Monitor className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Environment</span>
              </div>
              <Badge className={`${getEnvironmentColor(log.environment)} text-sm`}>
                {log.environment}
              </Badge>
            </div>
          )}
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {log.ip_address && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Globe className="w-4 h-4" />
              <span>IP Address: {log.ip_address}</span>
            </div>
          )}

          {log.user_agent && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Monitor className="w-4 h-4" />
              <span title={log.user_agent}>
                User Agent: {log.user_agent.slice(0, 40)}...
              </span>
            </div>
          )}
        </div>

        {/* Attribute Changes */}
        {hasAttributeChanges && (
          <AttributeChangesViewer attributes={log.attributes_changed} />
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
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">
          Track all activities and changes across your organization.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Page</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.currentPage}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <ScrollText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalPages}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalItems}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-600" />
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
