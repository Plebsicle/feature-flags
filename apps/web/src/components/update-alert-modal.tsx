'use client'

import { useState } from 'react'
import { Edit, Save, Loader2 } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'

// Types matching the API structure
type alert_operator = "EQUALS_TO" | "GREATER_THAN" | "LESS_THAN"

interface Alert {
  id: string
  metric_id: string
  operator: alert_operator
  threshold: number
  is_enabled: boolean
}

interface UpdateAlertFormData {
  metric_id: string
  operator: alert_operator
  threshold: number
  is_enabled: boolean
}

interface UpdateAlertModalProps {
  alert: Alert
  metricId: string
}

export function UpdateAlertModal({ alert, metricId }: UpdateAlertModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<UpdateAlertFormData>({
    metric_id: metricId,
    operator: alert.operator,
    threshold: alert.threshold,
    is_enabled: alert.is_enabled
  })

  const handleInputChange = (field: keyof UpdateAlertFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validate = (): boolean => {
    if (formData.threshold === null || formData.threshold === undefined) {
      toast.error("Threshold value is required")
      return false
    }
    if (isNaN(Number(formData.threshold))) {
      toast.error("Threshold must be a valid number")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsSubmitting(true)
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const promise = fetch(`/${backendUrl}/alerts`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...formData,
            threshold: Number(formData.threshold)
        }),
    });

    toast.promise(promise, {
        loading: 'Updating alert...',
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
                    throw new Error(data.message || 'Failed to update alert')
                }
            })
            return 'Alert updated successfully!'
        },
        error: (err) => {
            console.error('Error updating alert:', err)
            return 'Failed to update alert. Please try again.'
        }
    }).finally(() => {
        setIsSubmitting(false)
    });
  }

  const getOperatorLabel = (operator: alert_operator) => {
    switch (operator) {
      case "EQUALS_TO":
        return "Equals to"
      case "GREATER_THAN":
        return "Greater than"
      case "LESS_THAN":
        return "Less than"
      default:
        return operator
    }
  }

  const getOperatorDescription = (operator: alert_operator) => {
    switch (operator) {
      case "EQUALS_TO":
        return "Alert when metric equals the threshold value"
      case "GREATER_THAN":
        return "Alert when metric exceeds the threshold value"
      case "LESS_THAN":
        return "Alert when metric falls below the threshold value"
      default:
        return ""
    }
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
            <Edit className="w-4 h-4" />
            Update
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Update Alert</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Modify the alert configuration for this metric.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Operator */}
            <div className="space-y-2">
              <Label className="text-neutral-300">
                Condition *
              </Label>
              <Select 
                value={formData.operator} 
                onValueChange={(value: alert_operator) => handleInputChange('operator', value)}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {(["GREATER_THAN", "LESS_THAN", "EQUALS_TO"] as alert_operator[]).map((operator) => (
                    <SelectItem key={operator} value={operator} className="text-white hover:bg-slate-700">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{getOperatorLabel(operator)}</span>
                        <span className="text-xs text-neutral-400">{getOperatorDescription(operator)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Threshold */}
            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-neutral-300">
                Threshold Value *
              </Label>
              <Input
                id="threshold"
                type="number"
                step="any"
                value={formData.threshold}
                onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value) || 0)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                placeholder="Enter threshold value"
                required
              />
              <p className="text-xs text-neutral-500">
                Alert will trigger when metric value is {getOperatorLabel(formData.operator).toLowerCase()} this value
              </p>
            </div>

            {/* Enabled Status */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div>
                <Label className="text-neutral-300 font-medium">
                  Enable Alert
                </Label>
                <p className="text-sm text-neutral-400">
                  Toggle alert active status
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => handleInputChange('is_enabled', checked)}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

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
                    Update Alert
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