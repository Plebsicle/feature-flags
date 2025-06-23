'use client'

import { useState } from 'react'
import { Bell, Save, Loader2, Mail, MessageSquare, Users, Clock } from 'lucide-react'
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
import { Toaster, toast } from 'react-hot-toast'

// Types matching the API structure and database schema
type user_role = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER"

interface CreateAlertPreferencesFormData {
  alert_notification_frequency: string // Time string format "HH:mm"
  email_enabled: boolean
  slack_enabled: boolean
  email_roles_notification: user_role[]
}

export function CreateAlertPreferencesModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<CreateAlertPreferencesFormData>({
    alert_notification_frequency: "09:00", // Default to 9 AM
    email_enabled: true,
    slack_enabled: false,
    email_roles_notification: ["ADMIN", "OWNER"] // Default roles
  })

  const handleInputChange = (field: keyof CreateAlertPreferencesFormData, value: any) => {
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
    
    // Convert time string to ISO Date string
    const today = new Date()
    const [hours, minutes] = formData.alert_notification_frequency.split(':')
    if(!hours) return;
    if(!minutes) return;
    const frequencyDate = new Date()
    frequencyDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const promise = fetch(`/${backendUrl}/organisation/preferences`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...formData,
            alert_notification_frequency: frequencyDate.toISOString()
        }),
    });

    toast.promise(promise, {
        loading: 'Creating alert preferences...',
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
                    throw new Error(data.message || 'Failed to create alert preferences')
                }
            })
            return 'Alert preferences created successfully!'
        },
        error: (err) => {
            console.error('Error creating alert preferences:', err)
            return 'Failed to create alert preferences. Please try again.'
        }
    }).finally(() => {
        setIsSubmitting(false)
    });
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
    <>
      <Toaster />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-3 text-lg font-semibold"
          >
            <Bell className="w-5 h-5 mr-2" />
            Create Alert Preferences
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Create Alert Preferences</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Configure how your organisation receives alert notifications for metrics.
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
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Preferences
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