"use client"

import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Calendar,
  Target,
  TrendingUp,
  Activity,
  Tag
} from "@/components/ui/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AlertStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';

interface AlertCardProps {
  alert: {
    id: string;
    created_at: Date;
    metric_id: string;
    current_value: number;
    threshold_value: number;
    alert_status: AlertStatus;
    resolved_at: Date | null;
    acknowledged_at: Date | null;
    metric_name: string;
    metric_key: string;
    metric_type: string;
    tags: string[];
  };
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusIcon(status: AlertStatus) {
  switch (status) {
    case 'TRIGGERED':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'ACKNOWLEDGED':
      return <Clock className="w-5 h-5 text-amber-600" />;
    case 'RESOLVED':
      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-gray-600" />;
  }
}

function getStatusColor(status: AlertStatus): string {
  switch (status) {
    case 'TRIGGERED':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'ACKNOWLEDGED':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'RESOLVED':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default:
      return 'bg-muted/50 text-muted-foreground border-border';
  }
}

export function AlertCard({ alert }: AlertCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(alert.alert_status);

  const updateAlertStatus = async (newStatus: AlertStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/proxy/alertLogs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: alert.id,
          status: newStatus
        }),
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        console.error('Failed to update alert status');
      }
    } catch (error) { console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderActionButtons = () => {
    if (currentStatus === 'RESOLVED') {
      return null; // No actions for resolved alerts
    }

    return (
      <div className="flex gap-2">
        {currentStatus === 'TRIGGERED' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateAlertStatus('ACKNOWLEDGED')}
              className="text-amber-500 border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-500 rounded-lg text-xs"
            >
              <Clock className="w-4 h-4 mr-1" />
              Acknowledge
            </Button>
            <Button
              size="sm"
              onClick={() => updateAlertStatus('RESOLVED')}
              className="text-emerald-500 bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-500 rounded-lg text-xs"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Resolve
            </Button>
          </>
        )}
        
        {currentStatus === 'ACKNOWLEDGED' && (
          <Button
            size="sm"
            onClick={() => updateAlertStatus('RESOLVED')}
            className="text-emerald-500 bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-500 rounded-lg text-xs"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Resolve
          </Button>
        )}
      </div>
    );
  };

  const percentageChange = ((alert.current_value - alert.threshold_value) / alert.threshold_value * 100);
  const isExceeding = alert.current_value > alert.threshold_value;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-border bg-card/80 backdrop-blur shadow-sm rounded-xl">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-muted/10 p-2 border border-border rounded-lg">
              {getStatusIcon(currentStatus)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {alert.metric_name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="rounded-md font-medium text-xs text-muted-foreground">
                  {alert.metric_key}
                </Badge>
                <Badge variant="outline" className="rounded-md font-medium text-xs text-muted-foreground">
                  {alert.metric_type}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(currentStatus)} border rounded-full font-medium text-xs uppercase px-2 py-0.5`}>
              {currentStatus}
            </Badge>
            {renderActionButtons()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Metric Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/10 border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Current Value</span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {alert.current_value.toLocaleString()}
            </p>
          </div>

          <div className="bg-muted/10 border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Threshold</span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {alert.threshold_value.toLocaleString()}
            </p>
          </div>

          <div className="bg-muted/10 border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {isExceeding ? 'Over threshold' : 'Under threshold'}
              </span>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${isExceeding ? 'text-destructive' : 'text-emerald-500'}`}>
              {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Triggered: <span className="text-foreground font-normal">{formatDate(alert.created_at)}</span></span>
          </div>
          
          {alert.acknowledged_at && (
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Acknowledged: <span className="text-foreground font-normal">{formatDate(alert.acknowledged_at)}</span></span>
            </div>
          )}
          
          {alert.resolved_at && (
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span>Resolved: <span className="text-foreground font-normal">{formatDate(alert.resolved_at)}</span></span>
            </div>
          )}
        </div>

        {/* Tags */}
        {alert.tags && alert.tags.length > 0 && (
          <div className="flex items-center space-x-2 pt-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {alert.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="rounded-md font-medium text-xs bg-muted/50 text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 