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
    // For interactive components (buttons) - using WorkOS design system colors
    const baseColors = {
      OWNER: isSelected ? "bg-violet-600 text-white border-violet-600 shadow-sm" : "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
      ADMIN: isSelected ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", 
      MEMBER: isSelected ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      VIEWER: isSelected ? "bg-slate-600 text-white border-slate-600 shadow-sm" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
    };
    return baseColors[role] || baseColors.VIEWER;
  } else {
    // For display components (badges) - vibrant but readable
    switch (role) {
      case "OWNER":
        return "bg-violet-100 text-violet-800 border-violet-200";
      case "ADMIN":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "MEMBER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "VIEWER":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  }
}; 