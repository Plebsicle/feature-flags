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
} from "lucide-react";
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
      return 'bg-red-50 text-red-700 border-red-200';
    case 'ACKNOWLEDGED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'RESOLVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
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
    } catch (error) {
      console.error('Error updating alert status:', error);
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
              disabled={isUpdating}
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <Clock className="w-4 h-4 mr-1" />
              Acknowledge
            </Button>
            <Button
              size="sm"
              onClick={() => updateAlertStatus('RESOLVED')}
              disabled={isUpdating}
              className="text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
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
            disabled={isUpdating}
            className="text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
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
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(currentStatus)}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {alert.metric_name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {alert.metric_key}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {alert.metric_type}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(currentStatus)} border`}>
              {currentStatus}
            </Badge>
            {renderActionButtons()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Current Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {alert.current_value.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Threshold</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {alert.threshold_value.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                {isExceeding ? 'Over threshold' : 'Under threshold'}
              </span>
            </div>
            <p className={`text-2xl font-bold ${isExceeding ? 'text-red-600' : 'text-emerald-600'}`}>
              {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Triggered: {formatDate(alert.created_at)}</span>
          </div>
          
          {alert.acknowledged_at && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Acknowledged: {formatDate(alert.acknowledged_at)}</span>
            </div>
          )}
          
          {alert.resolved_at && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4" />
              <span>Resolved: {formatDate(alert.resolved_at)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {alert.tags && alert.tags.length > 0 && (
          <div className="flex items-center space-x-2 pt-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <div className="flex flex-wrap gap-1">
              {alert.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
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