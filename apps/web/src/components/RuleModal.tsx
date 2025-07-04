"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Condition } from '@repo/types/rule-config'
import { DataType, OPERATORS_BY_TYPE, BASE_ATTRIBUTES } from '@repo/types/attribute-config'
import { Plus, X, Target, Info, Edit, Save, Loader2, ChevronDown } from "lucide-react"
import { Toaster, toast } from 'react-hot-toast'
import * as semver from 'semver'
import { LightDateTimePicker } from './LightDateTimePicker'

interface RuleData {
  name: string;
  id: string;
  created_at: Date;
  updated_at: Date;
  description: string | null;
  flag_environment_id: string;
  is_enabled: boolean;
  conditions: Condition[]; // JsonValue from Prisma
}

interface RuleModalProps {
  mode: 'create' | 'edit';
  environmentId: string;
  existingRule?: RuleData;
  flagRuleId? : string
}

const dataTypeOptions: { value: DataType; label: string }[] = [
  { value: 'STRING', label: 'String' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'DATE', label: 'Date' },
  { value: 'SEMVER', label: 'Semantic Version' },
  { value: 'ARRAY', label: 'Array' },
]

export default function RuleModal({ mode, environmentId, existingRule }: RuleModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAttributeDropdowns, setShowAttributeDropdowns] = useState<{ [key: number]: boolean }>({})
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Form state
  const [ruleName, setRuleName] = useState('')
  const [ruleDescription, setRuleDescription] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [conditions, setConditions] = useState<Condition[]>([])

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

  // Initialize form with existing rule data if editing
  useEffect(() => {
    if (mode === 'edit' && existingRule) {
      setRuleName(existingRule.name)
      setRuleDescription(existingRule.description || '')
      setIsEnabled(existingRule.is_enabled)
      
      // Parse conditions from the existing rule
      let parsedConditions: Condition[] = []
      if (existingRule.conditions) {
        try {
          if (Array.isArray(existingRule.conditions)) {
            parsedConditions = existingRule.conditions
          } else if (typeof existingRule.conditions === 'object') {
            // If it's a single object, wrap it in an array
            parsedConditions = [existingRule.conditions]
          }
        } catch (error) {
          // console.error('Error parsing conditions:', error)
          parsedConditions = []
        }
      }
      setConditions(parsedConditions)
    } else {
      // Reset form for create mode
      setRuleName('')
      setRuleDescription('')
      setIsEnabled(true)
      setConditions([])
    }
  }, [mode, existingRule, open])

  const addCondition = () => {
    const newCondition: Condition = {
      attribute_name: '',
      attribute_type: 'STRING',
      attribute_values: [],
      operator_selected: 'equals'
    }
    setConditions([...conditions, newCondition])
  }

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index)
    setConditions(newConditions)
  }

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = [...conditions]
    if (newConditions[index]) {
      newConditions[index] = { ...newConditions[index], ...updates }
      setConditions(newConditions)
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
    
    // Clear validation error when attribute name is changed
    if (errors[`condition_${index}_name`]) {
      const newErrors = { ...errors }
      delete newErrors[`condition_${index}_name`]
      setErrors(newErrors)
    }
  }

  const toggleAttributeDropdown = (index: number) => {
    setShowAttributeDropdowns(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const isBaseAttribute = (attributeName: string) => {
    return Object.keys(BASE_ATTRIBUTES).includes(attributeName)
  }

  const handleAttributeTypeChange = (index: number, value: DataType) => {
    // Reset operator when type changes
    const availableOperators = OPERATORS_BY_TYPE[value]
    const condition = conditions[index]
    if (condition) {
      updateCondition(index, { 
        attribute_name: condition.attribute_name,
        attribute_type: value, 
        operator_selected: availableOperators[0],
        attribute_values: [] // Reset values when type changes
      })
    }
  }

  const handleOperatorChange = (index: number, value: string) => {
    updateCondition(index, { operator_selected: value })
  }

  const handleValuesChange = (index: number, values: string[]) => {
    updateCondition(index, { attribute_values: values })
    // Clear validation error when values are updated and we have at least one value
    if (values.length > 0 && errors[`condition_${index}_values`]) {
      const newErrors = { ...errors }
      delete newErrors[`condition_${index}_values`]
      setErrors(newErrors)
    }
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
      
      case 'DATE': {
        // Basic date validation - you might want to enhance this
        const dateValue = new Date(trimmedValue)
        if (isNaN(dateValue.getTime())) {
          toast.error('Please enter a valid date (YYYY-MM-DD or ISO string)')
          return null
        }
        return trimmedValue
      }
      
      case 'SEMVER': {
        // Validate semantic version format using semver library
        if (!semver.valid(trimmedValue)) {
          toast.error('Please enter a valid semantic version (e.g., 1.0.0)')
          return null
        }
        return trimmedValue
      }
      
      case 'STRING':
      case 'ARRAY':
      default:
        return trimmedValue
    }
  }

  const addValue = (conditionIndex: number, value: string) => {
    const condition = conditions[conditionIndex]
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
      // Validate each array value as string (arrays contain string values)
      const validatedArrayValues = arrayValues.filter(val => {
        if (!val) return false
        return true // Arrays can contain any string values
      })
      
      // Check for duplicates
      const existingValues = new Set(condition.attribute_values)
      const newUniqueValues = validatedArrayValues.filter(val => !existingValues.has(val))
      
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
    
    // Update the condition with new values
    updateCondition(conditionIndex, { attribute_values: newValues })
    
    // Clear validation error immediately after adding values
    if (newValues.length > 0 && errors[`condition_${conditionIndex}_values`]) {
      const newErrors = { ...errors }
      delete newErrors[`condition_${conditionIndex}_values`]
      setErrors(newErrors)
    }
  }

  const addDateValue = (conditionIndex: number, date: Date | undefined) => {
    if (!date) return
    
    const condition = conditions[conditionIndex]
    if (!condition) return

    const dateString = date.toISOString()
    // console.log('RuleModal - Date selected:', date)
    // console.log('RuleModal - ISO string stored:', dateString)

    // For DATE, only allow one value (replace existing)
    const newValues = [dateString]
    updateCondition(conditionIndex, { attribute_values: newValues })
    
    // Clear validation error immediately after adding values
    if (newValues.length > 0 && errors[`condition_${conditionIndex}_values`]) {
      const newErrors = { ...errors }
      delete newErrors[`condition_${conditionIndex}_values`]
      setErrors(newErrors)
    }
  }

  const removeValue = (conditionIndex: number, valueIndex: number) => {
    const condition = conditions[conditionIndex]
    if (condition) {
      const newValues = condition.attribute_values.filter((_, i) => i !== valueIndex)
      handleValuesChange(conditionIndex, newValues)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!ruleName.trim()) {
      newErrors.name = 'Rule name is required'
    }

    // Require at least one condition
    if (conditions.length === 0) {
      toast.error('You need to add at least one condition')
      return false
    }

    // Validate each condition
    conditions.forEach((condition, index) => {
      if (!condition.attribute_name.trim()) {
        newErrors[`condition_${index}_name`] = 'Attribute name is required'
      }
      if (condition.attribute_values.length === 0) {
        newErrors[`condition_${index}_values`] = 'At least one value is required'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    // console.log('Form validation started')
    if (!validateForm()) {
      // console.log('Form validation failed')
      return
    }
    // console.log('Form validation passed')

    setLoading(true)
    toast.loading(mode === 'create' ? 'Creating rule...' : 'Updating rule...')
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    
    let url = `/${BACKEND_URL}/flag/addRules`
    let method = 'POST'
    const body: any = {
      name: ruleName,
      description: ruleDescription,
      flag_environment_id: environmentId,
      is_enabled: isEnabled,
      conditions: conditions
    }

    if (mode === 'edit' && existingRule) {
      url = `/${BACKEND_URL}/flag/updateFlagRule`
      method = 'PUT'
      body.ruleId = existingRule.id
    }

    // console.log('Making request to:', url)
    // console.log('Request body:', body)
    // console.log('Conditions being sent:', JSON.stringify(conditions, null, 2))

    try {
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      // console.log('Response received:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json() as { success: boolean; message?: string }
      // console.log('Response data:', data)
      
      if (data.success) {
        // console.log('Success - closing modal and refreshing')
        toast.dismiss()
        setOpen(false)
        router.refresh()
        toast.success(mode === 'create' ? 'Rule created successfully!' : 'Rule updated successfully!')
      } else {
        throw new Error(data.message || 'Failed to save rule')
      }
    } catch (error) {
      // console.error('Error:', error)
      toast.dismiss()
      setErrors({ submit: 'Failed to save rule. Please try again.' })
      toast.error('Failed to save rule. Please try again.')
    } finally {
      // console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const getValuePlaceholder = (attributeType: DataType) => {
    switch (attributeType) {
      case 'STRING':
        return 'Enter a text value (only one allowed)'
      case 'NUMBER':
        return 'Enter a number (only one allowed)'
      case 'BOOLEAN':
        return 'Enter true or false (only one allowed)'
      case 'DATE':
        return 'Enter YYYY-MM-DD or ISO string (only one allowed)'
      case 'SEMVER':
        return 'Enter 1.0.0 format (only one allowed)'
      case 'ARRAY':
        return 'Enter values separated by commas (multiple allowed)'
      default:
        return 'Enter a value'
    }
  }

  return (
    <>
      <Toaster />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {mode === 'create' ? (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-900">
              <div className="bg-amber-100 p-2 rounded-md mr-3">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              {mode === 'create' ? 'Create New Rule' : 'Edit Rule'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {mode === 'create' 
                ? 'Define conditions that determine when your flag should be evaluated'
                : 'Update the conditions and settings for this rule'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label htmlFor="rule-name" className="text-gray-900 font-medium">Rule Name *</Label>
              <Input
                id="rule-name"
                value={ruleName}
                onChange={(e) => {
                  setRuleName(e.target.value)
                  if (errors.name) {
                    const newErrors = { ...errors }
                    delete newErrors.name
                    setErrors(newErrors)
                  }
                }}
                placeholder="e.g., Premium Users Rule"
              />
              {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            </div>

            {/* Rule Description */}
            <div className="space-y-2">
              <Label htmlFor="rule-description" className="text-gray-900 font-medium">Description (Optional)</Label>
              <Textarea
                id="rule-description"
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                placeholder="Describe when this rule should apply..."
                className="min-h-[80px]"
              />
            </div>

            {/* Rule Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded ${isEnabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <Target className={`w-5 h-5 ${isEnabled ? 'text-emerald-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <Label className="text-gray-900 font-medium">Rule Status</Label>
                  <p className="text-sm text-gray-600">
                    {isEnabled ? 'Rule is enabled and will be evaluated' : 'Rule is disabled and will be ignored'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-900 font-medium">Conditions</Label>
                <Button
                  onClick={addCondition}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              {conditions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">No conditions added yet.</p>
                  <p className="text-sm text-gray-500">Click &quot;Add Condition&quot; to define targeting rules.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conditions.map((condition, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-gray-900 font-medium">Condition {index + 1}</h4>
                          <Button
                            onClick={() => removeCondition(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Attribute Name */}
                          <div className="space-y-2">
                            <Label className="text-gray-900 font-medium">Attribute Name</Label>
                            <div className="relative" ref={(el) => { dropdownRefs.current[index] = el }}>
                              <div className="flex">
                                <Input
                                  value={condition.attribute_name}
                                  onChange={(e) => handleAttributeNameChange(index, e.target.value)}
                                  placeholder="Type custom attribute or select from dropdown"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      const input = e.target as HTMLInputElement
                                      if (input.value.trim()) {
                                        // Check if it conflicts with base attributes
                                        if (Object.keys(BASE_ATTRIBUTES).includes(input.value.trim())) {
                                          toast.error('Please use a different name. This attribute already exists as a base attribute.')
                                          return
                                        }
                                        handleAttributeNameChange(index, input.value.trim())
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={() => toggleAttributeDropdown(index)}
                                  className="ml-1 bg-gray-100 border-gray-300 hover:bg-gray-200 h-10 w-10 p-0"
                                  size="sm"
                                >
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
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
                                      className="w-full px-2 py-1.5 text-left text-gray-900 hover:bg-gray-50 focus:bg-gray-50 flex justify-between items-center text-sm"
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
                            
                            {errors[`condition_${index}_name`] && (
                              <p className="text-red-600 text-sm">{errors[`condition_${index}_name`]}</p>
                            )}
                          </div>

                          {/* Attribute Type */}
                          <div className="space-y-2">
                            <Label className="text-gray-900 font-medium">Data Type</Label>
                            <Select
                              value={condition.attribute_type}
                              onValueChange={(value) => handleAttributeTypeChange(index, value as DataType)}
                              disabled={isBaseAttribute(condition.attribute_name)}
                            >
                              <SelectTrigger className={isBaseAttribute(condition.attribute_name) ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {dataTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
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
                          <div className="space-y-2">
                            <Label className="text-gray-900 font-medium">Operator</Label>
                            <Select
                              value={condition.operator_selected}
                              onValueChange={(value) => handleOperatorChange(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {OPERATORS_BY_TYPE[condition.attribute_type].map((operator) => (
                                  <SelectItem
                                    key={operator}
                                    value={operator}
                                  >
                                    {operator.replace(/_/g, ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Values */}
                          <div className="space-y-2">
                            <Label className="text-gray-900 font-medium">Values</Label>
                            <div className="space-y-2">
                              {condition.attribute_type === 'DATE' ? (
                                <LightDateTimePicker
                                  value={undefined}
                                  onChange={(date: Date | undefined) => addDateValue(index, date)}
                                  placeholder={getValuePlaceholder(condition.attribute_type)}
                                />
                              ) : (
                                <Input
                                  placeholder={getValuePlaceholder(condition.attribute_type)}
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
                                <div className="flex items-center space-x-2 text-sm text-indigo-600 bg-indigo-50 p-2 rounded">
                                  <Info className="w-4 h-4" />
                                  <span>For arrays, enter multiple values separated by commas. You can add multiple entries.</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                                  <Info className="w-4 h-4" />
                                  <span>Only one value is allowed for this data type. Adding a new value will replace the existing one.</span>
                                </div>
                              )}
                              {condition.attribute_values.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {condition.attribute_values.map((value, valueIndex) => (
                                    <Badge
                                      key={valueIndex}
                                      variant="secondary"
                                      className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                                    >
                                      {value}
                                      <button
                                        onClick={() => removeValue(index, valueIndex)}
                                        className="ml-2 hover:bg-red-100 rounded-full p-0.5"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {errors[`condition_${index}_values`] && (
                                <p className="text-red-600 text-sm">{errors[`condition_${index}_values`]}</p>
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

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Rule' : 'Save Changes'}
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