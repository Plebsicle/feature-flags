'use client'

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  BarChart3,
  Save,
  X,
  Target,
  Activity,
  TrendingUp,
  Hash,
  Tag,
  Plus,
  Loader2
} from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Toaster, toast } from "react-hot-toast"

// Enums matching the schema
enum metric_type {
  CONVERSION = "CONVERSION",
  COUNT = "COUNT", 
  NUMERIC = "NUMERIC",
}

enum metric_aggregation_method {
  SUM = "SUM",
  AVERAGE = "AVERAGE",
  P99 = "P99",
  P90 = "P90",
  P95 = "P95",
  P75 = "P75",
  P50 = "P50",
}

interface FormData {
  metric_name: string
  metric_key: string
  metric_type: metric_type
  is_active: boolean
  unit_measurement: string
  aggregation_method: metric_aggregation_method
  description: string
  tags: string[]
}

export default function CreateMetricForm() {
  const router = useRouter()
  const params = useParams()
  const environmentId = params?.environmentId as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState("")
  
  const [formData, setFormData] = useState<FormData>({
    metric_name: "",
    metric_key: "",
    metric_type: metric_type.COUNT,
    is_active: true,
    unit_measurement: "",
    aggregation_method: metric_aggregation_method.SUM,
    description: "",
    tags: []
  })

  // Function to generate metric key from metric name
  const generateMetricKey = (name: string): string => {
    const baseKey = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    // Add 6-digit random suffix
    const suffix = Math.floor(100000 + Math.random() * 900000);
    return baseKey ? `${baseKey}-${suffix}` : `metric-${suffix}`;
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-generate metric key when metric name changes
      if (field === 'metric_name' && typeof value === 'string') {
        updated.metric_key = generateMetricKey(value)
      }
      
      return updated
    })
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
    if (!environmentId) {
      toast.error("Environment ID is required")
      return false
    }
    if (!formData.metric_name.trim()) {
      toast.error("Metric name is required")
      return false
    }
    if (!formData.metric_key.trim()) {
      toast.error("Metric key is required")
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
    // Prepare request body, only include aggregation_method for NUMERIC metrics
    const requestBody = {
        metric_name: formData.metric_name,
        metric_key: formData.metric_key,
        metric_type: formData.metric_type,
        is_active: formData.is_active,
        unit_measurement: formData.unit_measurement,
        description: formData.description,
        flag_environment_id: environmentId,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        ...(formData.metric_type === metric_type.NUMERIC && {
            aggregation_method: formData.aggregation_method
        })
    }
    // console.log(`${backendUrl}/metrics`);
    const promise = fetch(`${backendUrl}/metrics`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    toast.promise(promise, {
        loading: 'Creating metric...',
        success: (response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const result = response.json() as Promise<{ success: boolean; message?: string }>;
            result.then(data => {
                if (data.success) {
                    router.push('/metrics')
                } else {
                    throw new Error(data.message || 'Failed to create metric')
                }
            })
            return 'Metric created successfully!'
        },
        error: () => {
            // console.error('Error creating metric:', err)
            return 'Failed to create metric. Please try again.'
        }
    }).finally(() => {
        setIsSubmitting(false)
    });
  }


  const getMetricTypeIcon = (type: metric_type) => {
    switch (type) {
      case metric_type.CONVERSION:
        return Target
      case metric_type.COUNT:
        return Hash
      case metric_type.NUMERIC:
        return TrendingUp
      default:
        return Activity
    }
  }


  return (
    <div className="space-y-8">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Create Metric</h1>
            <p className="text-muted-foreground text-sm mt-1">Define a new metric to track your application&apos;s performance</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="rounded-lg font-medium text-sm"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-foreground font-semibold text-2xl">
              <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg mr-3">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              Basic Information
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm mt-1">
              Configure the basic details for your metric
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Metric Name & Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="metric_name" className="text-sm font-medium text-muted-foreground">
                  Metric Name *
                </Label>
                <Input
                  id="metric_name"
                  type="text"
                  value={formData.metric_name}
                  onChange={(e) => handleInputChange('metric_name', e.target.value)}
                  placeholder="e.g., User Signups"
                  className="rounded-lg border-border bg-muted/10 text-sm focus-visible:ring-0 focus-visible:border-primary"
                  required
                />
                <p className="text-xs text-muted-foreground opacity-70">
                  A human-readable name for your metric
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metric_key" className="text-sm font-medium text-muted-foreground">
                  Metric Key (auto-generated)
                </Label>
                <Input
                  id="metric_key"
                  type="text"
                  value={formData.metric_key}
                  readOnly
                  placeholder="e.g., user-signups-123456"
                  className="bg-muted/30 border-border text-muted-foreground cursor-not-allowed rounded-lg font-mono text-sm focus-visible:ring-0"
                />
                <p className="text-xs text-muted-foreground opacity-70">
                  A unique identifier automatically generated from the metric name with a unique suffix
                </p>
              </div>
            </div>

            {/* Metric Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Metric Type *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(metric_type).map((type) => {
                  const IconComponent = getMetricTypeIcon(type)
                  const isSelected = formData.metric_type === type
                  
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleInputChange('metric_type', type)}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/10 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg border ${isSelected ? 'bg-primary/20 border-primary/50' : 'bg-muted/30 border-border'}`}>
                          <IconComponent className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="text-left">
                          <div className={`font-semibold tracking-tight text-lg ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {type}
                          </div>
                          <div className={`text-xs mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground opacity-70'}`}>
                            {type === metric_type.CONVERSION && 'Track conversion rates'}
                            {type === metric_type.COUNT && 'Count events or actions'}
                            {type === metric_type.NUMERIC && 'Track numeric values'}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Unit & Aggregation */}
            <div className={`grid grid-cols-1 ${formData.metric_type === metric_type.NUMERIC ? 'md:grid-cols-2' : ''} gap-6`}>
              <div className="space-y-2">
                <Label htmlFor="unit_measurement" className="text-sm font-medium text-muted-foreground">
                  Unit of Measurement *
                </Label>
                <Input
                  id="unit_measurement"
                  type="text"
                  value={formData.unit_measurement}
                  onChange={(e) => handleInputChange('unit_measurement', e.target.value)}
                  placeholder="e.g., users, clicks, dollars"
                  className="rounded-lg border-border bg-muted/10 text-sm focus-visible:ring-0 focus-visible:border-primary"
                  required
                />
                <p className="text-xs text-muted-foreground opacity-70">
                  The unit this metric measures
                </p>
              </div>
              
              {formData.metric_type === metric_type.NUMERIC && (
                <div className="space-y-2">
                  <Label htmlFor="aggregation_method" className="text-sm font-medium text-muted-foreground">
                    Aggregation Method *
                  </Label>
                  <Select
                    value={formData.aggregation_method}
                    onValueChange={(value) => handleInputChange('aggregation_method', value as metric_aggregation_method)}
                  >
                    <SelectTrigger className="rounded-lg border-border bg-muted/10 text-sm focus-visible:ring-0 focus-visible:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-border bg-card">
                      {Object.values(metric_aggregation_method).map((method) => (
                        <SelectItem key={method} value={method} className="focus:bg-muted cursor-pointer rounded-md">
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground opacity-70">
                    How to aggregate numeric values over time
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this metric tracks and how it's used..."
                className="min-h-[100px] rounded-lg border-border bg-muted/10 text-sm focus-visible:ring-0 focus-visible:border-primary"
                required
              />
              <p className="text-xs text-muted-foreground opacity-70">
                Provide context about this metric for your team
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-foreground font-semibold text-2xl">
              <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg mr-3">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              Configuration
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm mt-1">
              Configure metric settings and organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Active Status</Label>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {formData.is_active ? 'This metric is currently active' : 'This metric is currently inactive'}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(value) => handleInputChange('is_active', value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </Label>
              
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add a tag..."
                  className="rounded-lg border-border bg-muted/10 text-sm focus-visible:ring-0 focus-visible:border-primary"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addTag}
                  disabled={!tagInput.trim() || isSubmitting}
                  className="rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted/5 border border-border rounded-lg">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-muted/50 rounded-md text-xs font-medium bg-muted/20 text-muted-foreground"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground opacity-70">
                Use tags to categorize and organize your metrics. Click on a tag to remove it.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="rounded-lg font-medium text-sm"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Metric
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 