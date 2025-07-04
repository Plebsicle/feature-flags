"use client"

import { useState } from "react"
import { UserPlus} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toaster, toast } from "react-hot-toast"

type UserRole = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER"

interface InviteMembersModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (emails: string[], role: UserRole) => Promise<void>
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Member", 
  VIEWER: "Viewer",
  OWNER: "Owner"
}

const roleDescriptions: Record<UserRole, string> = {
  ADMIN: "Full access to manage organization",
  MEMBER: "Can create and manage flags",
  VIEWER: "Read-only access to flags",
  OWNER: "Organization owner with full control"
}

export function InviteMembersModal({ isOpen, onClose, onInvite }: InviteMembersModalProps) {
  const [emailInput, setEmailInput] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole>("MEMBER")
  const [isLoading, setIsLoading] = useState(false)
  const [emailList, setEmailList] = useState<string[]>([])

  const availableRoles: UserRole[] = ["ADMIN", "MEMBER", "VIEWER"]

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0)
  }

  const handleEmailInputChange = (value: string) => {
    setEmailInput(value)
    setEmailList(parseEmails(value))
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async () => {
    const emails = parseEmails(emailInput)
    
    if (emails.length === 0) {
      return
    }

    const invalidEmails = emails.filter(email => !validateEmail(email))
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(", ")}`)
      return
    }

    setIsLoading(true)
    const promise = onInvite(emails, selectedRole);

    toast.promise(promise, {
        loading: 'Sending invitations...',
        success: () => {
            setEmailInput("")
            setEmailList([])
            setSelectedRole("MEMBER")
            onClose()
            return 'Invitations sent successfully!'
        },
        error: (err: any) => {
            console.error("Failed to send invitations:", err)
            return 'Failed to send invitations. Please try again.'
        }
    }).finally(() => {
        setIsLoading(false)
    });
  }

  const handleClose = () => {
    if (!isLoading) {
      setEmailInput("")
      setEmailList([])
      setSelectedRole("MEMBER")
      onClose()
    }
  }

  const validEmails = emailList.filter(validateEmail)
  const invalidEmails = emailList.filter(email => !validateEmail(email))

  return (
    <>
      <Toaster />
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-md">
                <UserPlus className="w-5 h-5 text-indigo-600" />
              </div>
              Invite Members
            </DialogTitle>
            <DialogDescription>
              Invite new members to your organization by entering their email addresses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Email Addresses
              </label>
              <textarea
                value={emailInput}
                onChange={(e) => handleEmailInputChange(e.target.value)}
                placeholder="Enter email addresses separated by commas or new lines&#10;example@domain.com, another@domain.com"
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none text-gray-900 placeholder-gray-500 bg-white"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-600">
                💡 Tip: Enter multiple email addresses separated by commas or on new lines
              </p>
              
              {/* Email Preview */}
              {emailList.length > 0 && (
                <div className="space-y-1">
                  {validEmails.length > 0 && (
                    <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">
                      ✓ Valid emails ({validEmails.length}): {validEmails.join(", ")}
                    </div>
                  )}
                  {invalidEmails.length > 0 && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      ✗ Invalid emails ({invalidEmails.length}): {invalidEmails.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Role
              </label>
              <Select
                value={selectedRole}
                onValueChange={(role) => setSelectedRole(role as UserRole)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem 
                      key={role} 
                      value={role}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{roleLabels[role]}</span>
                        <span className="text-xs text-gray-500">
                          {roleDescriptions[role]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || validEmails.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? "Sending..." : `Invite ${validEmails.length} Member${validEmails.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 