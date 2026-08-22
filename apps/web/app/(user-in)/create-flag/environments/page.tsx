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
import { useFlagCreation } from "../../../../contexts/flag-creation"
import { environment_type } from '@repo/db/client'
import { ABValue} from '@repo/types/value-config'
import { ArrowRight, ArrowLeft, Server, Plus, Minus, Info, Check } from "@/components/ui/icons"
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

// Types for variants
interface Variant {
  name: string;
  value: any;
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
  
  // State for variant management
  const [variants, setVariants] = useState<Variant[]>([
    { name: 'Variant A', value: '' },
    { name: 'Variant B', value: '' }
  ])
  const [defaultValue, setDefaultValue] = useState<string>('')


  // Handle existing flag hydration
  useEffect(() => {
    const flagKey = searchParams?.get('flagKey')
    
    // Only fetch and hydrate if flagKey exists and context is not already initialized
    if (flagKey && (!state.name || state.name.trim() === '')) {
      // Set environment creation mode
      // console.log('Environments page - Setting environment creation mode to true for flagKey:', flagKey)
      setEnvironmentCreationMode(true)
      hydrateFromExistingFlag({ flag_id: flagKey })
      
      const fetchExistingFlag = async () => {
        setIsLoading(true)
        try {
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
          // Fetch flag metadata
          const flagResponse = await fetch(`${BACKEND_URL}/flag/getFeatureFlagData/${flagKey}`, {
            credentials: 'include'
          });
          if (!flagResponse.ok) {
            toast.error(`HTTP error! status: ${flagResponse.status}`)
            throw new Error(`HTTP error! status: ${flagResponse.status}`)
          }

          const flagData = await flagResponse.json()
          // console.log('Flag data received:', flagData);
          
          // Fetch existing environments for this flag
          const envResponse = await fetch(`${BACKEND_URL}/flag/getFlagEnvironmentData/${flagKey}`, {
            credentials: 'include'
          })

          if (!envResponse.ok) {
            toast.error(`HTTP error! status: ${envResponse.status}`)
            throw new Error(`HTTP error! status: ${envResponse.status}`)
          }

          const apiResponse = await envResponse.json()
          // console.log('Environment API response received:', apiResponse);
          // console.log('Environment API response type:', typeof apiResponse);
          
          // Extract the actual environment data from the API response
          let environmentArray: EnvironmentResponse[] = []
          
          if (apiResponse && apiResponse.data && apiResponse.data.environmentData && Array.isArray(apiResponse.data.environmentData)) {
            // API returns { data: { environmentData: [...], flag_id: ..., flag_type: ... }, success: true, message: "..." }
            environmentArray = apiResponse.data.environmentData
            // console.log('Extracted environment data from response.data.environmentData:', environmentArray);
          } else if (apiResponse && Array.isArray(apiResponse.data)) {
            // Fallback: if data is directly an array
            environmentArray = apiResponse.data
            // console.log('Extracted environment data from response.data (direct array):', environmentArray);
          } else {
            // console.warn('Unexpected API response structure:', apiResponse);
          }
          // console.log('Processed environment array:', environmentArray);
          // console.log('Environment types in array:', environmentArray.map(env => env.environment));
          
          // Hydrate the context with existing flag data, including flag_id
          hydrateFromExistingFlag({
            ...flagData,
            flag_id: flagKey,
            flag_type : apiResponse.data.flag_type
          });
          
          // state.flag_type = environmentArray[0]?.flag_type;
          // Store existing environments in local state
          setExistingEnvironments(environmentArray)
        } catch (error) { // console.error(error);
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

  // Value validation based on flag type
  const validateValueByType = (value: string, flagType: string): { isValid: boolean; parsedValue?: any; error?: string } => {
    const trimmedValue = value.trim()
    
    switch (flagType) {
      case 'NUMBER':
        if (trimmedValue === '') return { isValid: false, error: 'Number value is required' }
        if (isNaN(Number(trimmedValue))) return { isValid: false, error: 'Please enter a valid number' }
        return { isValid: true, parsedValue: Number(trimmedValue) }
      
      case 'BOOLEAN':
        if (trimmedValue.toLowerCase() !== 'true' && trimmedValue.toLowerCase() !== 'false') {
          return { isValid: false, error: 'Boolean value must be "true" or "false"' }
        }
        return { isValid: true, parsedValue: trimmedValue.toLowerCase() === 'true' }
      
      case 'JSON':
        if (trimmedValue === '') return { isValid: false, error: 'JSON value is required' }
        try {
          const parsed = JSON.parse(trimmedValue)
          return { isValid: true, parsedValue: parsed }
        } catch {
          return { isValid: false, error: 'Please enter valid JSON format' }
        }
      
      case 'AB_TEST':
      case 'MULTIVARIATE':
        if (trimmedValue === '') return { isValid: false, error: 'Value is required' }
        // Allow any value type for AB_TEST and MULTIVARIATE
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(trimmedValue)
          return { isValid: true, parsedValue: parsed }
        } catch {
          // If not valid JSON, try to parse as number or boolean
          if (trimmedValue.toLowerCase() === 'true') {
            return { isValid: true, parsedValue: true }
          } else if (trimmedValue.toLowerCase() === 'false') {
            return { isValid: true, parsedValue: false }
          } else if (!isNaN(Number(trimmedValue))) {
            return { isValid: true, parsedValue: Number(trimmedValue) }
          } else {
            // Otherwise treat as string
            return { isValid: true, parsedValue: trimmedValue }
          }
        }
      
      case 'STRING':
      default:
        return { isValid: true, parsedValue: trimmedValue }
    }
  }

  // New handlers for variant management
  const handleVariantChange = (index: number, field: 'name' | 'value', newValue: string) => {
    const updatedVariants = [...variants]
    const currentVariant = updatedVariants[index]
    if (currentVariant) {
      updatedVariants[index] = { 
        name: currentVariant.name,
        value: currentVariant.value,
        [field]: newValue 
      }
    }
    setVariants(updatedVariants)
    
    // Update the context based on flag type - for AB/Multivariate, accept any value type
    if (state.flag_type === 'AB_TEST' || state.flag_type === 'MULTIVARIATE') {
      const abValue: ABValue = {}
      updatedVariants.forEach(variant => {
        if (variant.name && variant.value !== undefined && variant.value !== '') {
          // Try to parse as JSON first to allow complex values
          try {
            const parsedValue = JSON.parse(variant.value)
            abValue[variant.name] = parsedValue
          } catch {
            // If not valid JSON, try to parse as number or boolean
            if (variant.value.toLowerCase() === 'true') {
              abValue[variant.name] = true
            } else if (variant.value.toLowerCase() === 'false') {
              abValue[variant.name] = false
            } else if (!isNaN(Number(variant.value))) {
              abValue[variant.name] = Number(variant.value)
            } else {
              // Otherwise treat as string
              abValue[variant.name] = variant.value
            }
          }
        }
      })
      handleValueChange('value', abValue)
    }
  }

  const addVariant = () => {
    // Prevent adding variants for AB_TEST (must have exactly 2 variants)
    if (state.flag_type === 'AB_TEST') {
      toast.error('A/B tests can only have exactly 2 variants')
      return
    }
    
    setVariants([...variants, { name: `Variant ${String.fromCharCode(65 + variants.length)}`, value: '' }])
  }

  const removeVariant = (index: number) => {
    // Prevent removal for AB_TEST (must have exactly 2 variants)
    if (state.flag_type === 'AB_TEST') {
      toast.error('A/B tests must have exactly 2 variants')
      return
    }
    
    // For MULTIVARIATE, allow removal if more than 2 variants
    if (variants.length > 2) {
      const newVariants = variants.filter((_, i) => i !== index)
      setVariants(newVariants)
      
      // Update context after removal
      if (state.flag_type === 'MULTIVARIATE') {
        const abValue: ABValue = {}
        newVariants.forEach(variant => {
          if (variant.name && variant.value !== undefined && variant.value !== '') {
            // Try to parse as JSON first to allow complex values
            try {
              const parsedValue = JSON.parse(variant.value)
              abValue[variant.name] = parsedValue
            } catch {
              // If not valid JSON, try to parse as number or boolean
              if (variant.value.toLowerCase() === 'true') {
                abValue[variant.name] = true
              } else if (variant.value.toLowerCase() === 'false') {
                abValue[variant.name] = false
              } else if (!isNaN(Number(variant.value))) {
                abValue[variant.name] = Number(variant.value)
              } else {
                // Otherwise treat as string
                abValue[variant.name] = variant.value
              }
            }
          }
        })
        handleValueChange('value', abValue)
      }
    } else {
      toast.error('At least 2 variants are required')
    }
  }

  const handleDefaultValueChange = (newValue: string) => {
    setDefaultValue(newValue)
    
    // Only validate and parse if the value is not empty
    if (newValue.trim() === '') {
      handleValueChange('default_value', '')
      return
    }
    
    // Validate and parse the value based on flag type
    const validation = validateValueByType(newValue, state.flag_type)
    if (validation.isValid) {
      handleValueChange('default_value', validation.parsedValue)
    } else {
      // For invalid values, still store the raw value but show error on form submission
      handleValueChange('default_value', newValue)
    }
  }

  const renderVariantConfiguration = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">Variants</Label>
          {state.flag_type === 'MULTIVARIATE' && (
            <Button
              onClick={addVariant}
              size="sm"
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary h-8 px-3 text-xs font-medium rounded-md"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          )}
        </div>
        
        {/* Variant restrictions info */}
        <div className={`p-3 rounded-lg border text-sm ${
          state.flag_type === 'AB_TEST' 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
            : 'bg-primary/10 border-primary/30 text-primary'
        }`}>
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <div>
              {state.flag_type === 'AB_TEST' ? (
                <p><strong>A/B Test:</strong> Must have exactly 2 variants (A and B). Adding or removing variants is not allowed.</p>
              ) : (
                <p><strong>Multivariate Test:</strong> Can have multiple variants. You can add or remove variants as needed (minimum 2 required).</p>
              )}
            </div>
          </div>
        </div>
        
        {variants.map((variant, index) => (
          <div key={index} className="p-3 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-foreground text-sm">Variant {String.fromCharCode(65 + index)}</h4>
              {state.flag_type === 'MULTIVARIATE' && variants.length > 2 && (
                <Button
                  onClick={() => removeVariant(index)}
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0 rounded-md"
                >
                  <Minus className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                <Input
                  value={variant.name}
                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                  placeholder="Variant name"
                  className="h-8 border-border bg-background rounded-md text-sm focus:border-primary"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Value</Label>
                {(state.flag_type === 'AB_TEST' || state.flag_type === 'MULTIVARIATE') ? (
                  <Textarea
                    value={variant.value}
                    onChange={(e) => handleVariantChange(index, 'value', e.target.value)}
                    placeholder='Enter any value: "string", 123, true, or {"key": "value"}'
                    className="h-16 text-sm border-border bg-background rounded-md focus:border-primary resize-none"
                  />
                ) : (
                  <Input
                    value={variant.value}
                    onChange={(e) => handleVariantChange(index, 'value', e.target.value)}
                    placeholder="Variant value"
                    className="h-8 border-border bg-background rounded-md text-sm focus:border-primary"
                  />
                )}
                {(state.flag_type === 'AB_TEST' || state.flag_type === 'MULTIVARIATE') && (
                  <p className="text-xs text-muted-foreground">
                    Enter any value - strings, numbers, booleans, or JSON for complex data structures
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderValueInput = (field: 'value' | 'default_value') => {
    if (['AB_TEST', 'MULTIVARIATE'].includes(state.flag_type)) {
      if (field === 'value') {
        return renderVariantConfiguration()
      } else {
        // Default value for AB/Multivariate tests
        return (
          <div className="space-y-1">
            <Input
              value={defaultValue}
              onChange={(e) => handleDefaultValueChange(e.target.value)}
              placeholder="Default fallback value"
              className="h-9 border-border bg-background rounded-md text-sm focus:border-primary"
            />
          </div>
        )
      }
    }

    const currentValue = field === 'value' ? state.environments.value?.value : state.environments.default_value?.value

    // Handle different input types based on flag type
    switch (state.flag_type) {
      case 'BOOLEAN':
        return (
          <div className="flex items-center space-x-3">
            <Switch
              checked={currentValue === true}
              onCheckedChange={(checked) => handleValueChange(field, checked)}
              className="data-[state=checked]:bg-primary rounded-full"
            />
            <Label className="text-sm font-medium text-foreground">
              {currentValue === true ? 'True' : 'False'}
            </Label>
          </div>
        )

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleValueChange(field, Number(e.target.value) || 0)}
            placeholder="Enter a number"
            className="h-9 border-border bg-background rounded-md text-sm focus:border-primary"
          />
        )

      case 'JSON':
        return (
          <Textarea
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleValueChange(field, parsed)
              } catch {
                handleValueChange(field, e.target.value)
              }
            }}
            placeholder='{"key": "value"}'
            className="min-h-[80px] text-sm border-border bg-background rounded-md focus:border-primary resize-none"
          />
        )

      case 'STRING':
      default:
        return (
          <Input
            value={currentValue || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            placeholder="Enter a string value"
            className="h-9 border-border bg-background rounded-md text-sm focus:border-primary"
          />
        )
    }
  }

  const validateForm = () => {
    if (!state.environments.environment) {
      toast.error('Environment is required')
      return false
    }

    // For AB_TEST and MULTIVARIATE, check that all variants have names and values
    if (state.flag_type === 'AB_TEST' || state.flag_type === 'MULTIVARIATE') {
      const emptyVariants = variants.filter(v => !v.name.trim() || !v.value.toString().trim())
      if (emptyVariants.length > 0) {
        toast.error('All variants must have names and values')
        return false
      }
      
      // Variants can have any value type, no validation needed
      for (const variant of variants) {
        if (!variant.value.trim()) {
          toast.error(`Variant "${variant.name}" must have a value.`)
          return false
        }
      }
      
      // Check for duplicate variant names
      const variantNames = variants.map(v => v.name.trim().toLowerCase())
      const uniqueNames = new Set(variantNames)
      if (uniqueNames.size !== variantNames.length) {
        toast.error('Variant names must be unique')
        return false
      }
      
      // For AB_TEST, ensure exactly 2 variants
      if (state.flag_type === 'AB_TEST' && variants.length !== 2) {
        toast.error('A/B tests must have exactly 2 variants')
        return false
      }
    } else {
      // For other flag types, check that value is provided and valid
      const currentValue = state.environments.value?.value
      if (currentValue === undefined || currentValue === '') {
        toast.error('Value is required')
        return false
      }
      
      // Validate the current value based on flag type
      const valueStr = typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue)
      const validation = validateValueByType(valueStr, state.flag_type)
      if (!validation.isValid) {
        toast.error(`Invalid value: ${validation.error}`)
        return false
      }
    }

    // Validate default value if provided
    if (defaultValue.trim()) {
      const validation = validateValueByType(defaultValue, state.flag_type)
      if (!validation.isValid) {
        toast.error(`Invalid default value: ${validation.error}`)
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateForm()) {
      // Preserve the flagKey parameter when navigating if in environment creation mode
      // console.log(state);
      if (state.isCreatingEnvironmentOnly && state.flag_id) {
        router.push(`/create-flag/rules?flagKey=${state.flag_id}`)
      } else {
        router.push('/create-flag/rules')
      }
    }
  }

  const handlePrevious = () => {
    router.push('/create-flag/details')
  }

  // Extract used environments from the existing environments array
  const usedEnvironments = existingEnvironments
    .map(env => env.environment)
    .filter(env => env != null && env !== undefined) // Remove any null/undefined values
  
  // console.log('Existing environments from API:', existingEnvironments)
  // console.log('Used environments extracted:', usedEnvironments)
  // console.log('All environment options:', environmentOptions.map(opt => opt.value))
  // console.log('isCreatingEnvironmentOnly:', state.isCreatingEnvironmentOnly)
  // console.log('Flag Id',state.flag_id);
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
    
    // console.log('Available environments after filtering:', filtered.map(opt => opt.value))
    return filtered
  }, [state.isCreatingEnvironmentOnly, isLoading, usedEnvironments])

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-transparent p-4 lg:p-6 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {state.isCreatingEnvironmentOnly ? 'Add Environment' : 'Environment Configuration'}
                </h1>
                <p className="text-sm font-medium text-muted-foreground">
                  {state.isCreatingEnvironmentOnly ? 'Configure a new environment for your feature flag' : 'Step 2 of 4 - Configure environment settings'}
                </p>
              </div>
            </div>
            
            {/* Progress indicator */}
            {!state.isCreatingEnvironmentOnly && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary">
                  <Check className="w-4 h-4" />
                </div>
                <div className="h-0.5 w-16 bg-primary/50"></div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  2
                </div>
                <div className="h-0.5 w-16 bg-border"></div>
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground text-sm font-medium">
                  3
                </div>
                <div className="h-0.5 w-16 bg-border"></div>
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground text-sm font-medium">
                  4
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-xl font-semibold text-foreground">Environment Configuration</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {state.isCreatingEnvironmentOnly 
                  ? `Add a new environment configuration for your ${state.flag_type?.toLowerCase()} flag`
                  : `Select an environment and configure values for your ${state.flag_type?.toLowerCase()} flag`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Existing Environments Info (only in add environment mode) */}
              {state.isCreatingEnvironmentOnly && existingEnvironments.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground text-sm mb-2">Existing Environments</h3>
                  <div className="flex flex-wrap gap-2">
                    {existingEnvironments.map((env) => (
                      <div key={env.id} className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-md text-xs font-medium">
                        {environmentOptions.find(opt => opt.value === env.environment)?.label || env.environment}
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs mt-2">
                    These environments are already configured for this feature flag.
                  </p>
                </div>
              )}

              {/* Environment Selection */}
              <div className="space-y-2">
                <Label htmlFor="environment" className="text-sm font-medium text-foreground">Environment *</Label>
                {isLoading ? (
                  <div className="bg-muted border border-border text-muted-foreground p-3 rounded-lg text-sm">
                    Loading available environments...
                  </div>
                ) : availableEnvironments.length === 0 && state.isCreatingEnvironmentOnly ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-4 rounded-lg">
                    <p className="text-sm font-medium">All environments have been configured for this feature flag.</p>
                    <div className="mt-3">
                      <Button 
                        onClick={() => router.back()}
                        variant="outline"
                        size="sm"
                        className="border-dashed hover:border-solid transition-all text-xs h-9 rounded-md font-medium"
                      >
                        Go Back
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select value={state.environments.environment} onValueChange={handleEnvironmentChange}>
                    <SelectTrigger className="h-10 border-border rounded-lg bg-background text-sm focus:border-primary">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-lg shadow-sm text-sm">
                      {availableEnvironments.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="py-2 pl-3 pr-8 hover:bg-muted focus:bg-muted cursor-pointer rounded-md"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Flag Type Info */}
              <div className="bg-muted/50 border border-border p-4 rounded-lg">
                <h3 className="font-semibold text-foreground text-sm mb-1">Flag Type: {state.flag_type}</h3>
                <p className="text-muted-foreground text-sm">
                  {state.flag_type === 'BOOLEAN' && 'Configure true/false values for this toggle flag.'}
                  {state.flag_type === 'STRING' && 'Configure text values for this string flag.'}
                  {state.flag_type === 'NUMBER' && 'Configure numeric values for this number flag.'}
                  {state.flag_type === 'JSON' && 'Configure JSON objects for this complex flag.'}
                  {state.flag_type === 'AB_TEST' && 'Configure exactly two variants (A and B) for A/B testing.'}
                  {state.flag_type === 'MULTIVARIATE' && 'Configure multiple variants for multivariate testing.'}
                </p>
              </div>

              {/* Value Configuration - Only show if environment selection is available */}
              {availableEnvironments.length > 0 && (
                <div className="space-y-6">
                  {/* Value Configuration */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Value Configuration</Label>
                    {renderValueInput('value')}
                    {!['AB_TEST', 'MULTIVARIATE'].includes(state.flag_type) && (
                      <p className="text-xs text-muted-foreground">The value returned when the flag is enabled</p>
                    )}
                  </div>

                  {/* Default Value - Always available */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Default Value</Label>
                    {renderValueInput('default_value')}
                    <p className="text-xs text-muted-foreground">
                      The fallback value when the flag is disabled or when an error occurs
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Environments Note */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">Adding More Environments Later</p>
                    <p>You can add additional environments later by navigating to the specific flag page where you want to configure more environments.</p>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-border/50">
                {!state.isCreatingEnvironmentOnly && (
                  <Button 
                    onClick={handlePrevious}
                    variant="outline"
                    className="border-dashed hover:border-solid transition-all text-sm h-10 rounded-lg font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                
                <Button 
                  onClick={handleNext}
                  disabled={availableEnvironments.length === 0}
                  className={`font-medium text-sm h-10 rounded-lg ${state.isCreatingEnvironmentOnly ? 'ml-auto' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
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