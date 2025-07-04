"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { rollout_type } from '@repo/db/client'
import { Edit, Save, Loader2, Rocket, Plus, X } from "lucide-react"
import { Toaster, toast } from "react-hot-toast"
import { LightDateTimePicker } from './LightDateTimePicker'

interface RolloutData {
  id: string;
  created_at: Date;
  updated_at: Date;
  flag_environment_id: string;
  type: rollout_type;
  config: any; // JsonValue
}

interface RolloutEditModalProps {
  rolloutData: RolloutData;
  environmentId: string;
}

const rolloutTypeOptions = [
  { 
    value: 'PERCENTAGE', 
    label: 'Percentage Rollout', 
    description: 'Fixed percentage rollout with start and end dates' 
  },
  { 
    value: 'PROGRESSIVE_ROLLOUT', 
    label: 'Progressive Rollout', 
    description: 'Gradually increase percentage over time' 
  },
  { 
    value: 'CUSTOM_PROGRESSIVE_ROLLOUT', 
    label: 'Custom Progressive Rollout', 
    description: 'Define custom stages and percentages' 
  },
] as const

export default function RolloutEditModal({ rolloutData, environmentId }: RolloutEditModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [rolloutType, setRolloutType] = useState<rollout_type>(rolloutData.type)
  const [rolloutConfig, setRolloutConfig] = useState<any>(rolloutData.config)

  // Initialize form with existing rollout data
  useEffect(() => {
    if (open) {
      setRolloutType(rolloutData.type)
      setRolloutConfig(rolloutData.config)
      setErrors({})
    }
  }, [open, rolloutData])

  const handleRolloutTypeChange = (value: string) => {
    const type = value as rollout_type
    setRolloutType(type)
    
    // Reset config based on type
    let config: any
    switch (type) {
      case 'PERCENTAGE':
        config = {
          percentage: 0,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        }
        break
      case 'PROGRESSIVE_ROLLOUT':
        config = {
          startPercentage: 5,
          incrementPercentage: 10,
          startDate: new Date().toISOString(),
          maxPercentage: 100,
          frequency: { value: 1, unit: 'days' },
          currentStage: { stage: 0, percentage: 5, nextProgressAt: new Date().toISOString() }
        }
        break
      case 'CUSTOM_PROGRESSIVE_ROLLOUT':
        config = {
          stages: [
            { stage: 0, percentage: 10, stageDate: new Date().toISOString() }
          ],
          currentStage: { stage: 0, percentage: 10, nextProgressAt: new Date().toISOString() }
        }
        break
      default:
        config = {}
    }
    
    setRolloutConfig(config)
  }

  const updateConfig = (updates: any) => {
    setRolloutConfig({ ...rolloutConfig, ...updates })
  }

  const addCustomStage = () => {
    if (rolloutType === 'CUSTOM_PROGRESSIVE_ROLLOUT') {
      const newStage = {
        stage: rolloutConfig.stages.length,
        percentage: Math.min(100, (rolloutConfig.stages[rolloutConfig.stages.length - 1]?.percentage || 0) + 10),
        stageDate: new Date().toISOString()
      }
      
      updateConfig({
        stages: [...rolloutConfig.stages, newStage]
      })
    }
  }

  const removeCustomStage = (index: number) => {
    if (rolloutType === 'CUSTOM_PROGRESSIVE_ROLLOUT') {
      const newStages = rolloutConfig.stages.filter((_: any, i: number) => i !== index)
      updateConfig({
        stages: newStages.map((stage: any, i: number) => ({ ...stage, stage: i }))
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!rolloutType) {
      newErrors.type = 'Rollout type is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||  "http://localhost:8000"
      
    const requestBody = {
      environment_id: environmentId,
      rollout_type: rolloutType,
      rollout_config: rolloutConfig
    }

    const promise = fetch(`/${BACKEND_URL}/flag/updateFlagRollout`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    toast.promise(promise, {
      loading: 'Updating rollout...',
      success: (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = response.json() as Promise<{ success: boolean; message?: string }>;
        result.then(data => {
            if (data.success) {
                setOpen(false)
                router.refresh()
            } else {
                throw new Error(data.message || 'Failed to update rollout')
            }
        })
        return 'Rollout updated successfully!'
      },
      error: (err) => {
        // console.error('Error updating rollout:', err)
        setErrors({ submit: 'Failed to update rollout. Please try again.' })
        return 'Failed to update rollout. Please try again.'
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  const renderRolloutConfig = () => {
    switch (rolloutType) {
      case 'PERCENTAGE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">Percentage (0-100%)</Label>
              <div className="px-3">
                <Slider
                  value={[rolloutConfig.percentage || 0]}
                  onValueChange={([value]) => updateConfig({ percentage: value })}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="text-gray-900 font-medium">{rolloutConfig.percentage || 0}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Start Date</Label>
                <LightDateTimePicker
                  value={rolloutConfig.startDate ? new Date(rolloutConfig.startDate) : undefined}
                  onChange={(date) => updateConfig({ startDate: date ? date.toISOString() : null })}
                  placeholder="Select start date"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">End Date</Label>
                <LightDateTimePicker
                  value={rolloutConfig.endDate ? new Date(rolloutConfig.endDate) : undefined}
                  onChange={(date) => updateConfig({ endDate: date ? date.toISOString() : null })}
                  placeholder="Select end date"
                />
              </div>
            </div>
          </div>
        )

      case 'PROGRESSIVE_ROLLOUT':
        return (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Start Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={rolloutConfig.startPercentage || 5}
                  onChange={(e) => updateConfig({ startPercentage: parseInt(e.target.value) || 5 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Increment Percentage</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={rolloutConfig.incrementPercentage || 10}
                  onChange={(e) => updateConfig({ incrementPercentage: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Max Percentage</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={rolloutConfig.maxPercentage || 100}
                  onChange={(e) => updateConfig({ maxPercentage: parseInt(e.target.value) || 100 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Start Date</Label>
                <LightDateTimePicker
                  value={rolloutConfig.startDate ? new Date(rolloutConfig.startDate) : undefined}
                  onChange={(date) => updateConfig({ startDate: date ? date.toISOString() : null })}
                  placeholder="Select start date"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Frequency Value</Label>
                <Input
                  type="number"
                  min="1"
                  value={rolloutConfig.frequency?.value || 1}
                  onChange={(e) => updateConfig({ 
                    frequency: { 
                      ...rolloutConfig.frequency, 
                      value: parseInt(e.target.value) || 1 
                    } 
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Frequency Unit</Label>
                <Select
                  value={rolloutConfig.frequency?.unit || 'days'}
                  onValueChange={(value) => updateConfig({ 
                    frequency: { 
                      ...rolloutConfig.frequency, 
                      unit: value 
                    } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 'CUSTOM_PROGRESSIVE_ROLLOUT':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-900 font-medium">Custom Stages</Label>
              <Button
                onClick={addCustomStage}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stage
              </Button>
            </div>

            <div className="space-y-3">
              {rolloutConfig.stages?.map((stage: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-900 font-medium">Stage {index + 1}</h4>
                    {rolloutConfig.stages.length > 1 && (
                      <Button
                        onClick={() => removeCustomStage(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-medium">Percentage</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={stage.percentage}
                        onChange={(e) => {
                          const newStages = [...rolloutConfig.stages]
                          newStages[index] = { 
                            ...newStages[index], 
                            percentage: parseInt(e.target.value) || 0 
                          }
                          updateConfig({ stages: newStages })
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-medium">Stage Date</Label>
                      <LightDateTimePicker
                        value={stage.stageDate ? new Date(stage.stageDate) : undefined}
                        onChange={(date) => {
                          const newStages = [...rolloutConfig.stages]
                          newStages[index] = { 
                            ...newStages[index], 
                            stageDate: date ? date.toISOString() : null 
                          }
                          updateConfig({ stages: newStages })
                        }}
                        placeholder="Select stage date"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Toaster />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Rollout
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-900">
              <div className="bg-indigo-100 p-2 rounded-md mr-3">
                <Rocket className="w-5 h-5 text-indigo-600" />
              </div>
              Edit Rollout Configuration
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the rollout strategy for this feature flag environment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Rollout Type Selection */}
            <div className="space-y-3">
              <Label className="text-gray-900 font-medium">Rollout Type</Label>
              <Select value={rolloutType} onValueChange={handleRolloutTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rollout type" />
                </SelectTrigger>
                <SelectContent>
                  {rolloutTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
            </div>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Configuration</CardTitle>
                <CardDescription className="text-gray-600">
                  Configure the parameters for your selected rollout type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRolloutConfig()}
                {errors.submit && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Rollout
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 