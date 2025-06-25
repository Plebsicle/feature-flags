'use client'

import { useState } from 'react'
import { Edit, Save, Loader2, Mail, MessageSquare, Users, Clock, Hash, Repeat } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
import { FrequencyUnit, user_role } from '@repo/db/client'
import { 
  AlertPreferences, 
  AlertPreferencesFormData, 
  getFrequencyUnitDisplay, 
  getRoleColor 
} from '@/lib/alert-preferences-types'

interface EditAlertPreferencesModalProps {
  preferences: AlertPreferences
}

export function EditAlertPreferencesModal({ preferences }: EditAlertPreferencesModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<AlertPreferencesFormData>({
    frequency_unit: preferences.frequency_unit,
    frequency_value: preferences.frequency_value,
    number_of_times: preferences.number_of_times,
    email_enabled: preferences.email_enabled,
    slack_enabled: preferences.slack_enabled,
    email_roles_notification: preferences.email_roles_notification || []
  })

  const handleInputChange = (field: keyof AlertPreferencesFormData, value: any) => {
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
    if (!formData.frequency_unit) {
      toast.error("Frequency unit is required")
      return false
    }
    if (!formData.frequency_value || formData.frequency_value <= 0) {
      toast.error("Frequency value must be greater than 0")
      return false
    }
    if (!formData.number_of_times || formData.number_of_times <= 0) {
      toast.error("Number of times must be greater than 0")
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

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const promise = fetch(`/${backendUrl}/organisation/preferences`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    toast.promise(promise, {
        loading: 'Updating alert preferences...',
        success: (response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const result = response.json() as Promise<{ success: boolean; message?: string }>;
            result.then(data => {
                if (data.success) {
                    setIsOpen(false)
                    router.refresh()
                } else {
                    throw new Error(data.message || 'Failed to update alert preferences')
                }
            })
            return 'Alert preferences updated successfully!'
        },
        error: (err) => {
            console.error('Error updating alert preferences:', err)
            return 'Failed to update alert preferences. Please try again.'
        }
    }).finally(() => {
        setIsSubmitting(false)
    });
  }

  return (
    <>
      <Toaster />
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
            {/* Frequency Configuration */}
            <div className="space-y-4">
              <Label className="text-neutral-300 text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Notification Frequency *
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency_value" className="text-neutral-300">
                    Frequency Value *
                  </Label>
                  <Input
                    id="frequency_value"
                    type="number"
                    min="1"
                    value={formData.frequency_value}
                    onChange={(e) => handleInputChange('frequency_value', parseInt(e.target.value) || 1)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency_unit" className="text-neutral-300">
                    Frequency Unit *
                  </Label>
                  <Select
                    value={formData.frequency_unit}
                    onValueChange={(value) => handleInputChange('frequency_unit', value as FrequencyUnit)}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="MINUTES" className="text-white hover:bg-slate-700">Minutes</SelectItem>
                      <SelectItem value="HOURS" className="text-white hover:bg-slate-700">Hours</SelectItem>
                      <SelectItem value="DAYS" className="text-white hover:bg-slate-700">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <p className="text-xs text-neutral-500">
                How often to check for alerts (every {formData.frequency_value} {getFrequencyUnitDisplay(formData.frequency_unit).toLowerCase()})
              </p>
            </div>

            {/* Number of Times */}
            <div className="space-y-2">
              <Label htmlFor="number_of_times" className="text-neutral-300 flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Number of Times *
              </Label>
              <Input
                id="number_of_times"
                type="number"
                min="1"
                value={formData.number_of_times}
                onChange={(e) => handleInputChange('number_of_times', parseInt(e.target.value) || 1)}
                className="bg-slate-700/50 border-slate-600 text-white"
                required
              />
              <p className="text-xs text-neutral-500">
                How many times an alert condition must be met before triggering a notification
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
    </>
  )
} 