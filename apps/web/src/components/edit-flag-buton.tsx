'use client'

import { useState } from 'react'
import { Edit, Save, X, Loader2, ToggleLeft, ToggleRight, Tag, Plus } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface EditFeatureFlagModalProps {
  flagId: string
  flagName: string
  currentDescription: string | null
  currentIsActive: boolean
  currentTags: string[]
}

export function EditFeatureFlagModal({ 
  flagId, 
  flagName, 
  currentDescription, 
  currentIsActive, 
  currentTags 
}: EditFeatureFlagModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isActive, setIsActive] = useState(currentIsActive)
  const [description, setDescription] = useState(currentDescription || '')
  const [tags, setTags] = useState<string[]>(currentTags || [])
  const [tagInput, setTagInput] = useState('')
  
  const router = useRouter()

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      // Remove last tag if input is empty and user presses backspace
      setTags(tags.slice(0, -1))
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    console.log(flagId);
    try {
      const response = await fetch(`/${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/flag/updateFeatureFlag`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flagId: flagId,
          flagDescription: description.trim() || null,
          isActive: isActive,
          tags: tags,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log(result);
      if (result.success) {
        toast.success('Feature flag updated successfully')
        router.refresh()
        setIsOpen(false)
      } else {
        throw new Error(result.message || 'Failed to update feature flag')
      }
    } catch (error) {
      console.error('Error updating feature flag:', error)
      toast.error('Failed to update feature flag. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset values to original
    setIsActive(currentIsActive)
    setDescription(currentDescription || '')
    setTags(currentTags || [])
    setTagInput('')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-slate-700 text-neutral-300 hover:bg-slate-800/50"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Edit className="w-5 h-5 mr-2 text-emerald-400" />
            Edit Feature Flag: {flagName}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Modify the configuration for this feature flag. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Flag Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center space-x-3">
              {isActive ? (
                <ToggleRight className="w-6 h-6 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <Label className="text-white font-medium">Flag Status</Label>
                <p className="text-sm text-neutral-400">
                  {isActive ? 'This flag is currently active' : 'This flag is currently inactive'}
                </p>
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this feature flag..."
              className="bg-slate-900/50 border-slate-700/50 text-white min-h-[100px]"
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-400">
              Provide a clear description of what this feature flag controls
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-white font-medium flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Tags
            </Label>
            
            {/* Tag Input */}
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag..."
                className="bg-slate-900/50 border-slate-700/50 text-white flex-1"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || isLoading}
                variant="outline"
                size="sm"
                className="border-slate-700 text-neutral-300 hover:bg-slate-800/50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Existing Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-900/30 rounded-lg border border-slate-700/30">
                {tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-slate-600 text-neutral-300 hover:border-red-500 hover:text-red-400 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-neutral-400">
              Press Enter or click the + button to add tags. Click tags to remove them.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
  )
}