"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFlagCreation } from "../../../../contexts/flag-creation"
import { rollout_type } from '@repo/db/client'
import { ArrowLeft, Rocket, Check, Calendar as CalendarIcon, Clock } from "lucide-react"
import { Toaster, toast } from 'react-hot-toast'
import { LightDateTimePicker } from '@/components/LightDateTimePicker'


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
  const searchParams = useSearchParams()
  const { state, updateRollout, submitFlag, setEnvironmentCreationMode } = useFlagCreation()
  const { hydrateFromExistingFlag } = useFlagCreation()

  const handleRolloutTypeChange = (value: string) => {
    const type = value as rollout_type
    
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
    
    updateRollout({ type, config })
  }

  const updateConfig = (updates: any) => {
    console.log('Rollout page - Config updates:', updates)
    // Check if any of the updates contain dates and log them
    Object.entries(updates).forEach(([key, value]) => {
      if (key.includes('Date') || key.includes('date')) {
        console.log(`Rollout page - ${key} updated to:`, value)
      }
    })
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
        stageDate: new Date().toISOString()
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
              <Label className="text-xs font-medium text-gray-700">Percentage (0-100%)</Label>
              <div className="px-2">
                <Slider
                  value={[config.percentage || 0]}
                  onValueChange={([value]) => updateConfig({ percentage: value })}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="text-indigo-600 font-medium">{config.percentage || 0}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Start Date</Label>
                <LightDateTimePicker
                  value={config.startDate ? new Date(config.startDate) : undefined}
                  onChange={(date) => updateConfig({ startDate: date ? date.toISOString() : null })}
                  placeholder="Select start date"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">End Date</Label>
                <LightDateTimePicker
                  value={config.endDate ? new Date(config.endDate) : undefined}
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
                <Label className="text-xs font-medium text-gray-700">Start Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={config.startPercentage || 5}
                  onChange={(e) => updateConfig({ startPercentage: parseInt(e.target.value) || 5 })}
                  className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Increment Percentage</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={config.incrementPercentage || 10}
                  onChange={(e) => updateConfig({ incrementPercentage: parseInt(e.target.value) || 10 })}
                  className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Max Percentage</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxPercentage || 100}
                  onChange={(e) => updateConfig({ maxPercentage: parseInt(e.target.value) || 100 })}
                  className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Start Date</Label>
                <LightDateTimePicker
                  value={config.startDate ? new Date(config.startDate) : undefined}
                  onChange={(date) => updateConfig({ startDate: date ? date.toISOString() : null })}
                  placeholder="Select start date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Frequency</Label>
              <div className="grid grid-cols-2 gap-3">
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
                  className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
                <Select
                  value={config.frequency?.unit || 'days'}
                  onValueChange={(value) => updateConfig({ 
                    frequency: { 
                      ...config.frequency, 
                      unit: value 
                    } 
                  })}
                >
                  <SelectTrigger className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
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
              <Label className="text-sm font-medium text-gray-900">Custom Stages</Label>
              <Button
                onClick={addCustomStage}
                size="sm"
                variant="outline"
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-7 px-2 text-xs"
              >
                Add Stage
              </Button>
            </div>
            
            <div className="space-y-3">
              {config.stages?.map((stage: any, index: number) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Stage {index + 1}</h4>
                    {config.stages.length > 1 && (
                      <Button
                        onClick={() => removeCustomStage(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Percentage</Label>
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
                        className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Stage Date</Label>
                      <LightDateTimePicker
                        value={stage.stageDate ? new Date(stage.stageDate) : undefined}
                        onChange={(date) => {
                          const newStages = [...config.stages]
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
              )) || []}
            </div>
          </div>
        )

      default:
        return <div className="text-gray-500 text-sm">Select a rollout type to configure settings</div>
    }
  }

  const validateForm = () => {
    if (!state.rollout.type) {
      toast.error('Rollout type is required')
      return false
    }
    // Add more validation logic as needed
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Check if we're creating an environment for an existing flag
    if (state.isCreatingEnvironmentOnly) {
      if (!state.flag_id) {
        toast.error('Flag ID is required for environment creation')
        return
      }

      const createEnvironmentPromise = async () => {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        
        const requestBody = {
          flag_id: state.flag_id,
          environment: state.environments.environment,
          description: state.rules.description,
          environments: {
            environment: state.environments.environment,
            value: wrapValue(state.environments.value?.value),
            default_value: wrapValue(state.environments.default_value?.value)
          },
          rules: {
            name: state.rules.name,
            description: state.rules.description,
            conditions: state.rules.conditions
          },
          rollout: {
            type: state.rollout.type,
            config: state.rollout.config
          }
        }

        console.log('Rollout page - Environment creation request body:', JSON.stringify(requestBody, null, 2))

        const response = await fetch(`/${BACKEND_URL}/flag/createEnvironment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('Environment created successfully:', result)
        return result
      }

      toast.promise(createEnvironmentPromise(), {
        loading: 'Creating environment...',
        success: () => {
          setTimeout(() => {
            router.push(`/flags`)
          }, 1500)
          return 'Environment created successfully! Redirecting...'
        },
        error: (err) => {
          console.error(err)
          return 'Failed to create environment. Please try again.'
        }
      })
    } else {
      // Original flag creation flow
      const createFlagPromise = async () => {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        console.log(state.environments.environment,state.environments.value);
        const requestBody = {
          name: state.name,
          key: state.key,
          description: state.description,
          flag_type: state.flag_type,
          environments: {
            environment: state.environments.environment,
            value: wrapValue(state.environments.value?.value),
            default_value: wrapValue(state.environments.default_value?.value)
          },
          rules: state.rules,
          rollout: state.rollout,
          tags: state.tags
        }

        console.log('Rollout page - Flag creation request body:', JSON.stringify(requestBody, null, 2))

        const response = await fetch(`/${BACKEND_URL}/flag/createFlag`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('Flag created successfully:', result)
        return result
      }

      toast.promise(createFlagPromise(), {
        loading: 'Creating your feature flag...',
        success: (flag_id) => {
          setTimeout(() => {
            router.push(`/flags`)
          }, 1500)
          return 'Feature flag created successfully! Redirecting...'
        },
        error: (err) => {
          console.error(err)
          return 'Failed to create feature flag. Please try again.'
        }
      })
    }
  }

  const handlePrevious = () => {
    // Preserve the flagKey parameter when navigating if in environment creation mode
    const flagKey = searchParams?.get('flagKey')
    if (state.isCreatingEnvironmentOnly && flagKey) {
      router.push(`/create-flag/rules?flagKey=${flagKey}`)
    } else {
      router.push('/create-flag/rules')
    }
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {state.isCreatingEnvironmentOnly ? 'Add Environment' : 'Rollout Strategy'}
                </h1>
                <p className="text-sm text-gray-600">
                  {state.isCreatingEnvironmentOnly ? 'Configure rollout for your new environment' : 'Step 4 of 4 - Final step to launch your flag'}
                </p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                <Check className="w-3 h-3" />
              </div>
              <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                <Check className="w-3 h-3" />
              </div>
              <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                <Check className="w-3 h-3" />
              </div>
              <div className="h-1 w-12 bg-purple-500 rounded-full"></div>
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                4
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="shadow-md border-gray-200 bg-white rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Rollout Configuration</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Define how your feature flag will be rolled out to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rollout Type */}
              <div className="space-y-2">
                <Label htmlFor="rollout-type" className="text-xs font-medium text-gray-700">Rollout Type *</Label>
                <Select value={state.rollout.type} onValueChange={handleRolloutTypeChange}>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm pl-3 pr-8">
                    <SelectValue placeholder="Select rollout type">
                      {state.rollout.type && (
                        <span className="text-gray-900">
                          {rolloutTypeOptions.find(option => option.value === state.rollout.type)?.label}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    {rolloutTypeOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="py-3 pl-3 pr-8 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex flex-col space-y-1">
                          <span className="font-medium text-gray-900 text-sm leading-tight">{option.label}</span>
                          <span className="text-xs text-gray-500 leading-tight">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Config */}
              {state.rollout.type && (
                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Configuration</h3>
                  {renderRolloutConfig()}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-sm"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Previous Step
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Button clicked - state.isCreatingEnvironmentOnly:', state.isCreatingEnvironmentOnly)
                    console.log('Full state:', state)
                    handleSubmit()
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-1.5 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  {state.isCreatingEnvironmentOnly ? 'Create Environment' : 'Create Flag'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
