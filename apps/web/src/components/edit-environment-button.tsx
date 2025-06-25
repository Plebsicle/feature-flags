'use client'

import { useState } from 'react'
import { Edit, Save, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'

interface EditEnvironmentModalProps {
  environmentId: string
  environmentName: string
  currentValue: any
  currentDefaultValue: any
  currentIsEnabled: boolean
}

export function EditEnvironmentModal({ 
  environmentId, 
  environmentName, 
  currentValue, 
  currentDefaultValue, 
  currentIsEnabled 
}: EditEnvironmentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEnabled, setIsEnabled] = useState(currentIsEnabled)
  const [value, setValue] = useState(() => {
    if (currentValue === null || currentValue === undefined) return ''
    if (typeof currentValue === 'object') return JSON.stringify(currentValue, null, 2)
    return String(currentValue)
  })
  const [defaultValue, setDefaultValue] = useState(() => {
    if (currentDefaultValue === null || currentDefaultValue === undefined) return ''
    if (typeof currentDefaultValue === 'object') return JSON.stringify(currentDefaultValue, null, 2)
    return String(currentDefaultValue)
  })
  
  const router = useRouter()
  const wrapValue = (innerValue: any): { value: any } => {
  return { value: innerValue }
  }
  const parseValue = (inputValue: string) => {
    if (inputValue.trim() === '' || inputValue.trim() === 'null') return null
    
    // Try to parse as JSON first
    try {
      return JSON.parse(inputValue)
    } catch {
      // If JSON parse fails, return as string
      return inputValue
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    const parsedValue = wrapValue(value)
    const parsedDefaultValue = wrapValue(defaultValue)

    const promise = fetch(`/${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/flag/updateEnvironment`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            environment_id: environmentId,
            is_enabled: isEnabled,
            value: parsedValue,
            default_value: parsedDefaultValue,
        }),
    });

    toast.promise(promise, {
        loading: 'Updating environment...',
        success: (response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const result = response.json() as Promise<{ success: boolean; message?: string }>;
            result.then(data => {
                if (data.success) {
                    router.refresh()
                    setIsOpen(false)
                } else {
                    throw new Error(data.message || 'Failed to update environment')
                }
            })
            return 'Environment updated successfully'
        },
        error: (err) => {
            console.error('Error updating environment:', err)
            return 'Failed to update environment. Please check your values and try again.'
        }
    }).finally(() => {
        setIsLoading(false)
    });
  }

  const handleCancel = () => {
    // Reset values to original
    setIsEnabled(currentIsEnabled)
    setValue(() => {
      if (currentValue === null || currentValue === undefined) return ''
      if (typeof currentValue === 'object') return JSON.stringify(currentValue, null, 2)
      return String(currentValue)
    })
    setDefaultValue(() => {
      if (currentDefaultValue === null || currentDefaultValue === undefined) return ''
      if (typeof currentDefaultValue === 'object') return JSON.stringify(currentDefaultValue, null, 2)
      return String(currentDefaultValue)
    })
    setIsOpen(false)
  }

  return (
    <>
      <Toaster />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-md mr-3">
                <Edit className="w-5 h-5 text-indigo-600" />
              </div>
              Edit Environment: {environmentName}
            </DialogTitle>
            <DialogDescription>
              Modify the configuration for this environment. Values can be strings, numbers, booleans, or JSON objects.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Environment Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                {isEnabled ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
                <div>
                  <Label className="text-gray-900 font-medium">Environment Status</Label>
                  <p className="text-sm text-gray-600">
                    {isEnabled ? 'This environment is currently enabled' : 'This environment is currently disabled'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            {/* Current Value */}
            <div className="space-y-2">
              <Label htmlFor="value" className="text-gray-900 font-medium">
                Current Value
              </Label>
              <Textarea
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value (string, number, boolean, or JSON)"
                className="min-h-[100px] font-mono text-sm"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Examples: "hello", 123, true, false, null, {`{"key": "value"}`}
              </p>
            </div>

            {/* Default Value */}
            <div className="space-y-2">
              <Label htmlFor="defaultValue" className="text-gray-900 font-medium">
                Default Value
              </Label>
              <Textarea
                id="defaultValue"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Enter default value (fallback when conditions are not met)"
                className="min-h-[100px] font-mono text-sm"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                This value is used when no rules match the evaluation context
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}