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
          startDate: new Date(),
          endDate: new Date()
        }
        break
      case 'PROGRESSIVE_ROLLOUT':
        config = {
          startPercentage: 5,
          incrementPercentage: 10,
          startDate: new Date(),
          maxPercentage: 100,
          frequency: { value: 1, unit: 'days' },
          currentStage: { stage: 0, percentage: 5, nextProgressAt: new Date() }
        }
        break
      case 'CUSTOM_PROGRESSIVE_ROLLOUT':
        config = {
          stages: [
            { stage: 0, percentage: 10, stageDate: new Date() }
          ],
          currentStage: { stage: 0, percentage: 10, nextProgressAt: new Date() }
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
        stageDate: new Date()
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
    try {
      const BACKEND_URL =  "http://localhost:8000"
      
      const requestBody = {
        environment_id: environmentId,
        rollout_type: rolloutType,
        rollout_config: rolloutConfig
      }

      const response = await fetch(`${BACKEND_URL}/flag/updateFlagRollout`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setOpen(false)
        router.refresh() // Refresh the page to show updated data
      } else {
        throw new Error(result.message || 'Failed to update rollout')
      }
    } catch (error) {
      console.error('Error updating rollout:', error)
      setErrors({ submit: 'Failed to update rollout. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const renderRolloutConfig = () => {
    switch (rolloutType) {
      case 'PERCENTAGE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Percentage (0-100%)</Label>
              <div className="px-3">
                <Slider
                  value={[rolloutConfig.percentage || 0]}
                  onValueChange={([value]) => updateConfig({ percentage: value })}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0%</span>
                  <span className="text-white font-medium">{rolloutConfig.percentage || 0}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={rolloutConfig.startDate ? new Date(rolloutConfig.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateConfig({ startDate: new Date(e.target.value) })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">End Date</Label>
                <Input
                  type="datetime-local"
                  value={rolloutConfig.endDate ? new Date(rolloutConfig.endDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateConfig({ endDate: new Date(e.target.value) })}
                  className="bg-slate-700/50 border-slate-600 text-white"
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
                <Label className="text-white">Start Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={rolloutConfig.startPercentage || 5}
                  onChange={(e) => updateConfig({ startPercentage: parseInt(e.target.value) || 5 })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Increment Percentage</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={rolloutConfig.incrementPercentage || 10}
                  onChange={(e) => updateConfig({ incrementPercentage: parseInt(e.target.value) || 10 })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Max Percentage</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={rolloutConfig.maxPercentage || 100}
                  onChange={(e) => updateConfig({ maxPercentage: parseInt(e.target.value) || 100 })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={rolloutConfig.startDate ? new Date(rolloutConfig.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateConfig({ startDate: new Date(e.target.value) })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Frequency Value</Label>
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
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Frequency Unit</Label>
                <Select
                  value={rolloutConfig.frequency?.unit || 'days'}
                  onValueChange={(value) => updateConfig({ 
                    frequency: { 
                      ...rolloutConfig.frequency, 
                      unit: value 
                    } 
                  })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="minutes" className="text-white hover:bg-slate-700">Minutes</SelectItem>
                    <SelectItem value="hours" className="text-white hover:bg-slate-700">Hours</SelectItem>
                    <SelectItem value="days" className="text-white hover:bg-slate-700">Days</SelectItem>
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
              <Label className="text-white">Custom Stages</Label>
              <Button
                onClick={addCustomStage}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stage
              </Button>
            </div>

            <div className="space-y-3">
              {rolloutConfig.stages?.map((stage: any, index: number) => (
                <div key={index} className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">Stage {index + 1}</h4>
                    {rolloutConfig.stages.length > 1 && (
                      <Button
                        onClick={() => removeCustomStage(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Percentage</Label>
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
                        className="bg-slate-600/50 border-slate-500 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">Stage Date</Label>
                      <Input
                        type="datetime-local"
                        value={stage.stageDate ? new Date(stage.stageDate).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const newStages = [...rolloutConfig.stages]
                          newStages[index] = { 
                            ...newStages[index], 
                            stageDate: new Date(e.target.value) 
                          }
                          updateConfig({ stages: newStages })
                        }}
                        className="bg-slate-600/50 border-slate-500 text-white"
                      />
                    </div>
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        )

      default:
        return <div className="text-slate-400">Select a rollout type to configure settings</div>
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-blue-600/50 text-blue-400 hover:bg-blue-900/20">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800/95 backdrop-blur-xl border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Rocket className="w-5 h-5 mr-2 text-blue-400" />
            Edit Rollout Configuration
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Update the rollout strategy and configuration for this environment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rollout Type Selection */}
          <div className="space-y-2">
            <Label className="text-white">Rollout Type *</Label>
            <Select value={rolloutType} onValueChange={handleRolloutTypeChange}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select rollout type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {rolloutTypeOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-white hover:bg-slate-700 focus:bg-slate-700"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-slate-400">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-red-400 text-sm">{errors.type}</p>}
          </div>

          {/* Rollout Configuration */}
          <Card className="bg-slate-700/30 border-slate-600/50">
            <CardHeader>
              <CardTitle className="text-white">Configuration</CardTitle>
              <CardDescription className="text-neutral-400">
                Configure the settings for your selected rollout type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRolloutConfig()}
            </CardContent>
          </Card>

          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700/50">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
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
  )
} 