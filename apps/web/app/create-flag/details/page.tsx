"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultipleSelector } from "@/components/ui/multiple-selector"
import { useFlagCreation } from "../../../contexts/flag-creation"
import { flag_type } from '@repo/db/client'
import { ArrowRight, Flag } from "lucide-react"

const flagTypeOptions = [
  { value: 'BOOLEAN', label: 'Boolean', description: 'True/False toggle' },
  { value: 'STRING', label: 'String', description: 'Text value' },
  { value: 'NUMBER', label: 'Number', description: 'Numeric value' },
  { value: 'JSON', label: 'JSON', description: 'Complex JSON object' },
  { value: 'AB_TEST', label: 'A/B Test', description: 'Multi-variant testing' },
  { value: 'MULTIVARIATE', label: 'Multivariate', description: 'Multiple value options' },
  { value: 'KILL_SWITCH', label: 'Kill Switch', description: 'Emergency disable' },
] as const

// Helper function to generate key from name
function generateKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

export default function DetailsPage() {
  const router = useRouter()
  const { state, updateDetails } = useFlagCreation()
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (errors.name) {
      setErrors({ ...errors, name: '' })
    }
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
    const newErrors: Record<string, string> = {}
    
    if (!state.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!state.flag_type) {
      newErrors.flag_type = 'Flag type is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      router.push('/create-flag/environments')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Feature Flag</h1>
              <p className="text-neutral-400">Step 1 of 4</p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">1</div>
            <div className="h-1 w-16 bg-slate-700"></div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-medium">2</div>
            <div className="h-1 w-16 bg-slate-700"></div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-medium">3</div>
            <div className="h-1 w-16 bg-slate-700"></div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-medium">4</div>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
          <CardHeader>
            <CardTitle className="text-white">Flag Details</CardTitle>
            <CardDescription className="text-neutral-400">
              Define the basic information for your feature flag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Name *</Label>
              <Input
                id="name"
                value={state.name}
                onChange={handleNameChange}
                placeholder="e.g., Dark Mode Toggle"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
              {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
            </div>

            {/* Key (auto-generated) */}
            <div className="space-y-2">
              <Label htmlFor="key" className="text-white">Key (auto-generated)</Label>
              <Input
                id="key"
                value={state.key}
                readOnly
                placeholder="auto-generated-from-name"
                className="bg-slate-700/30 border-slate-600 text-slate-300 placeholder:text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">This key is automatically generated from the name and will be used in your code</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={state.description}
                onChange={handleDescriptionChange}
                placeholder="Describe what this feature flag controls..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
              />
            </div>

            {/* Flag Type */}
            <div className="space-y-2">
              <Label htmlFor="flag-type" className="text-white">Flag Type *</Label>
              <Select value={state.flag_type} onValueChange={handleFlagTypeChange}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select flag type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {flagTypeOptions.map((option) => (
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
              {errors.flag_type && <p className="text-red-400 text-sm">{errors.flag_type}</p>}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-white">Tags</Label>
              <MultipleSelector
                value={state.tags}
                onValueChange={handleTagsChange}
                placeholder="Add tags to organize your flag..."
                emptyIndicator={
                  <p className="text-center text-lg leading-10 text-slate-400">
                    No tags found. Type to create new ones.
                  </p>
                }
                className="bg-slate-700/50 border-slate-600"
              />
              <p className="text-xs text-slate-400">Press Enter to create a new tag</p>
            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
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
