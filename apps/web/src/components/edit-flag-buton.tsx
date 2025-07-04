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
import { Toaster, toast } from 'react-hot-toast'

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
    // console.log(flagId);
    const promise = fetch(`/${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/flag/updateFeatureFlag`, {
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
    });

    toast.promise(promise, {
        loading: 'Updating feature flag...',
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
                    throw new Error(data.message || 'Failed to update feature flag')
                }
            })
            return 'Feature flag updated successfully'
        },
        error: (err) => {
            // console.error('Error updating feature flag:', err)
            return 'Failed to update feature flag. Please try again.'
        }
    }).finally(() => {
        setIsLoading(false)
    });
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
    <>
      <Toaster />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-md mr-3">
                <Edit className="w-5 h-5 text-indigo-600" />
              </div>
              Edit Feature Flag: {flagName}
            </DialogTitle>
            <DialogDescription>
              Modify the configuration for this feature flag. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Flag Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                {isActive ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
                <div>
                  <Label className="text-gray-900 font-medium">Flag Status</Label>
                  <p className="text-sm text-gray-600">
                    {isActive ? 'This flag is currently active' : 'This flag is currently inactive'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900 font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this feature flag..."
                className="min-h-[100px]"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Provide a clear description of what this feature flag controls
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-gray-900 font-medium flex items-center">
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
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Tags Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-gray-200"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Use tags to categorize and organize your feature flags. Click on a tag to remove it.
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