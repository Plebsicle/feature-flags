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
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Flag className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Feature Flag</h1>
              <p className="text-gray-600">Step 1 of 4</p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">1</div>
            <div className="h-1 w-16 bg-gray-200"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">2</div>
            <div className="h-1 w-16 bg-gray-200"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">3</div>
            <div className="h-1 w-16 bg-gray-200"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">4</div>
          </div>
        </div>

        {/* Form */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Flag Details</CardTitle>
            <CardDescription>
              Define the basic information for your feature flag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={state.name}
                onChange={handleNameChange}
                placeholder="e.g., Dark Mode Toggle"
              />
            </div>

            {/* Key (auto-generated) */}
            <div className="space-y-2">
              <Label htmlFor="key">Key (auto-generated)</Label>
              <Input
                id="key"
                value={state.key}
                readOnly
                placeholder="auto-generated-from-name"
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600">This key is automatically generated from the name and will be used in your code</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={state.description}
                onChange={handleDescriptionChange}
                placeholder="Describe what this feature flag controls..."
                className="min-h-[100px]"
              />
            </div>

            {/* Flag Type */}
            <div className="space-y-2">
              <Label htmlFor="flag-type">Flag Type *</Label>
              <Select value={state.flag_type} onValueChange={handleFlagTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flag type" />
                </SelectTrigger>
                <SelectContent>
                  {flagTypeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <MultipleSelector
                value={state.tags}
                onValueChange={handleTagsChange}
                placeholder="Add tags to organize your flag..."
                emptyIndicator={
                  <p className="text-center text-lg leading-10 text-gray-400">
                    No tags found. Type to create new ones.
                  </p>
                }
              />
              <p className="text-xs text-gray-600">Press Enter to create a new tag</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-6">
              <Button onClick={handleNext} className="flex items-center space-x-2">
                <span>Next: Environments</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
