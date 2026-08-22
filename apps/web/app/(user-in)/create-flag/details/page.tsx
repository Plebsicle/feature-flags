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
import { ArrowRight, Flag } from "@/components/ui/icons"
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
      <div className="min-h-screen bg-transparent p-4 lg:p-6 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Flag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Create Feature Flag</h1>
                <p className="text-sm font-medium text-muted-foreground">Step 1 of 4 - Define basic details</p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                1
              </div>
              <div className="h-0.5 w-16 bg-border"></div>
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground text-sm font-medium">
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
          </div>

          {/* Form */}
          <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-xl font-semibold text-foreground">Flag Details</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Define the basic information for your feature flag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={state.name}
                  onChange={handleNameChange}
                  placeholder="e.g., Dark Mode Toggle"
                  className="h-10 border-border rounded-lg bg-background text-sm focus:border-primary"
                />
              </div>

              {/* Key (auto-generated) */}
              <div className="space-y-2">
                <Label htmlFor="key" className="text-sm font-medium text-foreground">
                  Key (auto-generated)
                </Label>
                <Input
                  id="key"
                  value={state.key}
                  readOnly
                  placeholder="auto-generated-from-name"
                  className="h-10 bg-muted/50 border-border border-dashed text-muted-foreground cursor-not-allowed rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This key is automatically generated from the name with a unique suffix and will be used in your code
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={handleDescriptionChange}
                  placeholder="Describe what this feature flag controls..."
                  className="min-h-[80px] border-border rounded-lg bg-background text-sm focus:border-primary resize-none"
                />
              </div>

              {/* Flag Type */}
              <div className="space-y-2">
                <Label htmlFor="flag-type" className="text-sm font-medium text-foreground">
                  Flag Type *
                </Label>
                <Select value={state.flag_type} onValueChange={handleFlagTypeChange}>
                  <SelectTrigger className="h-10 border-border rounded-lg bg-background text-sm focus:border-primary">
                    <SelectValue placeholder="Select flag type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-lg shadow-sm text-sm">
                    {flagTypeOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="py-2 px-3 hover:bg-muted focus:bg-muted cursor-pointer rounded-md"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium text-foreground">
                  Tags
                </Label>
                <MultipleSelector
                  value={state.tags}
                  onValueChange={handleTagsChange}
                  placeholder="Add tags to organize your flag..."
                  emptyIndicator={
                    <p className="text-center text-xs font-medium text-muted-foreground">
                      No tags found. Type to create new ones.
                    </p>
                  }
                  className="min-h-[40px] border-border rounded-lg bg-background text-sm focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">Press Enter to create a new tag</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-6 border-t border-border/50">
                <Button 
                  onClick={handleNext} 
                  className="font-medium text-sm rounded-lg"
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
