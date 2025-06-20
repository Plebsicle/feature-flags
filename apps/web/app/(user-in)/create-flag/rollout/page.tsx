"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useFlagCreation } from "../../../contexts/flag-creation"
import { rollout_type } from '@repo/db/client'
import { ArrowLeft, Rocket, Check, Loader2 } from "lucide-react"


const wrapValue = (innerValue: any): { value: any } => {
  return { value: innerValue }
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

export default function RolloutPage() {
  const router = useRouter()
  const { state, updateRollout, submitFlag } = useFlagCreation()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleRolloutTypeChange = (value: string) => {
    const type = value as rollout_type
    
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
    
    updateRollout({ type, config })
  }

  const updateConfig = (updates: any) => {
    updateRollout({
      config: { ...state.rollout.config, ...updates }
    })
  }

  const addCustomStage = () => {
    if (state.rollout.type === 'CUSTOM_PROGRESSIVE_ROLLOUT') {
      const config = state.rollout.config as any
      const newStage = {
        stage: config.stages.length,
        percentage: Math.min(100, (config.stages[config.stages.length - 1]?.percentage || 0) + 10),
        stageDate: new Date()
      }
      
      updateConfig({
        stages: [...config.stages, newStage]
      })
    }
  }

  const removeCustomStage = (index: number) => {
    if (state.rollout.type === 'CUSTOM_PROGRESSIVE_ROLLOUT') {
      const config = state.rollout.config as any
      const newStages = config.stages.filter((_: any, i: number) => i !== index)
      updateConfig({
        stages: newStages.map((stage: any, i: number) => ({ ...stage, stage: i }))
      })
    }
  }

  const renderRolloutConfig = () => {
    const config = state.rollout.config as any

    switch (state.rollout.type) {
      case 'PERCENTAGE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Percentage (0-100%)</Label>
              <div className="px-3">
                <Slider
                  value={[config.percentage || 0]}
                  onValueChange={([value]) => updateConfig({ percentage: value })}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0%</span>
                  <span className="text-white font-medium">{config.percentage || 0}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={config.startDate ? new Date(config.startDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateConfig({ startDate: new Date(e.target.value) })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">End Date</Label>
                <Input
                  type="datetime-local"
                  value={config.endDate ? new Date(config.endDate).toISOString().slice(0, 16) : ''}
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
                  value={config.startPercentage || 5}
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
                  value={config.incrementPercentage || 10}
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
                  value={config.maxPercentage || 100}
                  onChange={(e) => updateConfig({ maxPercentage: parseInt(e.target.value) || 100 })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Start Date</Label>
                <Input
                  type="datetime-local"
                  value={config.startDate ? new Date(config.startDate).toISOString().slice(0, 16) : ''}
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
                  value={config.frequency?.value || 1}
                  onChange={(e) => updateConfig({ 
                    frequency: { 
                      ...config.frequency, 
                      value: parseInt(e.target.value) || 1 
                    } 
                  })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Frequency Unit</Label>
                <Select
                  value={config.frequency?.unit || 'days'}
                  onValueChange={(value) => updateConfig({ 
                    frequency: { 
                      ...config.frequency, 
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
                Add Stage
              </Button>
            </div>

            <div className="space-y-3">
              {config.stages?.map((stage: any, index: number) => (
                <div key={index} className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">Stage {index + 1}</h4>
                    {config.stages.length > 1 && (
                      <Button
                        onClick={() => removeCustomStage(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        Remove
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
                          const newStages = [...config.stages]
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
                          const newStages = [...config.stages]
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!state.rollout.type) {
      newErrors.type = 'Rollout type is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Check if we're creating an environment for an existing flag
      if (state.isCreatingEnvironmentOnly) {
        // Submit to create environment endpoint
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        
        const response = await fetch(`${BACKEND_URL}/flag/createEnvironment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            flag_id: state.flag_id,
            environment: state.environments.environment,
            ruleName: state.rules.name,
            ruleDescription: state.rules.description,
            value: wrapValue(state.environments.value.value),
            default_value: wrapValue(state.environments.default_value.value),
            conditions: state.rules.conditions,
            rollout_type: state.rollout.type,
            rollout_config: state.rollout.config
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('Environment created successfully:', result)
      } else {
        // Use existing flag creation logic
        await submitFlag()
      }
      
      setIsSuccess(true)
      
      // Redirect to dashboard after a brief success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error creating flag/environment:', error)
      setErrors({ 
        submit: state.isCreatingEnvironmentOnly 
          ? 'Failed to create environment. Please try again.' 
          : 'Failed to create flag. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrevious = () => {
    router.push('/create-flag/rules')
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 max-w-md w-full">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {state.isCreatingEnvironmentOnly ? 'Environment Added Successfully!' : 'Flag Created Successfully!'}
            </h2>
            <p className="text-slate-400 mb-4">
              {state.isCreatingEnvironmentOnly 
                ? `New environment "${state.environments.environment}" has been added to your feature flag "${state.name}".`
                : `Your feature flag "${state.name}" has been created and is ready to use.`
              }
            </p>
            <p className="text-slate-500 text-sm">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {state.isCreatingEnvironmentOnly ? 'Add Environment' : 'Create Feature Flag'}
              </h1>
              <p className="text-neutral-400">
                {state.isCreatingEnvironmentOnly ? 'Configure rollout for your new environment' : 'Step 4 of 4 - Final Step'}
              </p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">✓</div>
            <div className="h-1 w-16 bg-green-500"></div>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">✓</div>
            <div className="h-1 w-16 bg-green-500"></div>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">✓</div>
            <div className="h-1 w-16 bg-purple-500"></div>
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">4</div>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
          <CardHeader>
            <CardTitle className="text-white">Rollout Configuration</CardTitle>
            <CardDescription className="text-neutral-400">
              Define how your feature flag will be rolled out to users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rollout Type */}
            <div className="space-y-2">
              <Label htmlFor="rollout-type" className="text-white">Rollout Type *</Label>
              <Select value={state.rollout.type} onValueChange={handleRolloutTypeChange}>
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

            {/* Dynamic Config */}
            {state.rollout.type && (
              <div className="bg-slate-700/30 p-6 rounded-lg border border-slate-600/50">
                <h3 className="text-white font-medium mb-4">Configuration</h3>
                {renderRolloutConfig()}
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-lg">
                <p className="text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                onClick={handlePrevious}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button 
                onClick={handleSubmit}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {state.isCreatingEnvironmentOnly ? 'Adding Environment...' : 'Creating Flag...'}
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    {state.isCreatingEnvironmentOnly ? 'Add Environment' : 'Create Feature Flag'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
