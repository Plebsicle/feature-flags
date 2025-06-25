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
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Preferences
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-md mr-3">
                <Edit className="w-5 h-5 text-indigo-600" />
              </div>
              Edit Alert Preferences
            </DialogTitle>
            <DialogDescription>
              Update your organisation's alert notification settings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Frequency Configuration */}
            <div className="space-y-4">
              <Label className="text-gray-900 text-base font-medium flex items-center gap-2">
                <div className="bg-indigo-100 p-1 rounded">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                Notification Frequency *
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency_value" className="text-gray-900">
                    Frequency Value *
                  </Label>
                  <Input
                    id="frequency_value"
                    type="number"
                    min="1"
                    value={formData.frequency_value}
                    onChange={(e) => handleInputChange('frequency_value', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency_unit" className="text-gray-900">
                    Frequency Unit *
                  </Label>
                  <Select
                    value={formData.frequency_unit}
                    onValueChange={(value) => handleInputChange('frequency_unit', value as FrequencyUnit)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINUTES">Minutes</SelectItem>
                      <SelectItem value="HOURS">Hours</SelectItem>
                      <SelectItem value="DAYS">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                How often to check for alerts (every {formData.frequency_value} {getFrequencyUnitDisplay(formData.frequency_unit).toLowerCase()})
              </p>
            </div>

            {/* Number of Times */}
            <div className="space-y-2">
              <Label htmlFor="number_of_times" className="text-gray-900 flex items-center gap-2">
                <div className="bg-indigo-100 p-1 rounded">
                  <Repeat className="w-4 h-4 text-indigo-600" />
                </div>
                Number of Times *
              </Label>
              <Input
                id="number_of_times"
                type="number"
                min="1"
                value={formData.number_of_times}
                onChange={(e) => handleInputChange('number_of_times', parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-xs text-gray-500">
                Number of consecutive failures before triggering an alert
              </p>
            </div>

            {/* Email Notifications */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1 rounded">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-gray-900 font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Send alerts via email</p>
                  </div>
                </div>
                <Switch
                  checked={formData.email_enabled}
                  onCheckedChange={(value) => handleInputChange('email_enabled', value)}
                />
              </div>

              {formData.email_enabled && (
                <div className="space-y-3 mt-4">
                  <Label className="text-gray-900 flex items-center gap-2">
                    <div className="bg-indigo-100 p-1 rounded">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    Notify User Roles *
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(user_role).map((role) => (
                      <label
                        key={role}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.email_roles_notification.includes(role)
                            ? 'bg-indigo-50 border-indigo-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.email_roles_notification.includes(role)}
                          onChange={() => handleRoleToggle(role)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={`text-sm font-medium ${getRoleColor(role)}`}>
                          {role}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Slack Notifications */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-1 rounded">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <Label className="text-gray-900 font-medium">Slack Notifications</Label>
                    <p className="text-sm text-gray-600">Send alerts to configured Slack channels</p>
                  </div>
                </div>
                <Switch
                  checked={formData.slack_enabled}
                  onCheckedChange={(value) => handleInputChange('slack_enabled', value)}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
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