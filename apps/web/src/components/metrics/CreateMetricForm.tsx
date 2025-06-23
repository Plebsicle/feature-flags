'use client'

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
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
} from "lucide-react"
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
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with underscores
      .replace(/-+/g, '-') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
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
    const promise = fetch(`${backendUrl}/metrics`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...formData,
            flag_environment_id: environmentId,
            tags: formData.tags.length > 0 ? formData.tags : undefined
        }),
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
        error: (err) => {
            console.error('Error creating metric:', err)
            return 'Failed to create metric. Please try again.'
        }
    }).finally(() => {
        setIsSubmitting(false)
    });
  }

  const getMetricTypeColor = (type: metric_type) => {
    switch (type) {
      case metric_type.CONVERSION:
        return 'from-emerald-500 to-teal-600'
      case metric_type.COUNT:
        return 'from-blue-500 to-indigo-600'
      case metric_type.NUMERIC:
        return 'from-purple-500 to-violet-600'
      default:
        return 'from-gray-500 to-slate-600'
    }
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  const MetricTypeIcon = getMetricTypeIcon(formData.metric_type)

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="p-4 sm:p-6 lg:p-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Header */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getMetricTypeColor(formData.metric_type)} flex items-center justify-center`}>
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">Create Metric</h1>
                  <p className="text-neutral-400 text-base sm:text-lg">
                    Set up a new metric to track performance and user engagement
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div variants={itemVariants}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <span>Basic Information</span>
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Define the core properties of your metric
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-neutral-300">Metric Name *</Label>
                        <Input
                          value={formData.metric_name}
                          onChange={(e) => handleInputChange('metric_name', e.target.value)}
                          className="mt-1 bg-slate-800/40 border-slate-700/30 text-white placeholder:text-neutral-500"
                          placeholder="e.g., Button Click Rate"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-neutral-300">Metric Key * (Auto-generated)</Label>
                        <Input
                          value={formData.metric_key}
                          onChange={(e) => handleInputChange('metric_key', e.target.value)}
                          className="mt-1 bg-slate-800/40 border-slate-700/30 text-white placeholder:text-neutral-500"
                          placeholder="e.g., button_click_rate"
                          required
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                          Generated from metric name. You can edit this if needed.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-neutral-300">Description *</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="mt-1 bg-slate-800/40 border-slate-700/30 text-white placeholder:text-neutral-500"
                        placeholder="Describe what this metric measures..."
                        rows={3}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <Label className="text-neutral-300">Active Status</Label>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                      />
                      <span className="text-sm text-neutral-400">
                        {formData.is_active ? 'Metric is active' : 'Metric is inactive'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric Configuration */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <MetricTypeIcon className="w-5 h-5 text-blue-400" />
                      <span>Metric Configuration</span>
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Configure how the metric is measured and aggregated
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-neutral-300">Metric Type *</Label>
                        <Select
                          value={formData.metric_type}
                          onValueChange={(value) => handleInputChange('metric_type', value as metric_type)}
                        >
                          <SelectTrigger className="mt-1 bg-slate-800/40 border-slate-700/30 text-white">
                            <SelectValue placeholder="Select metric type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value={metric_type.COUNT} className="text-white hover:bg-slate-700">
                              <div className="flex items-center space-x-2">
                                <Hash className="w-4 h-4 text-blue-400" />
                                <span>Count</span>
                              </div>
                            </SelectItem>
                            <SelectItem value={metric_type.CONVERSION} className="text-white hover:bg-slate-700">
                              <div className="flex items-center space-x-2">
                                <Target className="w-4 h-4 text-emerald-400" />
                                <span>Conversion</span>
                              </div>
                            </SelectItem>
                            <SelectItem value={metric_type.NUMERIC} className="text-white hover:bg-slate-700">
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-purple-400" />
                                <span>Numeric</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-neutral-300">Aggregation Method *</Label>
                        <Select
                          value={formData.aggregation_method}
                          onValueChange={(value) => handleInputChange('aggregation_method', value as metric_aggregation_method)}
                        >
                          <SelectTrigger className="mt-1 bg-slate-800/40 border-slate-700/30 text-white">
                            <SelectValue placeholder="Select aggregation method" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value={metric_aggregation_method.SUM} className="text-white hover:bg-slate-700">Sum</SelectItem>
                            <SelectItem value={metric_aggregation_method.AVERAGE} className="text-white hover:bg-slate-700">Average</SelectItem>
                            <SelectItem value={metric_aggregation_method.P50} className="text-white hover:bg-slate-700">P50 (Median)</SelectItem>
                            <SelectItem value={metric_aggregation_method.P75} className="text-white hover:bg-slate-700">P75</SelectItem>
                            <SelectItem value={metric_aggregation_method.P90} className="text-white hover:bg-slate-700">P90</SelectItem>
                            <SelectItem value={metric_aggregation_method.P95} className="text-white hover:bg-slate-700">P95</SelectItem>
                            <SelectItem value={metric_aggregation_method.P99} className="text-white hover:bg-slate-700">P99</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-neutral-300">Unit of Measurement *</Label>
                      <Input
                        value={formData.unit_measurement}
                        onChange={(e) => handleInputChange('unit_measurement', e.target.value)}
                        className="mt-1 bg-slate-800/40 border-slate-700/30 text-white placeholder:text-neutral-500"
                        placeholder="e.g., clicks, conversions, milliseconds"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Tag className="w-5 h-5 text-blue-400" />
                      <span>Tags (Optional)</span>
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Add tags to categorize and organize your metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        className="flex-1 bg-slate-800/40 border-slate-700/30 text-white placeholder:text-neutral-500"
                        placeholder="Enter a tag and press Enter"
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        variant="outline"
                        className="border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-slate-600 text-neutral-300 hover:bg-slate-700/50"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
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
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  )
} 