"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultipleSelector } from "@/components/ui/multiple-selector"
import { useFlagCreation } from "../../../../contexts/flag-creation"
import { flag_type } from '@repo/db/client'
import { ArrowRight, Flag } from "lucide-react"
import { Toaster, toast } from "react-hot-toast"

const flagTypeOptions = [
  { value: 'BOOLEAN', label: 'Boolean', description: 'True/False toggle' },
  { value: 'STRING', label: 'String', description: 'Text value' },
  { value: 'NUMBER', label: 'Number', description: 'Numeric value' },
  { value: 'JSON', label: 'JSON', description: 'Complex JSON object' },
  { value: 'AB_TEST', label: 'A/B Test', description: 'Multi-variant testing' },
  { value: 'MULTIVARIATE', label: 'Multivariate', description: 'Multiple value options' }
] as const

// Helper function to generate key from name
function generateKey(name: string): string {
  const baseKey = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // Add 6-digit random suffix
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return baseKey ? `${baseKey}-${suffix}` : `flag-${suffix}`;
}

export default function DetailsPage() {
  const router = useRouter()
  const { state, updateDetails } = useFlagCreation()

  // Auto-generate key when name changes
  useEffect(() => {
    if (state.name) {
      const generatedKey = generateKey(state.name)
      updateDetails({ key: generatedKey })
    }
  }, [state.name, updateDetails])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    updateDetails({ name })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateDetails({ description: e.target.value })
  }

  const handleFlagTypeChange = (value: string) => {
    updateDetails({ flag_type: value as flag_type })
  }

  const handleTagsChange = (tags: string[]) => {
    updateDetails({ tags })
  }

  const validateForm = () => {
    if (!state.name.trim()) {
      toast.error('Name is required')
      return false
    }
    
    if (!state.flag_type) {
      toast.error('Flag type is required')
      return false
    }
    
    return true
  }

  const handleNext = () => {
    if (validateForm()) {
      router.push('/create-flag/environments')
    }
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-md">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Feature Flag</h1>
                <p className="text-sm text-gray-600">Step 1 of 4 - Define basic details</p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                1
              </div>
              <div className="h-1 w-16 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
                2
              </div>
              <div className="h-1 w-16 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
                3
              </div>
              <div className="h-1 w-16 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
                4
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="shadow-lg border-gray-200 bg-white rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Flag Details</CardTitle>
              <CardDescription className="text-gray-600">
                Define the basic information for your feature flag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={state.name}
                  onChange={handleNameChange}
                  placeholder="e.g., Dark Mode Toggle"
                  className="h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Key (auto-generated) */}
              <div className="space-y-2">
                <Label htmlFor="key" className="text-sm font-medium text-gray-700">
                  Key (auto-generated)
                </Label>
                <Input
                  id="key"
                  value={state.key}
                  readOnly
                  placeholder="auto-generated-from-name"
                  className="h-10 bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">
                  This key is automatically generated from the name with a unique suffix and will be used in your code
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={handleDescriptionChange}
                  placeholder="Describe what this feature flag controls..."
                  className="min-h-[80px] border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Flag Type */}
              <div className="space-y-2">
                <Label htmlFor="flag-type" className="text-sm font-medium text-gray-700">
                  Flag Type *
                </Label>
                <Select value={state.flag_type} onValueChange={handleFlagTypeChange}>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Select flag type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {flagTypeOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="py-2 px-3 hover:bg-gray-50 focus:bg-gray-50"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{option.label}</span>
                          <span className="text-xs text-gray-500">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
                  Tags
                </Label>
                <MultipleSelector
                  value={state.tags}
                  onValueChange={handleTagsChange}
                  placeholder="Add tags to organize your flag..."
                  emptyIndicator={
                    <p className="text-center text-sm leading-8 text-gray-400">
                      No tags found. Type to create new ones.
                    </p>
                  }
                  className="min-h-[40px] border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500">Press Enter to create a new tag</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleNext} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 font-medium rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <span>Next: Environments</span>
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
