"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import { ArrowRight, ArrowLeft, Plus, X, Target, Info, ChevronDown } from "lucide-react"
import { Toaster, toast } from 'react-hot-toast'

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
  const { state, updateRules } = useFlagCreation()
  const [customAttributeInputs, setCustomAttributeInputs] = useState<{ [key: number]: string }>({})
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
    setCustomAttributeInputs(prev => ({ ...prev, [index]: '' }))
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

  const handleCustomAttributeAdd = (index: number) => {
    const customValue = customAttributeInputs[index]?.trim()
    if (customValue) {
      // Check if it conflicts with base attributes
      if (Object.keys(BASE_ATTRIBUTES).includes(customValue)) {
        toast.error('Please use a different name. This attribute already exists as a base attribute.')
        return
      }
      handleAttributeNameChange(index, customValue)
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

  const handleValuesChange = (index: number, values: string[]) => {
    updateCondition(index, { attribute_values: values })
  }

  const validateAndFormatValue = (value: string, dataType: DataType): string | null => {
    const trimmedValue = value.trim()
    
    switch (dataType) {
      case 'DATE':
        // Validate DD/MM/YYYY format
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
        const dateMatch = trimmedValue.match(dateRegex)
        if (!dateMatch) {
          toast.error('Date must be in DD/MM/YYYY format')
          return null
        }
        // Additional validation to check if it's a valid date
        const day = dateMatch[1]!
        const month = dateMatch[2]!
        const year = dateMatch[3]!
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (date.getDate() !== parseInt(day) || 
            date.getMonth() !== parseInt(month) - 1 || 
            date.getFullYear() !== parseInt(year)) {
          toast.error('Please enter a valid date')
          return null
        }
        return trimmedValue
      
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
      
      case 'SEMVER':
        // Validate semantic version format (basic validation)
        const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-.]+)?(\+[a-zA-Z0-9-.]+)?$/
        if (!semverRegex.test(trimmedValue)) {
          toast.error('Please enter a valid semantic version (e.g., 1.0.0)')
          return null
        }
        return trimmedValue
      
      default:
        return trimmedValue
    }
  }

  const addValue = (conditionIndex: number, value: string) => {
    const condition = state.rules.conditions[conditionIndex]
    if (condition && value.trim()) {
      let newValues: string[] = []
      
      if (condition.attribute_type === 'ARRAY') {
        // For array type, split by comma and trim each value
        const arrayValues = value.split(',').map(v => v.trim()).filter(v => v.length > 0)
        const validatedValues = arrayValues.map(v => validateAndFormatValue(v, 'STRING')).filter(v => v !== null) as string[]
        const uniqueValues = [...new Set([...condition.attribute_values, ...validatedValues])]
        newValues = uniqueValues
      } else {
        // For non-array types, only allow single value and replace existing
        const validatedValue = validateAndFormatValue(value, condition.attribute_type)
        if (validatedValue !== null) {
          newValues = [validatedValue] // Replace with single value
        } else {
          return // Don't update if validation failed
        }
      }
      
      // Update the condition with new values
      updateCondition(conditionIndex, { attribute_values: newValues })
    }
  }

  const removeValue = (conditionIndex: number, valueIndex: number) => {
    const condition = state.rules.conditions[conditionIndex]
    if (condition) {
      const newValues = condition.attribute_values.filter((_, i) => i !== valueIndex)
      handleValuesChange(conditionIndex, newValues)
    }
  }

  const validateForm = () => {
    if (!state.rules.name.trim()) {
      toast.error('Rule name is required')
      return false
    }

    // Validate conditions
    for (const [index, condition] of state.rules.conditions.entries()) {
      if (!condition.attribute_name.trim()) {
        toast.error(`Attribute name is required for condition ${index + 1}`)
        return false
      }
      if (!condition.attribute_values || condition.attribute_values.length === 0) {
        toast.error(`At least one value is required for condition ${index + 1}`)
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (validateForm()) {
      router.push('/create-flag/rollout')
    }
  }

  const handlePrevious = () => {
    router.push('/create-flag/environments')
  }

  const getValuePlaceholder = (attributeType: DataType) => {
    switch (attributeType) {
      case 'ARRAY':
        return 'Enter values separated by commas (e.g., value1, value2, value3)'
      case 'NUMBER':
        return 'Enter a number value (e.g., 42)'
      case 'BOOLEAN':
        return 'Enter true or false'
      case 'DATE':
        return 'Enter date in DD/MM/YYYY format (e.g., 25/12/2023)'
      case 'SEMVER':
        return 'Enter semantic version (e.g., 1.0.0)'
      case 'STRING':
        return 'Enter a text value'
      default:
        return 'Enter a single value'
    }
  }

  const getValueHelperText = (attributeType: DataType) => {
    switch (attributeType) {
      case 'ARRAY':
        return 'Multiple values allowed - separate with commas'
      case 'DATE':
        return 'Must be in DD/MM/YYYY format'
      case 'BOOLEAN':
        return 'Only "true" or "false" allowed'
      case 'NUMBER':
        return 'Numeric values only'
      case 'SEMVER':
        return 'Must follow semantic versioning format'
      default:
        return 'Single value only - new entry replaces existing'
    }
  }

  return (
    <>
    <Toaster />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Feature Flag</h1>
              <p className="text-neutral-400">Step 3 of 4</p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">✓</div>
            <div className="h-1 w-16 bg-green-500"></div>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">✓</div>
            <div className="h-1 w-16 bg-orange-500"></div>
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium">3</div>
            <div className="h-1 w-16 bg-slate-700"></div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-medium">4</div>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
          <CardHeader>
            <CardTitle className="text-white">Targeting Rules</CardTitle>
            <CardDescription className="text-neutral-400">
              Define conditions that determine when your flag should be evaluated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label htmlFor="rule-name" className="text-white">Rule Name *</Label>
              <Input
                id="rule-name"
                value={state.rules.name}
                onChange={handleNameChange}
                placeholder="e.g., Premium Users Rule"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            {/* Rule Description */}
            <div className="space-y-2">
              <Label htmlFor="rule-description" className="text-white">Description (Optional)</Label>
              <Textarea
                id="rule-description"
                value={state.rules.description || ''}
                onChange={handleDescriptionChange}
                placeholder="Describe when this rule should apply..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
              />
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Conditions</Label>
                <Button
                  onClick={addCondition}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              {state.rules.conditions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conditions added yet.</p>
                  <p className="text-sm">Click "Add Condition" to define targeting rules.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.rules.conditions.map((condition, index) => (
                    <Card key={index} className="bg-slate-700/30 border-slate-600/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-white font-medium">Condition {index + 1}</h4>
                          <Button
                            onClick={() => removeCondition(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Attribute Name */}
                          <div className="space-y-2">
                            <Label className="text-white">Attribute Name</Label>
                            <div className="relative" ref={(el) => { dropdownRefs.current[index] = el }}>
                              <div className="flex">
                                <Input
                                  value={condition.attribute_name}
                                  onChange={(e) => {
                                    updateCondition(index, { attribute_name: e.target.value })
                                    setCustomAttributeInputs(prev => ({ ...prev, [index]: e.target.value }))
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isBaseAttribute(condition.attribute_name)) {
                                      e.preventDefault()
                                      handleCustomAttributeAdd(index)
                                    }
                                  }}
                                  placeholder="Type custom attribute or select from dropdown"
                                  className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 pr-10"
                                />
                                <Button
                                  type="button"
                                  onClick={() => toggleAttributeDropdown(index)}
                                  className="ml-2 bg-slate-600/50 border-slate-500 hover:bg-slate-500/50"
                                  size="sm"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              {/* Dropdown for base attributes */}
                              {showAttributeDropdowns[index] && (
                                <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                  <div className="p-2 text-xs text-slate-300 border-b border-slate-700">
                                    Base Attributes (Fixed Data Types)
                                  </div>
                                  {Object.entries(BASE_ATTRIBUTES).map(([key, attr]) => (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => handleAttributeNameChange(index, key)}
                                      className="w-full px-3 py-2 text-left text-white hover:bg-slate-700 focus:bg-slate-700 flex justify-between items-center"
                                    >
                                      <div>
                                        <div className="font-medium">{key}</div>
                                        <div className="text-xs text-slate-400">{attr.description}</div>
                                      </div>
                                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                                        {attr.type}
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Helper text */}
                            <div className="flex items-start space-x-2 text-xs text-slate-400">
                              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p>Use dropdown for base attributes (fixed types) or type custom names.</p>
                                <p className="text-amber-400">Note: Avoid naming custom attributes the same as existing base attributes.</p>
                              </div>
                            </div>
                          </div>

                          {/* Attribute Type */}
                          <div className="space-y-2">
                            <Label className="text-white">Data Type</Label>
                            <Select
                              value={condition.attribute_type}
                              onValueChange={(value) => handleAttributeTypeChange(index, value as DataType)}
                              disabled={isBaseAttribute(condition.attribute_name)}
                            >
                              <SelectTrigger className={`bg-slate-600/50 border-slate-500 text-white ${isBaseAttribute(condition.attribute_name) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {dataTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-white hover:bg-slate-700 focus:bg-slate-700"
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isBaseAttribute(condition.attribute_name) && (
                              <p className="text-xs text-slate-400">
                                Data type is fixed for base attributes
                              </p>
                            )}
                          </div>

                          {/* Operator */}
                          <div className="space-y-2">
                            <Label className="text-white">Operator</Label>
                            <Select
                              value={condition.operator_selected}
                              onValueChange={(value) => handleOperatorChange(index, value)}
                            >
                              <SelectTrigger className="bg-slate-600/50 border-slate-500 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {OPERATORS_BY_TYPE[condition.attribute_type].map((operator) => (
                                  <SelectItem
                                    key={operator}
                                    value={operator}
                                    className="text-white hover:bg-slate-700 focus:bg-slate-700"
                                  >
                                    {operator.replace(/_/g, ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Values */}
                          <div className="space-y-2">
                            <Label className="text-white">
                              {condition.attribute_type === 'ARRAY' ? 'Values' : 'Value'}
                            </Label>
                            <div className="space-y-2">
                              <Input
                                placeholder={getValuePlaceholder(condition.attribute_type)}
                                className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400"
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
                              <div className="flex items-center space-x-2 text-sm text-slate-400">
                                <Info className="w-4 h-4" />
                                <span>{getValueHelperText(condition.attribute_type)}</span>
                              </div>
                              {condition.attribute_values.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {condition.attribute_values.map((value, valueIndex) => (
                                    <Badge
                                      key={valueIndex}
                                      variant="secondary"
                                      className="bg-blue-900/50 text-blue-200 hover:bg-blue-900/70"
                                    >
                                      {value}
                                      <button
                                        onClick={() => removeValue(index, valueIndex)}
                                        className="ml-2 hover:bg-red-500/20 rounded-full p-0.5"
                                        title="Remove value"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Rules Note */}
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-1">Adding More Rules Later</p>
                  <p>You can add additional targeting rules later by navigating to the specific environment page where you want to apply more rules.</p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                onClick={handlePrevious}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8"
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