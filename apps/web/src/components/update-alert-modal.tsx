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

  const handleInputChange = (field: keyof UpdateAlertFormData, value: alert_operator | number | boolean) => {
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
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400"
          >
            <Edit className="w-4 h-4" />
            Update
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Alert</DialogTitle>
            <DialogDescription>
              Modify the alert configuration for this metric.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Operator */}
            <div className="space-y-2">
              <Label>
                Condition *
              </Label>
              <Select 
                value={formData.operator} 
                onValueChange={(value: alert_operator) => handleInputChange('operator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["GREATER_THAN", "LESS_THAN", "EQUALS_TO"] as alert_operator[]).map((operator) => (
                    <SelectItem key={operator} value={operator}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{getOperatorLabel(operator)}</span>
                        <span className="text-xs text-gray-500">{getOperatorDescription(operator)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Threshold */}
            <div className="space-y-2">
              <Label htmlFor="threshold">
                Threshold Value *
              </Label>
              <Input
                id="threshold"
                type="number"
                step="any"
                value={formData.threshold}
                onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value) || 0)}
                placeholder="Enter threshold value"
                required
              />
              <p className="text-xs text-gray-500">
                Alert will trigger when metric value is {getOperatorLabel(formData.operator).toLowerCase()} this value
              </p>
            </div>

            {/* Enable/Disable Alert */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-0.5">
                <Label>
                  Enable Alert
                </Label>
                <p className="text-sm text-gray-600">
                  Alert will be active and send notifications when triggered
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => handleInputChange('is_enabled', checked)}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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