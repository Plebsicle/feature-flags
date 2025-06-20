"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useFlagCreation } from "../../../contexts/flag-creation"
import { Condition } from '@repo/types/rule-config'
import { DataType, OPERATORS_BY_TYPE, BASE_ATTRIBUTES } from '@repo/types/attribute-config'
import { ArrowRight, ArrowLeft, Plus, X, Target, Info } from "lucide-react"

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRules({ name: e.target.value })
    if (errors.name) {
      setErrors({ ...errors, name: '' })
    }
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
    updateCondition(index, { attribute_name: value })
    // Clear validation error when attribute name is changed
    if (errors[`condition_${index}_name`]) {
      const newErrors = { ...errors }
      delete newErrors[`condition_${index}_name`]
      setErrors(newErrors)
    }
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

  const addValue = (conditionIndex: number, value: string) => {
    const condition = state.rules.conditions[conditionIndex]
    if (condition && value.trim()) {
      let newValues: string[] = []
      
      if (condition.attribute_type === 'ARRAY') {
        // For array type, split by comma and trim each value
        const arrayValues = value.split(',').map(v => v.trim()).filter(v => v.length > 0)
        const uniqueValues = [...new Set([...condition.attribute_values, ...arrayValues])]
        newValues = uniqueValues
      } else {
        // For other types, add single value if not already present
        if (!condition.attribute_values.includes(value.trim())) {
          newValues = [...condition.attribute_values, value.trim()]
        } else {
          newValues = condition.attribute_values
        }
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
  }

  const removeValue = (conditionIndex: number, valueIndex: number) => {
    const condition = state.rules.conditions[conditionIndex]
    if (condition) {
      const newValues = condition.attribute_values.filter((_, i) => i !== valueIndex)
      handleValuesChange(conditionIndex, newValues)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!state.rules.name.trim()) {
      newErrors.name = 'Rule name is required'
    }

    // Validate conditions
    state.rules.conditions.forEach((condition, index) => {
      if (!condition.attribute_name.trim()) {
        newErrors[`condition_${index}_name`] = 'Attribute name is required'
      }
      // Check if the condition has any values
      if (!condition.attribute_values || condition.attribute_values.length === 0) {
        newErrors[`condition_${index}_values`] = 'At least one value is required'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
        return 'Enter number value and press Enter'
      case 'BOOLEAN':
        return 'Enter true or false and press Enter'
      case 'DATE':
        return 'Enter date value and press Enter'
      case 'SEMVER':
        return 'Enter semantic version (e.g., 1.0.0) and press Enter'
      default:
        return 'Enter value and press Enter'
    }
  }

  return (
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
              {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
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
                            <Input
                              value={condition.attribute_name}
                              onChange={(e) => handleAttributeNameChange(index, e.target.value)}
                              placeholder="e.g., userId, email, country"
                              className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400"
                            />
                            {errors[`condition_${index}_name`] && (
                              <p className="text-red-400 text-sm">{errors[`condition_${index}_name`]}</p>
                            )}
                          </div>

                          {/* Attribute Type */}
                          <div className="space-y-2">
                            <Label className="text-white">Data Type</Label>
                            <Select
                              value={condition.attribute_type}
                              onValueChange={(value) => handleAttributeTypeChange(index, value as DataType)}
                            >
                              <SelectTrigger className="bg-slate-600/50 border-slate-500 text-white">
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
                            <Label className="text-white">Values</Label>
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
                              {condition.attribute_type === 'ARRAY' && (
                                <div className="flex items-center space-x-2 text-sm text-blue-400">
                                  <Info className="w-4 h-4" />
                                  <span>For arrays, enter multiple values separated by commas</span>
                                </div>
                              )}
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
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {errors[`condition_${index}_values`] && (
                                <p className="text-red-400 text-sm">{errors[`condition_${index}_values`]}</p>
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
  )
}