"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Condition } from '@repo/types/rule-config'
import { DataType, OPERATORS_BY_TYPE, BASE_ATTRIBUTES } from '@repo/types/attribute-config'
import { Plus, X, Target, Info, Edit, Save, Loader2 } from "lucide-react"
import { Toaster, toast } from 'react-hot-toast'

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

export default function RuleModal({ mode, environmentId, existingRule , flagRuleId }: RuleModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [ruleName, setRuleName] = useState('')
  const [ruleDescription, setRuleDescription] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [conditions, setConditions] = useState<Condition[]>([])

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
          console.error('Error parsing conditions:', error)
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

  const addValue = (conditionIndex: number, value: string) => {
    const condition = conditions[conditionIndex]
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

    // Validate conditions
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
    if (!validateForm()) {
      return
    }

    setLoading(true)
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    
    let url = `/${BACKEND_URL}/flag/rule`
    let method = 'POST'
    let body: any = {
      name: ruleName,
      description: ruleDescription,
      flag_environment_id: environmentId,
      is_enabled: isEnabled,
      conditions: conditions
    }

    if (mode === 'edit' && existingRule) {
      url = `/${BACKEND_URL}/flag/rule`
      method = 'PUT'
      body.ruleId = existingRule.id
    }

    const promise = fetch(url, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    toast.promise(promise, {
      loading: mode === 'create' ? 'Creating rule...' : 'Updating rule...',
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
            throw new Error(data.message || 'Failed to save rule')
          }
        })
        return mode === 'create' ? 'Rule created successfully!' : 'Rule updated successfully!'
      },
      error: (err) => {
        console.error('Error saving rule:', err)
        setErrors({ submit: 'Failed to save rule. Please try again.' })
        return 'Failed to save rule. Please try again.'
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  const getValuePlaceholder = (attributeType: DataType) => {
    switch (attributeType) {
      case 'STRING':
        return 'Enter a text value'
      case 'NUMBER':
        return 'Enter a number'
      case 'BOOLEAN':
        return 'true or false'
      case 'DATE':
        return 'YYYY-MM-DD or ISO string'
      case 'SEMVER':
        return '1.0.0 (semantic version)'
      case 'ARRAY':
        return 'Enter values separated by commas'
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
                  <p className="text-sm text-gray-500">Click "Add Condition" to define targeting rules.</p>
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
                            <Input
                              value={condition.attribute_name}
                              onChange={(e) => handleAttributeNameChange(index, e.target.value)}
                              placeholder="e.g., userId, email, country"
                            />
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
                            >
                              <SelectTrigger>
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
                              {condition.attribute_type === 'ARRAY' && (
                                <div className="flex items-center space-x-2 text-sm text-indigo-600 bg-indigo-50 p-2 rounded">
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