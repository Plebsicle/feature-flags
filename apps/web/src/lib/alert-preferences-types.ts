import { FrequencyUnit, user_role } from '@repo/db/client'

/**
 * Interface matching the myBody structure for API requests
 * This ensures consistent typing across create and edit modals
 */
export interface AlertPreferencesBody {
  email_enabled: boolean;
  slack_enabled: boolean;
  email_roles_notification: user_role[];
}

/**
 * Full alert preferences object as returned by the API
 * Includes all database fields for display components
 */
export interface AlertPreferences extends AlertPreferencesBody {
  id: string;
  organisation_id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * API response wrapper for alert preferences operations
 */
export interface AlertPreferencesResponse {
  success: boolean;
  message: string;
  data: AlertPreferences | null;
}

/**
 * Helper type for form validation and UI components
 */
export type AlertPreferencesFormData = AlertPreferencesBody;

/**
 * Utility functions for alert preferences
 */
export const formatFrequency = (frequency_value: number, frequency_unit: FrequencyUnit): string => {
  const unitDisplay = {
    MINUTES: frequency_value === 1 ? "minute" : "minutes",
    HOURS: frequency_value === 1 ? "hour" : "hours", 
    DAYS: frequency_value === 1 ? "day" : "days"
  };
  return `Every ${frequency_value} ${unitDisplay[frequency_unit]}`;
};

export const getFrequencyUnitDisplay = (unit: FrequencyUnit): string => {
  switch (unit) {
    case "MINUTES": return "Minutes";
    case "HOURS": return "Hours";
    case "DAYS": return "Days";
    default: return unit;
  }
};

export const getRoleColor = (role: user_role, isSelected?: boolean): string => {
  if (isSelected !== undefined) {
    // For interactive components (buttons)
    const baseColors = {
      OWNER: isSelected ? "bg-purple-600 text-white border-purple-600" : "bg-purple-500/20 text-purple-400 border-purple-500/30",
      ADMIN: isSelected ? "bg-red-600 text-white border-red-600" : "bg-red-500/20 text-red-400 border-red-500/30",
      MEMBER: isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-blue-500/20 text-blue-400 border-blue-500/30",
      VIEWER: isSelected ? "bg-slate-600 text-white border-slate-600" : "bg-slate-500/20 text-slate-400 border-slate-500/30"
    };
    return baseColors[role] || baseColors.VIEWER;
  } else {
    // For display components (badges)
    switch (role) {
      case "OWNER":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "ADMIN":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "MEMBER":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "VIEWER":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  }
}; 