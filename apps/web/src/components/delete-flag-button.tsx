'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' // or your preferred toast library

interface DeleteFlagButtonProps {
  flagId: string
  flagName: string
}

export function DeleteFlagButton({ flagId, flagName }: DeleteFlagButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/flag/deleteFeatureFlag/${flagId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Environment deleted successfully')
        // Refresh the page to show updated data
        router.push("/flags");
        setIsOpen(false)
      } else {
        throw new Error(result.message || 'Failed to delete environment')
      }
    } catch (error) {
      console.error('Error deleting environment:', error)
      toast.error('Failed to delete environment. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-red-700 text-red-300 hover:bg-red-800/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-800 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete Flag</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            Are you sure you want to delete the <span className="font-medium text-white">"{flagName}"</span> Feature Flag? 
            This action cannot be undone and will permanently remove all configuration data for this environment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Feature Flag
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}