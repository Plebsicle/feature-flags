'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import { Toaster, toast } from 'react-hot-toast'

interface DeleteRuleButtonProps {
  ruleId: string
  ruleName: string
}

export default function DeleteRuleButton({ ruleId, ruleName }: DeleteRuleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const promise = fetch(`/${backendUrl}/flag/deleteRule/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

    toast.promise(promise, {
      loading: 'Deleting rule...',
      success: (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = response.json() as Promise<{ success: boolean; message?: string }>;
        result.then(data => {
            if (data.success) {
                router.refresh()
            } else {
                throw new Error(data.message || 'Failed to delete rule')
            }
        })
        return 'Rule deleted successfully'
      },
      error: (err) => {
        console.error('Error deleting rule:', err)
        return 'Failed to delete rule. Please try again.'
      },
    }).finally(() => {
        setIsDeleting(false)
    })
  }

  return (
    <>
      <Toaster />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the rule "{ruleName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Rule'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 