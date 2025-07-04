'use client'

import { useState } from 'react'
import { Edit, Save, X, Loader2, Tag, Plus, Target, Hash, TrendingUp, Activity } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'

// Types matching the API structure
type metric_type = "CONVERSION" | "COUNT" | "NUMERIC"
type metric_aggregation_method = "SUM" | "AVERAGE" | "P99" | "P90" | "P95" | "P75" | "P50"

interface Metric {
  id: string
  created_at: Date
  updated_at: Date
  is_active: boolean
  organization_id: string
  description: string | null
  tags: string[]
  flag_environment_id: string
  metric_name: string
  metric_key: string
  metric_type: metric_type
  aggregation_window: number
  unit_measurement: string | null
  aggregation_method: metric_aggregation_method
}

interface EditFormData {
  metric_id: string
  metric_name: string
  metric_type: metric_type
  is_active: boolean
  unit_measurement: string
  aggregation_method: metric_aggregation_method
  description: string
  tags: string[]
}

interface EditMetricModalProps {
  metric: Metric
}

export function EditMetricModal({ metric }: EditMetricModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState("")
  
  const [formData, setFormData] = useState<EditFormData>({
    metric_id: metric.id,
    metric_name: metric.metric_name,
    metric_type: metric.metric_type,
    is_active: metric.is_active,
    unit_measurement: metric.unit_measurement || "",
    aggregation_method: metric.aggregation_method,
    description: metric.description || "",
    tags: metric.tags || []
  })

  const handleInputChange = (field: keyof EditFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...prev.tags, tagInput.trim()] 
      }))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const validate = (): boolean => {
    if (!formData.metric_name.trim()) {
      toast.error("Metric name is required")
      return false
    }
    if (!formData.unit_measurement.trim()) {
      toast.error("Unit of measurement is required")
      return false
    }
    if (!formData.description.trim()) {
      toast.error("Description is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsSubmitting(true)
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const promise = fetch(`/${backendUrl}/metrics`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    });

    toast.promise(promise, {
        loading: 'Updating metric...',
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
                    throw new Error(data.message || 'Failed to update metric')
                }
            })
            return 'Metric updated successfully!'
        },
        error: (err) => {
            // console.error('Error updating metric:', err)
            return 'Failed to update metric. Please try again.'
        }
    }).finally(() => {
        setIsSubmitting(false)
    });
  }

  const getMetricTypeIconBackground = (type: metric_type) => {
    switch (type) {
      case "CONVERSION":
        return 'bg-purple-100 text-purple-600'
      case "COUNT":
        return 'bg-blue-100 text-blue-600'
      case "NUMERIC":
        return 'bg-emerald-100 text-emerald-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getMetricTypeIcon = (type: metric_type) => {
    switch (type) {
      case "CONVERSION":
        return Target
      case "COUNT":
        return Hash
      case "NUMERIC":
        return TrendingUp
      default:
        return Activity
    }
  }

  const getMetricTypeColor = (type: metric_type) => {
    switch (type) {
      case "CONVERSION":
        return 'from-emerald-500 to-teal-500'
      case "COUNT":
        return 'from-blue-500 to-cyan-500'
      case "NUMERIC":
        return 'from-purple-500 to-pink-500'
      default:
        return 'from-gray-500 to-slate-500'
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
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${getMetricTypeIconBackground(formData.metric_type)} flex items-center justify-center`}>
                {(() => {
                  const Icon = getMetricTypeIcon(formData.metric_type)
                  return <Icon className="w-5 h-5" />
                })()}
              </div>
              Edit Metric
            </DialogTitle>
            <DialogDescription>
              Update metric details and configuration. Changes will be applied immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Metric Name */}
            <div className="space-y-2">
              <Label htmlFor="metric_name" className="text-neutral-300">
                Metric Name *
              </Label>
              <Input
                id="metric_name"
                value={formData.metric_name}
                onChange={(e) => handleInputChange('metric_name', e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                placeholder="Enter metric name"
                required
              />
            </div>

            {/* Metric Type */}
            <div className="space-y-2">
              <Label className="text-neutral-300">
                Metric Type *
              </Label>
              <Select 
                value={formData.metric_type} 
                onValueChange={(value: metric_type) => handleInputChange('metric_type', value)}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {(["CONVERSION", "COUNT", "NUMERIC"] as metric_type[]).map((type) => {
                    const Icon = getMetricTypeIcon(type)
                    return (
                      <SelectItem key={type} value={type} className="text-white hover:bg-slate-700">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded bg-gradient-to-r ${getMetricTypeColor(type)} flex items-center justify-center`}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                          {type}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div>
                <Label className="text-neutral-300 font-medium">
                  Active Status
                </Label>
                <p className="text-sm text-neutral-400">
                  Enable or disable this metric
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            {/* Unit of Measurement */}
            <div className="space-y-2">
              <Label htmlFor="unit_measurement" className="text-neutral-300">
                Unit of Measurement *
              </Label>
              <Input
                id="unit_measurement"
                value={formData.unit_measurement}
                onChange={(e) => handleInputChange('unit_measurement', e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                placeholder="e.g., clicks, conversions, ms"
                required
              />
            </div>

            {/* Aggregation Method */}
            <div className="space-y-2">
              <Label className="text-neutral-300">
                Aggregation Method *
              </Label>
              <Select 
                value={formData.aggregation_method} 
                onValueChange={(value: metric_aggregation_method) => handleInputChange('aggregation_method', value)}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {(["SUM", "AVERAGE", "P99", "P90", "P95", "P75", "P50"] as metric_aggregation_method[]).map((method) => (
                    <SelectItem key={method} value={method} className="text-white hover:bg-slate-700">
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-neutral-300">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 min-h-[100px]"
                placeholder="Describe what this metric measures and how it's used"
                required
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label className="text-neutral-300">
                Tags
              </Label>
              
              {/* Add Tag Input */}
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  placeholder="Add a tag and press Enter"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Display Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className="bg-slate-700/50 text-slate-300 border-slate-600 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
                    Update Metric
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