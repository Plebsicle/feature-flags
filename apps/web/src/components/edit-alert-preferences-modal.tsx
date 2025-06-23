'use client'

import { useState } from 'react'
import { Edit, Save, Loader2, Mail, MessageSquare, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Types matching the API structure and database schema
type user_role = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER"

interface AlertPreferences {
  id: string
  organisation_id: string
  alert_notification_frequency: Date | string
  email_enabled: boolean
  slack_enabled: boolean
  email_roles_notification: user_role[]
  created_at: Date
  updated_at: Date
}

interface EditAlertPreferencesFormData {
  alert_notification_frequency: string // Time string format "HH:mm"
  email_enabled: boolean
  slack_enabled: boolean
  email_roles_notification: user_role[]
}

interface EditAlertPreferencesModalProps {
  preferences: AlertPreferences
}

export function EditAlertPreferencesModal({ preferences }: EditAlertPreferencesModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Convert existing frequency to time string format
  const getTimeString = (frequency: Date | string) => {
    try {
      const date = new Date(frequency)
      return date.toTimeString().slice(0, 5) // "HH:mm" format
    } catch {
      return "09:00"
    }
  }
  
  const [formData, setFormData] = useState<EditAlertPreferencesFormData>({
    alert_notification_frequency: getTimeString(preferences.alert_notification_frequency),
    email_enabled: preferences.email_enabled,
    slack_enabled: preferences.slack_enabled,
    email_roles_notification: preferences.email_roles_notification || []
  })

  const handleInputChange = (field: keyof EditAlertPreferencesFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRoleToggle = (role: user_role) => {
    setFormData(prev => ({
      ...prev,
      email_roles_notification: prev.email_roles_notification.includes(role)
        ? prev.email_roles_notification.filter(r => r !== role)
        : [...prev.email_roles_notification, role]
    }))
  }

  const validate = (): boolean => {
    if (!formData.alert_notification_frequency) {
      toast.error("Notification frequency is required")
      return false
    }
    if (formData.email_enabled && formData.email_roles_notification.length === 0) {
      toast.error("Please select at least one role for email notifications")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsSubmitting(true)
    
    try {
      // Convert time string to ISO Date string
      const [hours, minutes] = formData.alert_notification_frequency.split(':')
      if(!hours) return;
      if(!minutes) return;
      const frequencyDate = new Date()
      frequencyDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`/${backendUrl}/organisation/preferences`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          alert_notification_frequency: frequencyDate.toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Alert preferences updated successfully!')
        setIsOpen(false)
        // Refresh the current page to show the updated preferences
        router.refresh()
      } else {
        throw new Error(result.message || 'Failed to update alert preferences')
      }
    } catch (error) {
      console.error('Error updating alert preferences:', error)
      toast.error('Failed to update alert preferences. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleColor = (role: user_role, isSelected: boolean) => {
    const baseColors = {
      OWNER: isSelected ? "bg-purple-600 text-white border-purple-600" : "bg-purple-500/20 text-purple-400 border-purple-500/30",
      ADMIN: isSelected ? "bg-red-600 text-white border-red-600" : "bg-red-500/20 text-red-400 border-red-500/30",
      MEMBER: isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-blue-500/20 text-blue-400 border-blue-500/30",
      VIEWER: isSelected ? "bg-slate-600 text-white border-slate-600" : "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
    return baseColors[role] || baseColors.VIEWER
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-blue-700 text-blue-300 hover:bg-blue-800/20"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Edit Alert Preferences</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Update your organisation's alert notification settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-neutral-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Notification Frequency *
            </Label>
            <Input
              id="frequency"
              type="time"
              value={formData.alert_notification_frequency}
              onChange={(e) => handleInputChange('alert_notification_frequency', e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              required
            />
            <p className="text-xs text-neutral-500">
              Daily time when alert notifications will be sent (if any alerts are triggered)
            </p>
          </div>

          {/* Notification Methods */}
          <div className="space-y-4">
            <Label className="text-neutral-300 text-base font-medium">
              Notification Methods
            </Label>
            
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <div>
                  <Label className="text-neutral-300 font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-neutral-400">
                    Send alert notifications via email
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.email_enabled}
                onCheckedChange={(checked) => handleInputChange('email_enabled', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* Slack Notifications */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-green-400" />
                <div>
                  <Label className="text-neutral-300 font-medium">
                    Slack Notifications
                  </Label>
                  <p className="text-sm text-neutral-400">
                    Send alert notifications to Slack channels
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.slack_enabled}
                onCheckedChange={(checked) => handleInputChange('slack_enabled', checked)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>

          {/* Email Recipients */}
          {formData.email_enabled && (
            <div className="space-y-3">
              <Label className="text-neutral-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Email Recipients *
              </Label>
              <p className="text-sm text-neutral-400">
                Select which user roles should receive email notifications
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {(["OWNER", "ADMIN", "MEMBER", "VIEWER"] as user_role[]).map((role) => {
                  const isSelected = formData.email_roles_notification.includes(role)
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${getRoleColor(role, isSelected)}`}
                    >
                      <div className="text-sm font-medium">{role}</div>
                    </button>
                  )
                })}
              </div>
              
              {formData.email_roles_notification.length === 0 && (
                <p className="text-red-400 text-sm">Please select at least one role</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Preferences
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 