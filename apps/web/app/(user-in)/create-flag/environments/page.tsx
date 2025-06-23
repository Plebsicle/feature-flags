"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFlagCreation } from "../../../contexts/flag-creation"
import { environment_type } from '@repo/db/client'
import { ArrowRight, ArrowLeft, Server } from "lucide-react"
import { Toaster, toast } from "react-hot-toast"

// Types for API responses
interface EnvironmentResponse {
  id: string;
  environment: environment_type;
  value: any;
  default_value: any;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface EnvironmentData  {
  environmentData : EnvironmentResponse,
  flag_id: string;
  flag_type: any;
}


const environmentOptions = [
  { value: 'DEV', label: 'Development', description: 'Development environment' },
  { value: 'STAGING', label: 'Staging', description: 'Pre-production testing' },
  { value: 'PROD', label: 'Production', description: 'Live production environment' },
  { value: 'TEST', label: 'Test', description: 'Testing environment' },
] as const

export default function EnvironmentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, updateEnvironments, hydrateFromExistingFlag, setEnvironmentCreationMode } = useFlagCreation()
  const [existingEnvironments, setExistingEnvironments] = useState<EnvironmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check if we're in "add environment" mode
  const flagKey = searchParams?.get('flagKey')
  const isAddEnvironmentMode = Boolean(flagKey)

  // Handle existing flag hydration
  useEffect(() => {
    const flagKey = searchParams?.get('flagKey')
    
    // Only fetch and hydrate if flagKey exists and context is not already initialized
    if (flagKey && (!state.name || state.name.trim() === '')) {
      // Set environment creation mode
      setEnvironmentCreationMode(true)
      
      const fetchExistingFlag = async () => {
        setIsLoading(true)
        try {
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
          state.flag_id = flagKey;
          // Fetch flag metadata
          const flagResponse = await fetch(`${BACKEND_URL}/flag/getFeatureFlagData/${flagKey}`, {
            credentials: 'include'
          });
          if (!flagResponse.ok) {
            toast.error(`HTTP error! status: ${flagResponse.status}`)
            throw new Error(`HTTP error! status: ${flagResponse.status}`)
          }

          const flagData = await flagResponse.json()
          console.log('Flag data received:', flagData);
          
          // Fetch existing environments for this flag
          const envResponse = await fetch(`${BACKEND_URL}/flag/getFlagEnvironmentData/${flagKey}`, {
            credentials: 'include'
          })

          if (!envResponse.ok) {
            toast.error(`HTTP error! status: ${envResponse.status}`)
            throw new Error(`HTTP error! status: ${envResponse.status}`)
          }

          const apiResponse = await envResponse.json()
          console.log('Environment API response received:', apiResponse);
          console.log('Environment API response type:', typeof apiResponse);
          
          // Extract the actual environment data from the API response
          let environmentArray: EnvironmentResponse[] = []
          
          if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
            // API returns { data: [...], success: true, message: "..." }
            environmentArray = apiResponse.data.environmentData
            console.log('Extracted environment data from response.data:', environmentArray);
          }
          console.log('Processed environment array:', environmentArray);
          console.log('Environment types in array:', environmentArray.map(env => env.environment));
          
          // Hydrate the context with existing flag data, including flag_id
          hydrateFromExistingFlag({
            ...flagData,
            flag_id: flagKey,
            flag_type : apiResponse.data.flag_type
          });
          
          // state.flag_type = environmentArray[0]?.flag_type;
          // Store existing environments in local state
          setExistingEnvironments(environmentArray)
        } catch (error) {
          toast.error('Error fetching existing flag data')
          setExistingEnvironments([]) // Set to empty array on error
        } finally {
          setIsLoading(false)
        }
      }

      fetchExistingFlag()
    }
  }, [searchParams, state.name, hydrateFromExistingFlag, setEnvironmentCreationMode])

  const handleEnvironmentChange = (value: string) => {
    updateEnvironments({ environment: value as environment_type })
  }

  const handleValueChange = (field: 'value' | 'default_value', newValue: any) => {
    updateEnvironments({
      [field]: { value: newValue }
    })
  }

  const renderValueInput = (field: 'value' | 'default_value', label: string) => {
    const currentValue = field === 'value' ? state.environments.value.value : state.environments.default_value.value

    switch (state.flag_type) {
      case 'BOOLEAN':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentValue || false}
              onCheckedChange={(checked) => handleValueChange(field, checked)}
            />
            <Label className="text-white">{currentValue ? 'True' : 'False'}</Label>
          </div>
        )

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleValueChange(field, parseFloat(e.target.value) || 0)}
            placeholder="Enter number value"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
        )

      case 'STRING':
        return (
          <Input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            placeholder="Enter string value"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
        )

      case 'JSON':
      case 'AB_TEST':
      case 'MULTIVARIATE':
        return (
          <Textarea
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleValueChange(field, parsed)
              } catch {
                // Keep the raw string if JSON is invalid
                handleValueChange(field, e.target.value)
              }
            }}
            placeholder={`Enter JSON for ${state.flag_type.toLowerCase()}`}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[120px] font-mono text-sm"
          />
        )

      default:
        return (
          <Input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            placeholder="Enter value"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
        )
    }
  }

  const validateForm = () => {
    if (!state.environments.environment) {
      toast.error('Environment is required')
      return false
    }
    
    // Validate JSON for specific flag types
    if (['JSON', 'AB_TEST', 'MULTIVARIATE'].includes(state.flag_type)) {
      try {
        JSON.parse(typeof state.environments.value.value === 'string' ? state.environments.value.value : JSON.stringify(state.environments.value.value))
      } catch {
        toast.error('Invalid JSON format for value')
        return false
      }
      
      try {
        JSON.parse(typeof state.environments.default_value.value === 'string' ? state.environments.default_value.value : JSON.stringify(state.environments.default_value.value))
      } catch {
        toast.error('Invalid JSON format for default value')
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (validateForm()) {
      router.push('/create-flag/rules')
    }
  }

  const handlePrevious = () => {
    router.push('/create-flag/details')
  }

  // Extract used environments from the existing environments array
  const usedEnvironments = existingEnvironments
    .map(env => env.environment)
    .filter(env => env != null) // Remove any null/undefined values
  
  // console.log('Existing environments from API:', existingEnvironments)
  // console.log('Used environments extracted:', usedEnvironments)
  // console.log('All environment options:', environmentOptions.map(opt => opt.value))
  // console.log('isCreatingEnvironmentOnly:', state.isCreatingEnvironmentOnly)
  // console.log('isLoading:', isLoading)
  
  // Filter available environments based on what's already used
  const availableEnvironments = useMemo(() => {
    if (!state.isCreatingEnvironmentOnly || isLoading) {
      return environmentOptions
    }
    
    const filtered = environmentOptions.filter(option => {
      const isUsed = usedEnvironments.includes(option.value as environment_type)
      console.log(`Environment ${option.value} is used: ${isUsed}`)
      return !isUsed
    })
    
    console.log('Available environments after filtering:', filtered.map(opt => opt.value))
    return filtered
  }, [state.isCreatingEnvironmentOnly, isLoading, usedEnvironments])

  return (
    <>
    <Toaster />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {state.isCreatingEnvironmentOnly ? 'Add Environment' : 'Create Feature Flag'}
              </h1>
              <p className="text-neutral-400">
                {state.isCreatingEnvironmentOnly ? 'Configure a new environment for your feature flag' : 'Step 2 of 4'}
              </p>
            </div>
          </div>
          
          {/* Progress indicator */}
          {!state.isCreatingEnvironmentOnly && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">✓</div>
              <div className="h-1 w-16 bg-green-500"></div>
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">2</div>
              <div className="h-1 w-16 bg-slate-700"></div>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-medium">3</div>
              <div className="h-1 w-16 bg-slate-700"></div>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-medium">4</div>
            </div>
          )}
        </div>

        {/* Form */}
        <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
          <CardHeader>
            <CardTitle className="text-white">Environment Configuration</CardTitle>
            <CardDescription className="text-neutral-400">
              {state.isCreatingEnvironmentOnly 
                ? `Add a new environment configuration for your ${state.flag_type?.toLowerCase()} flag`
                : `Select an environment and configure values for your ${state.flag_type?.toLowerCase()} flag`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Environments Info (only in add environment mode) */}
            {state.isCreatingEnvironmentOnly && existingEnvironments.length > 0 && (
              <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
                <h3 className="text-white font-medium mb-2">Existing Environments</h3>
                <div className="flex flex-wrap gap-2">
                  {existingEnvironments.map((env) => (
                    <div key={env.id} className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full text-sm">
                      {environmentOptions.find(opt => opt.value === env.environment)?.label || env.environment}
                    </div>
                  ))}
                </div>
                <p className="text-slate-400 text-sm mt-2">
                  These environments are already configured for this feature flag.
                </p>
              </div>
            )}


            {/* Environment Selection */}
            <div className="space-y-2">
              <Label htmlFor="environment" className="text-white">Environment *</Label>
              {isLoading ? (
                <div className="bg-slate-700/50 border-slate-600 text-white p-3 rounded-md">
                  Loading available environments...
                </div>
              ) : availableEnvironments.length === 0 && state.isCreatingEnvironmentOnly ? (
                <div className="bg-amber-900/20 border-amber-600/30 text-amber-200 p-3 rounded-md">
                  All environments have been configured for this feature flag.
                  <div className="mt-2">
                    <Button 
                      onClick={() => router.back()}
                      variant="outline"
                      size="sm"
                      className="border-amber-600/50 text-amber-200 hover:bg-amber-900/30"
                    >
                      Go Back
                    </Button>
                  </div>
                </div>
              ) : (
                <Select value={state.environments.environment} onValueChange={handleEnvironmentChange}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {availableEnvironments.map((option) => (
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
              )}
            </div>

            {/* Flag Type Info */}
            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
              <h3 className="text-white font-medium mb-2">Flag Type: {state.flag_type}</h3>
              <p className="text-slate-400 text-sm">
                {state.flag_type === 'BOOLEAN' && 'Configure true/false values for this toggle flag.'}
                {state.flag_type === 'STRING' && 'Configure text values for this string flag.'}
                {state.flag_type === 'NUMBER' && 'Configure numeric values for this number flag.'}
                {state.flag_type === 'JSON' && 'Configure JSON objects for this complex flag.'}
                {state.flag_type === 'AB_TEST' && 'Configure variants for A/B testing.'}
                {state.flag_type === 'MULTIVARIATE' && 'Configure multiple variants for testing.'}
                {state.flag_type === 'KILL_SWITCH' && 'Configure emergency disable functionality.'}
              </p>
            </div>

            {/* Value Configuration - Only show if environment selection is available */}
            {availableEnvironments.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Value */}
                <div className="space-y-2">
                  <Label className="text-white">Value</Label>
                  {renderValueInput('value', 'Value')}
                  <p className="text-xs text-slate-400">The value returned when the flag is enabled</p>
                </div>

                {/* Default Value */}
                <div className="space-y-2">
                  <Label className="text-white">Default Value</Label>
                  {renderValueInput('default_value', 'Default Value')}
                  <p className="text-xs text-slate-400">The fallback value when the flag is disabled</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {!state.isCreatingEnvironmentOnly && (
                <Button 
                  onClick={handlePrevious}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              <Button 
                onClick={handleNext}
                disabled={availableEnvironments.length === 0}
                className={`bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-8 ${state.isCreatingEnvironmentOnly ? 'ml-auto' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}