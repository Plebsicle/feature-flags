"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useFlagCreation } from "../../../../contexts/flag-creation"
import { Condition } from '@repo/types/rule-config'
import { DataType, OPERATORS_BY_TYPE, BASE_ATTRIBUTES } from '@repo/types/attribute-config'
import { ArrowRight, ArrowLeft, Plus, X, Target, Info, ChevronDown, Check} from "lucide-react"
import { Toaster, toast } from 'react-hot-toast'
import * as semver from 'semver'
import { LightDateTimePicker } from '@/components/LightDateTimePicker'

const dataTypeOptions: { value: DataType; label: string }[] = [
  { value: 'STRING', label: 'String' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'DATE', label: 'Date' },
  { value: 'SEMVER', label: 'Semantic Version' },
  { value: 'ARRAY', label: 'Array' },
]

export default function RulesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, updateRules} = useFlagCreation()
  const [showAttributeDropdowns, setShowAttributeDropdowns] = useState<{ [key: number]: boolean }>({})
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(showAttributeDropdowns).forEach(([index, isOpen]) => {
        if (isOpen && dropdownRefs.current[parseInt(index)] && !dropdownRefs.current[parseInt(index)]?.contains(event.target as Node)) {
          setShowAttributeDropdowns(prev => ({ ...prev, [parseInt(index)]: false }))
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAttributeDropdowns])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRules({ name: e.target.value })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateRules({ description: e.target.value })
  }

  const addCondition = () => {
    const newCondition: Condition = {
      attribute_name: '',
      attribute_type: 'STRING',
      attribute_values: [],
      operator_selected: 'equals'
    }
    
    updateRules({
      conditions: [...state.rules.conditions, newCondition]
    })
  }

  const removeCondition = (index: number) => {
    const newConditions = state.rules.conditions.filter((_, i) => i !== index)
    updateRules({ conditions: newConditions })
  }

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = [...state.rules.conditions]
    if (newConditions[index]) {
      newConditions[index] = { ...newConditions[index], ...updates }
      updateRules({ conditions: newConditions })
    }
  }

  const handleAttributeNameChange = (index: number, value: string) => {
    // Check if it's a base attribute
    const isBaseAttribute = Object.keys(BASE_ATTRIBUTES).includes(value)
    
    if (isBaseAttribute) {
      // Set fixed data type for base attributes
      const baseAttrType = BASE_ATTRIBUTES[value as keyof typeof BASE_ATTRIBUTES].type as DataType
      const availableOperators = OPERATORS_BY_TYPE[baseAttrType]
      updateCondition(index, { 
        attribute_name: value,
        attribute_type: baseAttrType,
        operator_selected: availableOperators[0],
        attribute_values: []
      })
    } else {
      // For custom attributes, only update the name
      updateCondition(index, { attribute_name: value })
    }
    
    // Hide dropdown after selection
    setShowAttributeDropdowns(prev => ({ ...prev, [index]: false }))
  }

  const handleAttributeTypeChange = (index: number, value: DataType) => {
    // Reset operator when type changes
    const availableOperators = OPERATORS_BY_TYPE[value]
    const condition = state.rules.conditions[index]
    if (condition) {
      updateCondition(index, { 
        attribute_name: condition.attribute_name,
        attribute_type: value, 
        operator_selected: availableOperators[0],
        attribute_values: [] // Reset values when type changes
      })
    }
  }

  const toggleAttributeDropdown = (index: number) => {
    setShowAttributeDropdowns(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const isBaseAttribute = (attributeName: string) => {
    return Object.keys(BASE_ATTRIBUTES).includes(attributeName)
  }

  const handleOperatorChange = (index: number, value: string) => {
    updateCondition(index, { operator_selected: value })
  }

  const validateAndFormatValue = (value: string, dataType: DataType): string | null => {
    const trimmedValue = value.trim()
    
    switch (dataType) {
      case 'NUMBER':
        // Validate number format
        if (isNaN(Number(trimmedValue))) {
          toast.error('Please enter a valid number')
          return null
        }
        return trimmedValue
      
      case 'BOOLEAN':
        // Validate boolean format
        if (trimmedValue.toLowerCase() !== 'true' && trimmedValue.toLowerCase() !== 'false') {
          toast.error('Boolean value must be "true" or "false"')
          return null
        }
        return trimmedValue.toLowerCase()
      
      case 'DATE':
        // Basic date validation
        const dateValue = new Date(trimmedValue)
        if (isNaN(dateValue.getTime())) {
          toast.error('Please enter a valid date (YYYY-MM-DD or ISO string)')
          return null
        }
        return trimmedValue
      
      case 'SEMVER':
        // Validate semantic version format using semver library
        if (!semver.valid(trimmedValue)) {
          toast.error('Please enter a valid semantic version (e.g., 1.0.0)')
          return null
        }
        return trimmedValue
      
      case 'STRING':
      case 'ARRAY':
      default:
        return trimmedValue
    }
  }

  const addValue = (conditionIndex: number, value: string) => {
    const condition = state.rules.conditions[conditionIndex]
    if (!condition || !value.trim()) return

    // For non-array types, only allow one value
    if (condition.attribute_type !== 'ARRAY' && condition.attribute_values.length >= 1) {
      toast.error('Only one value is allowed for this data type. Remove the existing value first.')
      return
    }

    // Validate the value based on data type
    const validatedValue = validateAndFormatValue(value, condition.attribute_type)
    if (validatedValue === null) return

    let newValues: string[] = []
    
    if (condition.attribute_type === 'ARRAY') {
      // For array type, split by comma and trim each value
      const arrayValues = value.split(',').map(v => v.trim()).filter(v => v.length > 0)
      
      // Check for duplicates
      const existingValues = new Set(condition.attribute_values)
      const newUniqueValues = arrayValues.filter(val => !existingValues.has(val))
      
      if (newUniqueValues.length === 0) {
        toast.error('All values have already been added')
        return
      }
      
      newValues = [...condition.attribute_values, ...newUniqueValues]
    } else {
      // For other types, check for duplicates
      if (condition.attribute_values.includes(validatedValue)) {
        toast.error('This value has already been added')
        return
      }
      
      newValues = [validatedValue] // Replace existing value for non-array types
    }

    updateCondition(conditionIndex, { attribute_values: newValues })
  }

  const addDateValue = (conditionIndex: number, date: Date | undefined) => {
    if (!date) return
    
    const condition = state.rules.conditions[conditionIndex]
    if (!condition) return

    const dateString = date.toISOString()
    console.log('Rules page - Date selected:', date)
    console.log('Rules page - ISO string stored:', dateString)

    // For DATE, only allow one value (replace existing)
    const newValues = [dateString]
    updateCondition(conditionIndex, { attribute_values: newValues })
  }

  const removeValue = (conditionIndex: number, valueIndex: number) => {
    const condition = state.rules.conditions[conditionIndex]
    if (!condition) return

    const newValues = condition.attribute_values.filter((_, i) => i !== valueIndex)
    updateCondition(conditionIndex, { attribute_values: newValues })
  }

  const validateForm = () => {
    if (!state.rules.name.trim()) {
      toast.error('Rule name is required')
      return false
    }

    // Require at least one condition
    if (state.rules.conditions.length === 0) {
      toast.error('You need to add at least one condition')
      return false
    }

    for (const condition of state.rules.conditions) {
      if (!condition.attribute_name.trim()) {
        toast.error('All conditions must have an attribute name')
        return false
      }
      if (condition.attribute_values.length === 0) {
        toast.error('All conditions must have at least one value')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateForm()) {
      console.log('Rules page - Validation passed, rules data:', JSON.stringify(state.rules, null, 2))
      // Preserve the flagKey parameter when navigating if in environment creation mode
      const flagKey = searchParams?.get('flagKey')
      if (state.isCreatingEnvironmentOnly && flagKey) {
        router.push(`/create-flag/rollout?flagKey=${flagKey}`)
      } else {
        router.push('/create-flag/rollout')
      }
    }
  }

  const handlePrevious = () => {
    // Preserve the flagKey parameter when navigating if in environment creation mode
    const flagKey = searchParams?.get('flagKey')
    if (state.isCreatingEnvironmentOnly && flagKey) {
      router.push(`/create-flag/environments?flagKey=${flagKey}`)
    } else {
      router.push('/create-flag/environments')
    }
  }

  const getValuePlaceholder = (attributeType: DataType) => {
    switch (attributeType) {
      case 'STRING':
        return 'Enter text value (only one allowed)'
      case 'NUMBER':
        return 'Enter number (only one allowed)'
      case 'BOOLEAN':
        return 'Enter true or false (only one allowed)'
      case 'DATE':
        return 'Enter date (only one allowed)'
      case 'SEMVER':
        return 'Enter version e.g., 1.0.0 (only one allowed)'
      case 'ARRAY':
        return 'Enter values separated by commas (multiple allowed)'
      default:
        return 'Enter value'
    }
  }

  const getValueHelperText = (attributeType: DataType) => {
    switch (attributeType) {
      case 'STRING':
        return 'Press Enter to add text value (only one allowed)'
      case 'NUMBER':
        return 'Press Enter to add numeric value (only one allowed)'
      case 'BOOLEAN':
        return 'Enter "true" or "false", then press Enter (only one allowed)'
      case 'DATE':
        return 'Enter date format, then press Enter (only one allowed)'
      case 'SEMVER':
        return 'Use semantic versioning (e.g., 1.0.0), then press Enter (only one allowed)'
      case 'ARRAY':
        return 'Press Enter to add values, comma-separated for multiple (multiple allowed)'
      default:
        return 'Press Enter to add value'
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Targeting Rules</h1>
                <p className="text-sm text-gray-600">Step 3 of 4 - Define who sees this flag</p>
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
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                3
              </div>
              <div className="h-1 w-12 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
                4
              </div>
            </div>
          </div>

          {/* Evaluation Logic Info */}
          <Card className="bg-blue-50 border border-blue-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Rule Evaluation Logic
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Understanding how targeting rules are evaluated
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mr-2 text-xs">AND</Badge>
                    Within Rules
                  </h4>
                  <p className="text-xs text-gray-600">
                    All conditions within a single rule must be true for that rule to match
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 mr-2 text-xs">OR</Badge>
                    Between Rules
                  </h4>
                  <p className="text-xs text-gray-600">
                    If any rule matches, the feature flag will be enabled for that user
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card className="shadow-md border-gray-200 bg-white rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Targeting Rules</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Define conditions to determine when this feature flag should be enabled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rule Name */}
              <div className="space-y-1">
                <Label htmlFor="rule-name" className="text-sm font-medium text-gray-700">
                  Rule Name *
                </Label>
                <Input
                  id="rule-name"
                  value={state.rules.name}
                  onChange={handleNameChange}
                  placeholder="e.g., Premium Users Only"
                  className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Rule Description */}
              <div className="space-y-1">
                <Label htmlFor="rule-description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="rule-description"
                  value={state.rules.description}
                  onChange={handleDescriptionChange}
                  placeholder="Describe the purpose of this targeting rule..."
                  className="min-h-[60px] border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none text-sm"
                />
              </div>

              {/* Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-gray-900">Conditions</Label>
                  <Button
                    onClick={addCondition}
                    size="sm"
                    variant="outline"
                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 h-7 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Condition
                  </Button>
                </div>

                {state.rules.conditions.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium mb-1 text-sm">No conditions defined</p>
                    <p className="text-gray-500 text-xs mb-3">Add conditions to control when this flag is enabled</p>
                    <Button
                      onClick={addCondition}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add First Condition
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.rules.conditions.map((condition, index) => (
                      <Card key={index} className="border-gray-200 shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-gray-900">
                              Condition {index + 1}
                            </CardTitle>
                            <Button
                              onClick={() => removeCondition(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Attribute Name */}
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Attribute Name *</Label>
                            <div className="relative" ref={(el) => { dropdownRefs.current[index] = el }}>
                              <div className="flex">
                                <Input
                                  value={condition.attribute_name}
                                  onChange={(e) => {
                                    handleAttributeNameChange(index, e.target.value)
                                  }}
                                  placeholder="Type custom attribute or select from dropdown"
                                  className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                />
                                <Button
                                  type="button"
                                  onClick={() => toggleAttributeDropdown(index)}
                                  className="ml-1 bg-gray-100 border-gray-300 hover:bg-gray-200 h-8 w-8 p-0"
                                  size="sm"
                                >
                                  <ChevronDown className="w-3 h-3 text-gray-600" />
                                </Button>
                              </div>
                              
                              {/* Dropdown for base attributes */}
                              {showAttributeDropdowns[index] && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  <div className="p-2 text-xs text-gray-600 border-b border-gray-100 bg-gray-50">
                                    Base Attributes (Fixed Data Types)
                                  </div>
                                  {Object.entries(BASE_ATTRIBUTES).map(([key, attr]) => (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => handleAttributeNameChange(index, key)}
                                      className="w-full px-2 py-1.5 text-left text-gray-900 hover:bg-gray-50 focus:bg-gray-50 flex justify-between items-center text-xs"
                                    >
                                      <div>
                                        <div className="font-medium">{key}</div>
                                        <div className="text-xs text-gray-500">{attr.description}</div>
                                      </div>
                                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                                        {attr.type}
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Helper text */}
                            <div className="flex items-start space-x-1 text-xs text-gray-500">
                              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p>Use dropdown for base attributes (fixed types) or type custom names.</p>
                                <p className="text-amber-600">Note: Avoid naming custom attributes the same as existing base attributes.</p>
                              </div>
                            </div>
                          </div>

                          {/* Attribute Type */}
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Data Type</Label>
                            <Select
                              value={condition.attribute_type}
                              onValueChange={(value) => handleAttributeTypeChange(index, value as DataType)}
                              disabled={isBaseAttribute(condition.attribute_name)}
                            >
                              <SelectTrigger className={`h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm ${isBaseAttribute(condition.attribute_name) ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200 shadow-lg">
                                {dataTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="py-1.5 px-2 hover:bg-gray-50 focus:bg-gray-50 text-sm"
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isBaseAttribute(condition.attribute_name) && (
                              <p className="text-xs text-gray-500">
                                Data type is fixed for base attributes
                              </p>
                            )}
                          </div>

                          {/* Operator */}
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Operator</Label>
                            <Select
                              value={condition.operator_selected}
                              onValueChange={(value) => handleOperatorChange(index, value)}
                            >
                              <SelectTrigger className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200 shadow-lg">
                                {OPERATORS_BY_TYPE[condition.attribute_type].map((operator) => (
                                  <SelectItem
                                    key={operator}
                                    value={operator}
                                    className="py-1.5 px-2 hover:bg-gray-50 focus:bg-gray-50 text-sm"
                                  >
                                    {operator.replace(/_/g, ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Values */}
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">
                              {condition.attribute_type === 'ARRAY' ? 'Values' : 'Value'}
                            </Label>
                            <div className="space-y-2">
                              {condition.attribute_type === 'DATE' ? (
                                <LightDateTimePicker
                                  value={undefined}
                                  onChange={(date: Date | undefined) => addDateValue(index, date)}
                                  placeholder={getValuePlaceholder(condition.attribute_type)}
                                  className="w-full h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm bg-white rounded-md"
                                />
                              ) : (
                                <Input
                                  placeholder={getValuePlaceholder(condition.attribute_type)}
                                  className="h-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      const input = e.target as HTMLInputElement
                                      if (input.value.trim()) {
                                        addValue(index, input.value)
                                        input.value = ''
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Also add value on blur (when user clicks away)
                                    const input = e.target as HTMLInputElement
                                    if (input.value.trim()) {
                                      addValue(index, input.value)
                                      input.value = ''
                                    }
                                  }}
                                />
                              )}
                              {condition.attribute_type === 'ARRAY' ? (
                                <div className="flex items-center space-x-1 text-xs text-indigo-600 bg-indigo-50 p-2 rounded">
                                  <Info className="w-3 h-3" />
                                  <span>{getValueHelperText(condition.attribute_type)}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                  <Info className="w-3 h-3" />
                                  <span>{getValueHelperText(condition.attribute_type)}</span>
                                </div>
                              )}
                              {condition.attribute_values.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {condition.attribute_values.map((value, valueIndex) => (
                                    <Badge
                                      key={valueIndex}
                                      variant="secondary"
                                      className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-2 py-0.5 text-xs"
                                    >
                                      {value}
                                      <button
                                        onClick={() => removeValue(index, valueIndex)}
                                        className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                        title="Remove value"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Rules Note */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-cyan-800">
                    <p className="font-medium mb-1">Adding More Rules Later</p>
                    <p>You can add additional targeting rules later by navigating to the specific environment page where you want to apply more rules.</p>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <Button 
                  onClick={handlePrevious}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-sm"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Previous
                </Button>
                
                <Button 
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 font-medium rounded-md shadow-sm transition-all duration-200 hover:shadow-md text-sm"
                >
                  Next Step
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}