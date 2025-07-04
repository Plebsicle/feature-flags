"use client"

import { useRouter} from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

type AlertStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';

interface AlertStatusFilterProps {
  currentStatus: AlertStatus | undefined;
}

const statusLabels: Record<AlertStatus | 'ALL', string> = {
  ALL: "All Alerts",
  TRIGGERED: "Triggered",
  ACKNOWLEDGED: "Acknowledged", 
  RESOLVED: "Resolved"
};

const statusDescriptions: Record<AlertStatus | 'ALL', string> = {
  ALL: "View all alerts regardless of status",
  TRIGGERED: "Active alerts requiring attention",
  ACKNOWLEDGED: "Alerts that have been acknowledged",
  RESOLVED: "Alerts that have been resolved"
};

export function AlertStatusFilter({ currentStatus }: AlertStatusFilterProps) {
  const router = useRouter();
  
  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'ALL') {
      router.push('/alerts');
    } else {
      router.push(`/alerts?status=${newStatus}`);
    }
  };

  // Use 'ALL' as the default value when currentStatus is undefined
  const displayStatus = currentStatus || 'ALL';

  return (
    <div className="flex items-center space-x-2">
      <Filter className="w-4 h-4 text-gray-500" />
      <Select
        value={displayStatus}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-64 min-w-max">
          <SelectValue placeholder="Filter by status">
            <div className="flex flex-col text-left">
              <span className="font-medium">{statusLabels[displayStatus]}</span>
              <span className="text-xs text-gray-500 truncate">
                {statusDescriptions[displayStatus]}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-64">
          <SelectItem 
            key="ALL" 
            value="ALL"
            className="h-auto py-2"
          >
            <div className="flex flex-col w-full">
              <span className="font-medium">All Alerts</span>
              <span className="text-xs text-gray-500 mt-0.5">
                View all alerts regardless of status
              </span>
            </div>
          </SelectItem>
          {Object.entries(statusLabels).filter(([status]) => status !== 'ALL').map(([status, label]) => (
            <SelectItem 
              key={status} 
              value={status}
              className="h-auto py-2"
            >
              <div className="flex flex-col w-full">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-gray-500 mt-0.5">
                  {statusDescriptions[status as AlertStatus]}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 